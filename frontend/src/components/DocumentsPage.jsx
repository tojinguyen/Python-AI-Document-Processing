import React, { useState } from 'react';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import Navigation from './Navigation';

const DocumentsPage = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [notification, setNotification] = useState(null);

  const handleUploadSuccess = (result) => {
    setNotification({
      type: 'success',
      message: `Tài liệu "${result.document_id}" đã được upload thành công và đang được xử lý.`,
    });
    // Trigger document list refresh
    setRefreshTrigger(prev => prev + 1);
  };

  const handleUploadError = (error) => {
    setNotification({
      type: 'error',
      message: error,
    });
  };

  const handleDocumentSelect = (document) => {
    setSelectedDocument(document);
  };

  const closeNotification = () => {
    setNotification(null);
  };

  const closeDocumentDetail = () => {
    setSelectedDocument(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Tài Liệu</h1>
          <p className="mt-2 text-gray-600">
            Upload và quản lý tài liệu của bạn. Hệ thống hỗ trợ PDF, DOCX và TXT.
          </p>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`mb-6 rounded-md p-4 ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {notification.type === 'success' ? (
                  <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.message}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    type="button"
                    className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      notification.type === 'success' 
                        ? 'text-green-500 hover:bg-green-100 focus:ring-offset-green-50 focus:ring-green-600' 
                        : 'text-red-500 hover:bg-red-100 focus:ring-offset-red-50 focus:ring-red-600'
                    }`}
                    onClick={closeNotification}
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <DocumentUpload
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </div>

          {/* Document List Section */}
          <div className="lg:col-span-2">
            <DocumentList
              refreshTrigger={refreshTrigger}
              onDocumentSelect={handleDocumentSelect}
            />
          </div>
        </div>

        {/* Document Detail Modal */}
        {selectedDocument && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chi Tiết Tài Liệu
                  </h3>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={closeDocumentDetail}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Modal Content */}
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên tài liệu
                    </label>
                    <p className="text-gray-900">{selectedDocument.file_name}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Kích thước
                      </label>
                      <p className="text-gray-900">
                        {(() => {
                          const bytes = selectedDocument.file_size;
                          if (bytes === 0) return '0 Bytes';
                          const k = 1024;
                          const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                          const i = Math.floor(Math.log(bytes) / Math.log(k));
                          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
                        })()}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Loại file
                      </label>
                      <p className="text-gray-900">{selectedDocument.mime_type}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trạng thái
                    </label>
                    <div>
                      {(() => {
                        const status = selectedDocument.status;
                        const statusConfig = {
                          pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Chờ xử lý' },
                          processing: { color: 'bg-blue-100 text-blue-800', text: 'Đang xử lý' },
                          completed: { color: 'bg-green-100 text-green-800', text: 'Hoàn thành' },
                          failed: { color: 'bg-red-100 text-red-800', text: 'Thất bại' },
                        };
                        const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };
                        return (
                          <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${config.color}`}>
                            {config.text}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày tạo
                    </label>
                    <p className="text-gray-900">
                      {new Date(selectedDocument.created_at).toLocaleString('vi-VN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ID tài liệu
                    </label>
                    <p className="text-gray-900 font-mono text-sm break-all">
                      {selectedDocument.id}
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end pt-4 border-t mt-6 space-x-2">
                  {selectedDocument.status === 'completed' && (
                    <button
                      type="button"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={() => {
                        // Handle download logic here
                        console.log('Download document:', selectedDocument.id);
                      }}
                    >
                      Tải xuống
                    </button>
                  )}
                  <button
                    type="button"
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    onClick={closeDocumentDetail}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
};export default DocumentsPage;