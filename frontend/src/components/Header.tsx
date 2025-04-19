import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, FileText, Database } from 'lucide-react';

const Header: React.FC = () => {
  const location = useLocation();
  
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">MediChat</span>
            </Link>
          </div>
          
          <nav className="hidden sm:flex space-x-4">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              Home
            </Link>
            <Link 
              to="/upload" 
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/upload' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <FileText className="h-4 w-4 mr-1" />
              Local Chat
            </Link>
            <Link 
              to="/azure" 
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                location.pathname === '/azure' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Database className="h-4 w-4 mr-1" />
              Azure Chat
            </Link>
          </nav>
          
          <div className="flex sm:hidden">
            <button 
              type="button" 
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-controls="mobile-menu"
              aria-expanded="false"
              onClick={() => {
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu) {
                  mobileMenu.classList.toggle('hidden');
                }
              }}
            >
              <span className="sr-only">Open main menu</span>
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="sm:hidden hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link 
            to="/" 
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              location.pathname === '/' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            onClick={() => document.getElementById('mobile-menu')?.classList.add('hidden')}
          >
            Home
          </Link>
          <Link 
            to="/upload" 
            className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
              location.pathname === '/upload' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            onClick={() => document.getElementById('mobile-menu')?.classList.add('hidden')}
          >
            <FileText className="h-4 w-4 mr-1" />
            Local Chat
          </Link>
          <Link 
            to="/azure" 
            className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
              location.pathname === '/azure' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            onClick={() => document.getElementById('mobile-menu')?.classList.add('hidden')}
          >
            <Database className="h-4 w-4 mr-1" />
            Azure Chat
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;