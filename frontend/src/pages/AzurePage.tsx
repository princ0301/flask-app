import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ChatInterface from '../components/ChatInterface';
import { Database, FileText } from 'lucide-react';

interface Message {
  role: string;
  content: string;
  timestamp: string;
}

const AzurePage: React.FC = () => {
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [filesCount, setFilesCount] = useState(0);
  
  useEffect(() => {
    // Fetch initial chat history and files count on load
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const response = await fetch('/azure');
      const html = await response.text();
      
      // Extract chat history and files count from the HTML response
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Extract chat history
      const chatHistoryScript = Array.from(doc.scripts).find(script => 
        script.textContent && script.textContent.includes('chat_history')
      );
      
      if (chatHistoryScript && chatHistoryScript.textContent) {
        const match = chatHistoryScript.textContent.match(/var\s+chat_history\s*=\s*(\[.*?\]);/s);
        if (match && match[1]) {
          try {
            const history = JSON.parse(match[1]);
            setChatHistory(history);
          } catch (e) {
            console.error('Failed to parse chat history:', e);
          }
        }
      }
      
      // Extract files count
      const filesCountElement = doc.querySelector('[data-files-count]');
      if (filesCountElement) {
        const count = parseInt(filesCountElement.getAttribute('data-files-count') || '0', 10);
        setFilesCount(count);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (isQuerying) return;
    
    setIsQuerying(true);
    
    // Add user message to chat history immediately
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatHistory(prev => [userMessage, ...prev]);
    
    try {
      const formData = new FormData();
      formData.append('question', message);
      formData.append('mode', 'azure');
      
      const response = await fetch('/query', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        // Update chat history with the backend response
        setChatHistory(result.chat_history);
      } else {
        // Add error message if query failed
        const errorMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request.',
          timestamp: new Date().toLocaleTimeString()
        };
        setChatHistory(prev => [errorMessage, ...prev]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I couldn\'t connect to the server. Please try again later.',
        timestamp: new Date().toLocaleTimeString()
      };
      setChatHistory(prev => [errorMessage, ...prev]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await fetch('/clear-azure-history', {
        method: 'POST'
      });
      
      setChatHistory([]);
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  const renderAdditionalInfo = () => {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center text-blue-700">
          <Database className="mr-2" size={18} />
          <span>{filesCount} document{filesCount !== 1 ? 's' : ''} stored in Azure</span>
        </div>
        {filesCount === 0 && (
          <div className="text-sm text-orange-600 flex items-center">
            <FileText className="mr-1" size={14} />
            <span>No documents available. Please upload in Local Chat.</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Azure-Stored Medical Documents Chat
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
            <Database className="mr-2" size={20} />
            About Azure Storage Mode
          </h2>
          <p className="text-gray-700 mb-4">
            This mode allows you to chat with medical documents that have been uploaded and saved to Azure Blob Storage.
            Documents saved to Azure are persistent and will be available across sessions and devices.
          </p>
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2">How to use Azure mode:</h3>
            <ol className="list-decimal list-inside text-gray-700 space-y-1">
              <li>Upload documents in the Local Chat tab and check the "Save to Azure" option</li>
              <li>Once documents are saved to Azure, you can access them here anytime</li>
              <li>Ask questions about your stored medical documents</li>
            </ol>
          </div>
        </div>
        
        <div className="h-[500px]">
          <ChatInterface 
            mode="azure"
            chatHistory={chatHistory}
            onSendMessage={handleSendMessage}
            onClearHistory={handleClearHistory}
            isLoading={isQuerying}
            additionalInfo={renderAdditionalInfo()}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AzurePage;