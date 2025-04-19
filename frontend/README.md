# MediChat - Healthcare Chatbot Frontend

This is the frontend for the MediChat application, a healthcare chatbot that provides information and answers based on medical documents.

## Setup Instructions

Follow these steps to set up the frontend and integrate it with the provided Flask backend:

### Prerequisites

- Node.js 16+ and npm installed
- Python 3.8+ with pip installed
- The backend code already downloaded and available

### Step 1: Clone or download this repository

### Step 2: Install frontend dependencies

```bash
npm install
```

### Step 3: Build the frontend

```bash
npm run build
```

### Step 4: Set up the backend

1. Create a Python virtual environment:
```bash
python -m venv venv
```

2. Activate the virtual environment:
   - On Windows: `venv\Scripts\activate`
   - On macOS/Linux: `source venv/bin/activate`

3. Install the required Python packages:
```bash
pip install flask werkzeug PyPDF2 langchain azure-storage-blob python-dotenv langchain_google_genai google-generativeai langchain_community langchain_groq
```

4. Create a `.env` file in the root directory with the following content:
```
GOOGLE_API_KEY=your_google_api_key
GROQ_API_KEY=your_groq_api_key
AZURE_CONN_STRING=your_azure_connection_string
AZURE_CONTAINER_NAME=your_container_name
```

5. Create the necessary directories for the backend:
```bash
mkdir -p uploads chat_history
```

### Step 5: Set up integration

1. Copy the built frontend files to a folder the Flask app can serve:
```bash
cp -r dist/* static/
```

2. Update the Flask app to serve the frontend files:
```python
# Add this to the imports
from flask import send_from_directory

# Add these routes to serve the frontend
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')
```

### Step 6: Run the application

```bash
python app.py
```

The application should now be running at http://localhost:5000

## Project Structure

```
├── public/             # Static assets
├── src/                # Source files
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── App.tsx         # Main application component
│   ├── index.css       # Global styles
│   └── main.tsx        # Application entry point
└── README.md           # This file
```

## Features

- Upload and process medical PDF documents
- Chat interface to ask questions about the documents
- Save documents to Azure for persistent storage
- Responsive design for all devices
- Clear and intuitive user interface