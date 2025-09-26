import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';

const DocumentList = ({ refreshTrigger, onDocumentSelect }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusOptions = [
    { value: '', label: 'Tất cả trạng thái' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'failed', label: 'Thất bại' },
  ];

  const fetchDocuments = async (page = 1, search = '', status = '') => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentAPI.getAll(page, search, status);
      
      // Since the API doesn't return pagination info, we'll work with what we have
      setDocuments(Array.isArray(data) ? data : []);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Không thể tải danh sách tài liệu. Vui lòng thử lại.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(1, searchTerm, statusFilter);
  }, [refreshTrigger, searchTerm, statusFilter]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleDelete = async (documentId, documentName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${documentName}"?`)) {
      return;
    }

    try {
      await documentAPI.delete(documentId);
      // Refresh the document list
      fetchDocuments(currentPage, searchTerm, statusFilter);
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Không thể xóa tài liệu. Vui lòng thử lại.');
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await documentAPI.download(documentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Không thể tải xuống tài liệu. Vui lòng thử lại.');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Chờ xử lý' },
      processing: { color: 'bg-blue-100 text-blue-800', text: 'Đang xử lý' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Hoàn thành' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Thất bại' },
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800', text: status };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getFileIcon = (mimeType) => {
    if (mimeType === 'application/pdf') {
      return (
        <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6l-4-4H4v16zm8-14v3h3l-3-3z"/>
        </svg>
      );
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return (
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 2h8l4 4v12H4V2zm8 2v3h3l-3-3z"/>
        </svg>
      );
    } else {
      return (
        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 2h12v16H4V2zm2 2v12h8V4H6z"/>
        </svg>
      );
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && documents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải danh sách tài liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Danh Sách Tài Liệu</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm tài liệu..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={handleSearch}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <select
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có tài liệu nào</h3>
          <p className="text-gray-500">Upload tài liệu đầu tiên để bắt đầu sử dụng hệ thống.</p>
        </div>
      ) : (
        <>
          {/* Documents Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tài liệu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kích thước
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((document) => (
                  <tr 
                    key={document.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onDocumentSelect && onDocumentSelect(document)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getFileIcon(document.mime_type)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {document.file_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {document.mime_type}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatFileSize(document.file_size)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(document.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDate(document.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {document.status === 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(document.id, document.file_name);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Tải xuống"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(document.id, document.file_name);
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Xóa"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Loading overlay while refreshing */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Đang cập nhật...</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentList;