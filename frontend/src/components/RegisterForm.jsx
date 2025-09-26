import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterForm = () => {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    const result = await registerUser(data);
    
    if (result.success) {
      navigate('/login');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Tạo tài khoản mới
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Hoặc{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              đăng nhập vào tài khoản có sẵn
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                  Họ
                </label>
                <input
                  {...register('first_name', { 
                    required: 'Họ là bắt buộc',
                    minLength: { value: 2, message: 'Họ phải có ít nhất 2 ký tự' }
                  })}
                  type="text"
                  className="input-field mt-1"
                  placeholder="Họ"
                />
                {errors.first_name && (
                  <p className="form-error">{errors.first_name.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                  Tên
                </label>
                <input
                  {...register('last_name', { 
                    required: 'Tên là bắt buộc',
                    minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                  })}
                  type="text"
                  className="input-field mt-1"
                  placeholder="Tên"
                />
                {errors.last_name && (
                  <p className="form-error">{errors.last_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Tên đăng nhập
              </label>
              <input
                {...register('username', { 
                  required: 'Tên đăng nhập là bắt buộc',
                  minLength: { value: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message: 'Tên đăng nhập chỉ được chứa chữ, số và dấu gạch dưới'
                  }
                })}
                type="text"
                className="input-field mt-1"
                placeholder="Tên đăng nhập"
              />
              {errors.username && (
                <p className="form-error">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register('email', { 
                  required: 'Email là bắt buộc',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email không hợp lệ'
                  }
                })}
                type="email"
                className="input-field mt-1"
                placeholder="Email"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <input
                {...register('password', { 
                  required: 'Mật khẩu là bắt buộc',
                  minLength: { value: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
                  }
                })}
                type="password"
                className="input-field mt-1"
                placeholder="Mật khẩu"
              />
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password2" className="block text-sm font-medium text-gray-700">
                Xác nhận mật khẩu
              </label>
              <input
                {...register('password2', { 
                  required: 'Xác nhận mật khẩu là bắt buộc',
                  validate: value => value === password || 'Mật khẩu không khớp'
                })}
                type="password"
                className="input-field mt-1"
                placeholder="Xác nhận mật khẩu"
              />
              {errors.password2 && (
                <p className="form-error">{errors.password2.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;