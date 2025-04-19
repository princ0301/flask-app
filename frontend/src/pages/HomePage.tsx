import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, FileText, Database, MessageSquare, FilePlus2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1">
        <section className="bg-gradient-to-b from-blue-600 to-blue-800 text-white py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">
                Your Personal Healthcare Assistant
              </h1>
              <p className="text-xl sm:text-2xl opacity-90 max-w-3xl mx-auto">
                Extract valuable insights from your medical documents and get answers to your healthcare questions
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/upload"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-800 bg-white hover:bg-blue-50 transition-colors duration-200"
                >
                  <FileText className="mr-2" size={20} />
                  Get Started with Local Documents
                </Link>
                <Link
                  to="/azure"
                  className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-blue-700 transition-colors duration-200"
                >
                  <Database className="mr-2" size={20} />
                  Access Azure-Stored Documents
                </Link>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <MessageSquare className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  AI-Powered Chat
                </h3>
                <p className="text-gray-600">
                  Chat with our advanced AI model trained on medical knowledge to get accurate healthcare information.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <FilePlus2 className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Document Analysis
                </h3>
                <p className="text-gray-600">
                  Upload your medical PDFs and get insights based on the content within your documents.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <Database className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Azure Storage
                </h3>
                <p className="text-gray-600">
                  Save your processed documents to Azure for persistent access and reference across sessions.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <Activity className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Accurate Medical Information
                </h3>
                <p className="text-gray-600">
                  Get reliable healthcare information based on advanced AI models and your uploaded documents.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <FileText className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Chat History
                </h3>
                <p className="text-gray-600">
                  All your conversations are saved, making it easy to reference previous medical discussions.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                <MessageSquare className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Contextual Understanding
                </h3>
                <p className="text-gray-600">
                  Our AI understands the context of your questions, providing more relevant medical answers.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-blue-600 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-6 py-12 sm:px-12 sm:py-16 md:py-20 text-center text-white">
                <h2 className="text-3xl font-bold mb-6">
                  Ready to get started?
                </h2>
                <p className="text-xl opacity-90 max-w-3xl mx-auto mb-8">
                  Upload your medical documents and start chatting with our healthcare assistant today.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link
                    to="/upload"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-800 bg-white hover:bg-blue-50 transition-colors duration-200"
                  >
                    <FileText className="mr-2" size={20} />
                    Upload Documents
                  </Link>
                  <Link
                    to="/azure"
                    className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Database className="mr-2" size={20} />
                    Access Azure Storage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default HomePage;