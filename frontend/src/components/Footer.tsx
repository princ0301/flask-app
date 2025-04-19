import React from 'react';
import { Heart } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center">
            <Heart className="h-5 w-5 text-blue-600" />
            <span className="ml-2 text-gray-700 font-medium">MediChat</span>
          </div>
          <p className="mt-2 sm:mt-0 text-sm text-gray-500">
            © {new Date().getFullYear()} MediChat. All rights reserved.
          </p>
          <p className="mt-2 sm:mt-0 text-sm text-gray-500">
            Healthcare information at your fingertips
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;