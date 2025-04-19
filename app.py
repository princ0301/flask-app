# app.py
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_cors import CORS  # Added for React frontend
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
import os
import tempfile
import pickle
from azure.storage.blob import BlobServiceClient
from io import BytesIO
import json
from datetime import datetime
import uuid  # Added for client sessions

from langchain_google_genai import GoogleGenerativeAIEmbeddings
import google.generativeai as genai
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain.chains.question_answering import load_qa_chain
from langchain.prompts import PromptTemplate

from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.secret_key = os.urandom(24)

# Configure API keys
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
AZURE_CONNECTION_STRING = os.getenv("AZURE_CONN_STRING")
CONTAINER_NAME = os.getenv("AZURE_CONTAINER_NAME")
VECTOR_STORE_PATH = "vector_store/faiss_index"
PROCESSED_FILES_LIST_PATH = "vector_store/processed_files.pkl"
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs('chat_history', exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Dictionary to store client sessions
client_sessions = {}

# Azure Blob Storage Functions
def get_blob_client():
    try:
        blob_service_client = BlobServiceClient.from_connection_string(AZURE_CONNECTION_STRING)
        container_client = blob_service_client.get_container_client(CONTAINER_NAME)
        return container_client
    except Exception as e:
        print(f"Error connecting to Azure Blob Storage: {str(e)}")
        return None

def blob_exists(container_client, blob_path):
    try:
        blob_client = container_client.get_blob_client(blob_path)
        return blob_client.exists()
    except Exception:
        return False

def save_to_blob(container_client, blob_path, data):
    try:
        blob_client = container_client.get_blob_client(blob_path)
        blob_client.upload_blob(data, overwrite=True)
        return True
    except Exception as e:
        print(f"Error saving to Azure Blob Storage: {str(e)}")
        return False

def download_from_blob(container_client, blob_path):
    try:
        blob_client = container_client.get_blob_client(blob_path)
        if not blob_client.exists():
            return None
        
        download = blob_client.download_blob()
        downloaded_bytes = download.readall()
        return downloaded_bytes
    except Exception as e:
        print(f"Error downloading from Azure Blob Storage: {str(e)}")
        return None

def get_processed_files(container_client):
    processed_files = []
    data = download_from_blob(container_client, PROCESSED_FILES_LIST_PATH)
    if data:
        processed_files = pickle.loads(data)
    return processed_files

def save_processed_files(container_client, processed_files):
    data = pickle.dumps(processed_files)
    return save_to_blob(container_client, PROCESSED_FILES_LIST_PATH, data)

# PDF Processing Functions
def get_pdf_text(pdf_path):
    text = ""
    pdf_reader = PdfReader(pdf_path)
    for page in pdf_reader.pages:
        text += page.extract_text()
    return text

def get_text_chunks(text):
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_text(text)
    return chunks

def get_vector_store(text_chunks):
    embeddings = GoogleGenerativeAIEmbeddings(model='models/embedding-001')
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
    return vector_store

def merge_vector_stores(vector_store, container_client):
    existing_data = download_from_blob(container_client, VECTOR_STORE_PATH)
    if existing_data:
        with tempfile.TemporaryDirectory() as temp_dir:
            data_dict = pickle.loads(existing_data)
            
            with open(os.path.join(temp_dir, "index.faiss"), "wb") as f:
                f.write(data_dict["index.faiss"])
            with open(os.path.join(temp_dir, "index.pkl"), "wb") as f:
                f.write(data_dict["index.pkl"])
            
            embeddings = GoogleGenerativeAIEmbeddings(model='models/embedding-001')
            existing_store = FAISS.load_local(temp_dir, embeddings, allow_dangerous_deserialization=True)
            
            existing_store.merge_from(vector_store)
            
            existing_store.save_local(temp_dir)
            
            with open(os.path.join(temp_dir, "index.faiss"), "rb") as f:
                index_data = f.read()
            with open(os.path.join(temp_dir, "index.pkl"), "rb") as f:
                pkl_data = f.read()

            combined_data = pickle.dumps({"index.faiss": index_data, "index.pkl": pkl_data})
            return save_to_blob(container_client, VECTOR_STORE_PATH, combined_data)
    else:
        with tempfile.TemporaryDirectory() as temp_dir:
            vector_store.save_local(temp_dir)
            
            with open(os.path.join(temp_dir, "index.faiss"), "rb") as f:
                index_data = f.read()
            with open(os.path.join(temp_dir, "index.pkl"), "rb") as f:
                pkl_data = f.read()
            
            combined_data = pickle.dumps({"index.faiss": index_data, "index.pkl": pkl_data})
            return save_to_blob(container_client, VECTOR_STORE_PATH, combined_data)

# Conversational Chain
def get_conversational_chain():
    prompt_template = """
    You are a healthcare assistant providing medical information and advice based on the medical documents provided.
    Answer the question as detailed as possible from the provided medical context, making sure to provide accurate healthcare information.
    If the answer is not in the provided context, just say "I don't have enough information to answer that question based on the available medical documents."
    Do not provide any incorrect medical information or advice.

    Context:\n {context}?\n
    Question: \n{question}\n

    Answer:
    """

    model = ChatGroq(model="llama3-70b-8192", temperature=0.3)
    prompt = PromptTemplate(template=prompt_template, input_variables=["context", "question"])
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)
    return chain

# Query Functions
def query_local_vector_store(user_question, vector_store):
    docs = vector_store.similarity_search(user_question)
    
    chain = get_conversational_chain()
    
    response = chain(
        {"input_documents": docs, "question": user_question},
        return_only_outputs=True
    )
    
    return response["output_text"]

def query_azure_vector_store(user_question, container_client):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
     
    with tempfile.TemporaryDirectory() as temp_dir: 
        combined_data = download_from_blob(container_client, VECTOR_STORE_PATH)
        if not combined_data:
            return "No medical documents have been stored in the database yet. Please upload medical documents first."
        
        data_dict = pickle.loads(combined_data)
         
        with open(os.path.join(temp_dir, "index.faiss"), "wb") as f:
            f.write(data_dict["index.faiss"])
        with open(os.path.join(temp_dir, "index.pkl"), "wb") as f:
            f.write(data_dict["index.pkl"])
         
        vector_store = FAISS.load_local(temp_dir, embeddings, allow_dangerous_deserialization=True)
        
        docs = vector_store.similarity_search(user_question)
        
        chain = get_conversational_chain()
        
        response = chain(
            {"input_documents": docs, "question": user_question},
            return_only_outputs=True
        )
        
        return response["output_text"]

# Save chat history
def save_chat_history(user_question, response, mode='azure'):
    today = datetime.now().strftime("%d-%m-%Y")
    chat_file = f"chat_history/{today}_{mode}.json"
    
    if os.path.exists(chat_file):
        with open(chat_file, "r", encoding="utf-8") as f:
            existing_history = json.load(f)
    else:
        existing_history = []
    
    new_pair = [
        {"role": "user", "content": user_question, "timestamp": datetime.now().strftime("%H:%M:%S")},
        {"role": "assistant", "content": response, "timestamp": datetime.now().strftime("%H:%M:%S")}
    ]
    
    updated_history = new_pair + existing_history
    
    with open(chat_file, "w", encoding="utf-8") as f:
        json.dump(updated_history, f, ensure_ascii=False, indent=2)
    
    return updated_history

# Routes for React Frontend

@app.route('/api/start-session', methods=['POST'])
def start_session():
    session_id = str(uuid.uuid4())
    client_sessions[session_id] = {
        'pdf_processed': False,
        'vector_store_exists': False,
        'processed_files': [],
        'vector_store_path': None
    }
    return jsonify({'status': 'success', 'session_id': session_id})

@app.route('/api/upload', methods=['POST'])
def upload_api():
    session_id = request.form.get('session_id')
    
    # Check if session exists
    if not session_id or session_id not in client_sessions:
        session_id = str(uuid.uuid4())
        client_sessions[session_id] = {
            'pdf_processed': False,
            'vector_store_exists': False,
            'processed_files': [],
            'vector_store_path': None
        }
    
    # Handle file upload
    if 'pdfs' not in request.files:
        return jsonify({'status': 'error', 'message': 'No files uploaded', 'session_id': session_id})
    
    files = request.files.getlist('pdfs')
    
    if not files or files[0].filename == '':
        return jsonify({'status': 'error', 'message': 'No files selected', 'session_id': session_id})
    
    processed_files = []
    all_text = ""
    
    for file in files:
        if file and file.filename.endswith('.pdf'):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            text = get_pdf_text(file_path)
            all_text += text
            processed_files.append(filename)
    
    if all_text:
        text_chunks = get_text_chunks(all_text)
        vector_store = get_vector_store(text_chunks)
        
        client_sessions[session_id]['vector_store_exists'] = True
        client_sessions[session_id]['pdf_processed'] = True
        client_sessions[session_id]['processed_files'] = processed_files
        
        # Save vector store
        with tempfile.TemporaryDirectory() as temp_dir:
            vector_store.save_local(temp_dir)
            
            # Create a unique directory for this session's vector store
            session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
            os.makedirs(session_dir, exist_ok=True)
            
            # Save vector store in the session directory
            vector_store_dir = os.path.join(session_dir, "faiss_index")
            os.makedirs(vector_store_dir, exist_ok=True)
            
            # Copy index files from temp dir to session dir
            with open(os.path.join(temp_dir, "index.faiss"), "rb") as f:
                faiss_data = f.read()
            with open(os.path.join(temp_dir, "index.pkl"), "rb") as f:
                pkl_data = f.read()
            
            with open(os.path.join(vector_store_dir, "index.faiss"), "wb") as f:
                f.write(faiss_data)
            with open(os.path.join(vector_store_dir, "index.pkl"), "wb") as f:
                f.write(pkl_data)
            
            client_sessions[session_id]['vector_store_path'] = vector_store_dir
            
            # Save to Azure if requested
            if 'save_to_azure' in request.form and request.form['save_to_azure'] == 'true':
                container_client = get_blob_client()
                if container_client:
                    # Save PDFs to Azure
                    for filename in processed_files:
                        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                        with open(file_path, 'rb') as f:
                            pdf_content = f.read()
                            save_to_blob(container_client, f"pdfs/{filename}", pdf_content)
                    
                    # Save vector store to Azure
                    merge_vector_stores(vector_store, container_client)
                    
                    # Update processed files list
                    azure_processed_files = get_processed_files(container_client)
                    for filename in processed_files:
                        if filename not in azure_processed_files:
                            azure_processed_files.append(filename)
                    save_processed_files(container_client, azure_processed_files)
        
        return jsonify({
            'status': 'success', 
            'message': f"Processed {len(processed_files)} files",
            'session_id': session_id,
            'processed_files': processed_files
        })
    
    return jsonify({
        'status': 'error', 
        'message': 'Failed to process files',
        'session_id': session_id
    })

@app.route('/api/query', methods=['POST'])
def query_api():
    data = request.json
    user_question = data.get('question')
    mode = data.get('mode', 'upload')
    session_id = data.get('session_id')
    
    if not user_question:
        return jsonify({'status': 'error', 'message': 'No question provided'})
    
    if mode == 'upload':
        if session_id and session_id in client_sessions and client_sessions[session_id].get('pdf_processed', False):
            # Use the session's vector store
            vector_store_dir = client_sessions[session_id].get('vector_store_path')
            if vector_store_dir and os.path.exists(vector_store_dir):
                embeddings = GoogleGenerativeAIEmbeddings(model='models/embedding-001')
                try:
                    vector_store = FAISS.load_local(vector_store_dir, embeddings, allow_dangerous_deserialization=True)
                    response = query_local_vector_store(user_question, vector_store)
                except Exception as e:
                    response = f"Error loading vector store: {str(e)}"
            else:
                response = "Error loading vector store. Please process PDFs again."
        else:
            response = "Please upload and process PDF files first."
    else:  # Azure mode
        container_client = get_blob_client()
        if not container_client:
            response = "Failed to connect to Azure Storage. Please check your connection string and container name."
        elif not blob_exists(container_client, VECTOR_STORE_PATH):
            response = "No documents have been stored in Azure Storage yet. Please upload and save documents first."
        else:
            response = query_azure_vector_store(user_question, container_client)
    
    # Save chat history
    chat_history = save_chat_history(user_question, response, mode)
    
    return jsonify({
        'status': 'success',
        'response': response,
        'chat_history': chat_history
    })

@app.route('/api/azure-files', methods=['GET'])
def azure_files_api():
    container_client = get_blob_client()
    if container_client:
        processed_files = get_processed_files(container_client)
        return jsonify({
            'status': 'success',
            'files_count': len(processed_files) if processed_files else 0,
            'files': processed_files
        })
    else:
        return jsonify({
            'status': 'error',
            'message': 'Failed to connect to Azure Storage'
        })

@app.route('/api/chat-history', methods=['GET'])
def get_chat_history():
    mode = request.args.get('mode', 'azure')
    today = datetime.now().strftime("%d-%m-%Y")
    chat_file = f"chat_history/{today}_{mode}.json"
    
    if os.path.exists(chat_file):
        with open(chat_file, "r", encoding="utf-8") as f:
            chat_history = json.load(f)
    else:
        chat_history = []
    
    return jsonify({
        'status': 'success',
        'chat_history': chat_history
    })

@app.route('/api/clear-chat', methods=['POST'])
def clear_chat_api():
    data = request.json
    mode = data.get('mode', 'azure')
    today = datetime.now().strftime("%d-%m-%Y")
    chat_file = f"chat_history/{today}_{mode}.json"
    
    if os.path.exists(chat_file):
        os.remove(chat_file)
    
    return jsonify({
        'status': 'success',
        'message': 'Chat history cleared'
    })

# Original routes for web interface - keeping for backwards compatibility
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'GET':
        # Get chat history for upload page
        mode = 'upload'
        today = datetime.now().strftime("%d-%m-%Y")
        chat_file = f"chat_history/{today}_{mode}.json"
        
        if os.path.exists(chat_file):
            with open(chat_file, "r", encoding="utf-8") as f:
                chat_history = json.load(f)
        else:
            chat_history = []
        
        return render_template('upload.html', chat_history=chat_history)
    
    elif request.method == 'POST':
        if 'action' in request.form and request.form['action'] == 'clear':
            # Clear chat history
            mode = 'upload'
            today = datetime.now().strftime("%d-%m-%Y")
            chat_file = f"chat_history/{today}_{mode}.json"
            
            if os.path.exists(chat_file):
                os.remove(chat_file)
            
            return redirect(url_for('upload'))
        
        # Handle file upload
        if 'pdfs' not in request.files:
            return jsonify({'status': 'error', 'message': 'No files uploaded'})
        
        files = request.files.getlist('pdfs')
        
        if not files or files[0].filename == '':
            return jsonify({'status': 'error', 'message': 'No files selected'})
        
        processed_files = []
        all_text = ""
        
        for file in files:
            if file and file.filename.endswith('.pdf'):
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                text = get_pdf_text(file_path)
                all_text += text
                processed_files.append(filename)
        
        if all_text:
            text_chunks = get_text_chunks(all_text)
            vector_store = get_vector_store(text_chunks)
            
            session['vector_store_exists'] = True
            session['pdf_processed'] = True
            session['processed_files'] = processed_files
            
            # Save vector store
            with tempfile.TemporaryDirectory() as temp_dir:
                vector_store.save_local(temp_dir)
                
                vector_store_file = os.path.join(temp_dir, "faiss_index")
                session['vector_store_path'] = vector_store_file
                
                # Save to Azure if requested
                if 'save_to_azure' in request.form and request.form['save_to_azure'] == 'true':
                    container_client = get_blob_client()
                    if container_client:
                        # Save PDFs to Azure
                        for filename in processed_files:
                            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                            with open(file_path, 'rb') as f:
                                pdf_content = f.read()
                                save_to_blob(container_client, f"pdfs/{filename}", pdf_content)
                        
                        # Save vector store to Azure
                        merge_vector_stores(vector_store, container_client)
                        
                        # Update processed files list
                        azure_processed_files = get_processed_files(container_client)
                        for filename in processed_files:
                            if filename not in azure_processed_files:
                                azure_processed_files.append(filename)
                        save_processed_files(container_client, azure_processed_files)
            
            return jsonify({'status': 'success', 'message': f"Processed {len(processed_files)} files"})
        
        return jsonify({'status': 'error', 'message': 'Failed to process files'})

@app.route('/query', methods=['POST'])
def query():
    user_question = request.form.get('question')
    
    if not user_question:
        return jsonify({'status': 'error', 'message': 'No question provided'})
    
    mode = request.form.get('mode', 'upload')
    
    if mode == 'upload':
        if not session.get('pdf_processed', False):
            response = "Please upload and process PDF files first."
        else:
            # Query local vector store
            with tempfile.TemporaryDirectory() as temp_dir:
                # Reconstruct vector store
                vector_store_file = session.get('vector_store_path')
                if vector_store_file:
                    embeddings = GoogleGenerativeAIEmbeddings(model='models/embedding-001')
                    vector_store = FAISS.load_local(temp_dir, embeddings)
                    response = query_local_vector_store(user_question, vector_store)
                else:
                    response = "Error loading vector store. Please process PDFs again."
    else:  # Azure mode
        container_client = get_blob_client()
        if not container_client:
            response = "Failed to connect to Azure Storage. Please check your connection string and container name."
        elif not blob_exists(container_client, VECTOR_STORE_PATH):
            response = "No documents have been stored in Azure Storage yet. Please upload and save documents first."
        else:
            response = query_azure_vector_store(user_question, container_client)
    
    # Save chat history
    chat_history = save_chat_history(user_question, response, mode)
    
    return jsonify({
        'status': 'success',
        'response': response,
        'chat_history': chat_history
    })

@app.route('/azure')
def azure_chat():
    # Get chat history for azure page
    mode = 'azure'
    today = datetime.now().strftime("%d-%m-%Y")
    chat_file = f"chat_history/{today}_{mode}.json"
    
    if os.path.exists(chat_file):
        with open(chat_file, "r", encoding="utf-8") as f:
            chat_history = json.load(f)
    else:
        chat_history = []
    
    container_client = get_blob_client()
    if container_client:
        processed_files = get_processed_files(container_client)
        files_count = len(processed_files) if processed_files else 0
    else:
        files_count = 0
    
    return render_template('azure.html', chat_history=chat_history, files_count=files_count)

@app.route('/clear-azure-history', methods=['POST'])
def clear_azure_history():
    mode = 'azure'
    today = datetime.now().strftime("%d-%m-%Y")
    chat_file = f"chat_history/{today}_{mode}.json"
    
    if os.path.exists(chat_file):
        os.remove(chat_file)
    
    return redirect(url_for('azure_chat'))

if __name__ == '__main__':
    app.run(debug=True)