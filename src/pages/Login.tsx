import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { companyService, CompanyLoginData } from '../api/companyService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import logo from '../logo.svg';

const validationSchema = Yup.object({
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .required('Password is required'),
});

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        setIsSubmitting(true);
        const loginData: CompanyLoginData = {
          email: values.email,
          password: values.password,
        };

        const response = await companyService.login(loginData);
        login(response.data.company, response.data.token);
        toast.success('Login successful!');
        navigate('/dashboard');
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Login failed';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-100 to-slate-50 flex items-center justify-center overflow-auto">
      <div className="w-full max-w-md mx-auto z-10">
        <div className="flex flex-col items-center">
          <div className="w-full bg-white/80 rounded-2xl shadow-2xl border border-white/60 backdrop-blur-md p-8">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Logo" className="w-14 h-14 rounded-xl shadow-md" />
            </div>
            <h1 className="text-3xl font-bold text-center mb-1">Sign In</h1>
            <p className="text-center text-gray-500 mb-6 text-sm">Access your compliance management dashboard</p>
              {error && (
              <div className="mb-3">
                <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg animate-fade-in">
                    {error}
                </div>
              </div>
              )}
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12H8m8 0a4 4 0 11-8 0 4 4 0 018 0zm0 0v1a4 4 0 01-8 0v-1" /></svg>
                  </span>
                  <input
                  id="email"
                  name="email"
                  type="email"
                    autoComplete="email"
                    className={`pl-10 pr-3 py-2 w-full rounded-lg bg-white/90 shadow-sm border border-gray-200 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition outline-none ${formik.touched.email && formik.errors.email ? 'border-red-400' : ''}`}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                </div>
                {formik.touched.email && formik.errors.email && (
                  <div className="text-xs text-red-500 mt-1">{formik.errors.email}</div>
                )}
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`pr-10 pl-3 py-2 w-full rounded-lg bg-white/90 shadow-sm border border-gray-200 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition outline-none ${formik.touched.password && formik.errors.password ? 'border-red-400' : ''}`}
                  value={formik.values.password}
                  onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-700 focus:outline-none"
                          onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                        >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.402-3.22 1.125-4.575M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.875-4.575A9.956 9.956 0 0022 9c0 5.523-4.477 10-10 10a9.956 9.956 0 01-4.575-1.125M3 3l18 18" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm2.21 2.21A8.963 8.963 0 0021 12c0-5-4-9-9-9S3 7 3 12c0 1.657.402 3.22 1.125 4.575M6.34 17.66A8.963 8.963 0 0012 21c5 0 9-4 9-9 0-1.657-.402-3.22-1.125-4.575" /></svg>
                    )}
                  </button>
                </div>
                {formik.touched.password && formik.errors.password && (
                  <div className="text-xs text-red-500 mt-1">{formik.errors.password}</div>
                )}
              </div>
              <div className="flex items-center justify-between mt-1">
                <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                    className="mr-2 rounded border-gray-300 focus:ring-indigo-400"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                  Remember me
                </label>
                <Link to="/reset-password" className="text-sm text-indigo-500 hover:underline">Forgot password?</Link>
              </div>
              <button
                  type="submit"
                className="w-full py-3 mt-2 rounded-lg font-semibold text-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-indigo-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center"><svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Signing In...</span>
                ) : 'Sign In'}
              </button>
              <div className="text-center mt-2">
                <span className="text-sm text-gray-600">Don't have an account?{' '}
                  <Link to="/register" className="text-indigo-600 font-semibold hover:underline">Create one</Link>
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
