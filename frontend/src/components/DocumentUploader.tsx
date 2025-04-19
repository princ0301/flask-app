import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Check, X } from 'lucide-react';

interface DocumentUploaderProps {
  onUpload: (files: File[], saveToAzure: boolean) => void;
  isLoading: boolean;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUpload, isLoading }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [saveToAzure, setSaveToAzure] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const pdfFiles = acceptedFiles.filter(
      file => file.type === 'application/pdf'
    );
    
    if (pdfFiles.length !== acceptedFiles.length) {
      setError('Only PDF files are accepted');
    }
    
    setFiles(pdfFiles);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const handleUpload = () => {
    if (files.length > 0) {
      onUpload(files, saveToAzure);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Upload Medical Documents</h2>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 mb-4 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto text-blue-500 mb-2" />
        <p className="text-gray-700">
          {isDragActive
            ? "Drop your PDF files here..."
            : "Drag & drop PDF files here, or click to select"}
        </p>
        <p className="text-sm text-gray-500 mt-2">Only PDF files are accepted</p>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-center">
          <X className="w-5 h-5 mr-2 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
      
      {files.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-medium text-gray-700 mb-2">Selected files:</h3>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <div className="flex items-center">
                  <FileText className="text-blue-500 mr-2" size={20} />
                  <span className="text-sm text-gray-700 truncate" style={{ maxWidth: "200px" }}>
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={isLoading}
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="saveToAzure"
          checked={saveToAzure}
          onChange={() => setSaveToAzure(prev => !prev)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={isLoading}
        />
        <label htmlFor="saveToAzure" className="ml-2 text-sm text-gray-700">
          Save to Azure for persistent storage
        </label>
      </div>
      
      <button
        type="button"
        onClick={handleUpload}
        disabled={files.length === 0 || isLoading}
        className={`w-full py-2 px-4 rounded-md flex items-center justify-center ${
          files.length === 0 || isLoading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } transition-colors duration-200`}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          <>
            <Check className="mr-2" size={18} />
            Upload and Process Files
          </>
        )}
      </button>
    </div>
  );
};

export default DocumentUploader;