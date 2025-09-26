import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Navigation from './Navigation';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Documents Card */}
            <Link to="/documents" className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Quản lý tài liệu</dt>
                      <dd className="text-lg font-medium text-gray-900">Upload & Xem tài liệu</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                    Truy cập ngay → 
                  </span>
                </div>
              </div>
            </Link>

            {/* Chatbot Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg opacity-50">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">AI Chatbot</dt>
                      <dd className="text-lg font-medium text-gray-900">Chat với tài liệu</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-400">
                    Sắp ra mắt...
                  </span>
                </div>
              </div>
            </div>

            {/* Analytics Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg opacity-50">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Thống kê</dt>
                      <dd className="text-lg font-medium text-gray-900">Báo cáo & Analytics</dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                <div className="text-sm">
                  <span className="font-medium text-gray-400">
                    Sắp ra mắt...
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Chào mừng đến với AI Document Processing
                </h2>
                <p className="text-gray-600 mb-6">
                  Hệ thống xử lý tài liệu thông minh với AI. Bắt đầu bằng cách upload tài liệu của bạn.
                </p>
                
                <div className="bg-gray-50 p-6 rounded-lg max-w-md mx-auto">
                  <h3 className="text-lg font-semibold mb-4">Thông tin tài khoản</h3>
                  <div className="space-y-2 text-left">
                    <p><span className="font-medium">Tên đăng nhập:</span> {user?.username}</p>
                    <p><span className="font-medium">Email:</span> {user?.email}</p>
                    <p><span className="font-medium">Họ tên:</span> {user?.first_name} {user?.last_name}</p>
                    {user?.bio && <p><span className="font-medium">Bio:</span> {user.bio}</p>}
                    {user?.birth_date && <p><span className="font-medium">Ngày sinh:</span> {user.birth_date}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;