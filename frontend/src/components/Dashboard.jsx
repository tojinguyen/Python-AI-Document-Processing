import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                AI Document Processing
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Xin chào, {user?.first_name} {user?.last_name}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Chào mừng đến với AI Document Processing
              </h2>
              <p className="text-gray-600 mb-4">
                Bạn đã đăng nhập thành công! Đây là trang dashboard chính.
              </p>
              <div className="bg-white p-6 rounded-lg shadow max-w-md mx-auto">
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
      </main>
    </div>
  );
};

export default Dashboard;