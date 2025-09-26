import React, { useState, useRef } from 'react';
import { documentAPI } from '../services/api';

const DocumentUpload = ({ onUploadSuccess, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Allowed file types
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Định dạng file không được hỗ trợ. Chỉ chấp nhận PDF, DOCX, và TXT.');
    }
    if (file.size > maxFileSize) {
      throw new Error('Kích thước file không được vượt quá 10MB.');
    }
    return true;
  };

  const handleFileSelect = (file) => {
    try {
      validateFile(file);
      setSelectedFile(file);
    } catch (error) {
      if (onUploadError) {
        onUploadError(error.message);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await documentAPI.upload(selectedFile, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      // Reset form
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (error) {
      console.error('Upload error:', error);
      if (onUploadError) {
        onUploadError(error.response?.data?.message || 'Có lỗi xảy ra khi upload file.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type === 'application/pdf') {
      return (
        <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6l-4-4H4v16zm8-14v3h3l-3-3z"/>
        </svg>
      );
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return (
        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 2h8l4 4v12H4V2zm8 2v3h3l-3-3z"/>
        </svg>
      );
    } else {
      return (
        <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 2h12v16H4V2zm2 2v12h8V4H6z"/>
        </svg>
      );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload Tài Liệu</h2>
      
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <svg
              className="w-12 h-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-700">
              Kéo thả file vào đây hoặc
            </p>
            <button
              type="button"
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => fileInputRef.current?.click()}
            >
              Chọn File
            </button>
          </div>
          
          <p className="text-sm text-gray-500">
            Hỗ trợ: PDF, DOCX, TXT (tối đa 10MB)
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={handleFileInput}
          />
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile)}
              <div>
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
              </div>
            </div>
            
            <button
              type="button"
              className="text-red-600 hover:text-red-800"
              onClick={handleRemoveFile}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Upload Progress */}
          {uploading && (
            <div className="mt-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-600">Đang upload...</span>
                <span className="text-sm text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Upload Button */}
          {!uploading && (
            <button
              type="button"
              className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleUpload}
              disabled={uploading}
            >
              Upload Tài Liệu
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;