import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { companyService, ProfileData } from '../api/companyService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const validationSchema = Yup.object({
  companyName: Yup.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name must not exceed 255 characters')
    .required('Company name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  mobileNumber: Yup.string()
    .matches(/^[+]?[1-9][\d\s\-\(\)]{8,20}$/, 'Invalid mobile number')
    .required('Mobile number is required'),
});

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { company, updateCompany } = useAuth();
  const [error, setError] = useState<string>('');

  const formik = useFormik({
    initialValues: {
      companyName: company?.companyName || '',
      email: company?.email || '',
      mobileNumber: company?.mobileNumber || '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setError('');
        const profileData: ProfileData = {
          companyName: values.companyName,
          email: values.email,
          mobileNumber: values.mobileNumber,
        };

        const response = await companyService.updateProfile(profileData);
        updateCompany(response.data!);
        toast.success('Profile updated successfully!');
        navigate('/dashboard');
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Update failed';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 to-slate-50 flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm flex items-center h-16 px-4 md:px-8">
        <button
          className="mr-4 text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-full p-2"
            onClick={() => navigate('/dashboard')}
          >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-semibold text-indigo-700">Profile Management</span>
      </nav>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-2">
        <div className="w-full max-w-lg bg-white/90 rounded-2xl shadow-2xl border border-white/60 backdrop-blur-md p-8 mt-8">
          <h1 className="text-3xl font-bold text-center mb-1">Update Profile</h1>
          <p className="text-center text-gray-500 mb-6 text-sm">Keep your company information up to date</p>
              {error && (
            <div className="mb-3">
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg animate-fade-in">
                  {error}
              </div>
            </div>
              )}
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3m10-5v4a1 1 0 01-1 1h-3m-4 4h4m-2 0v4m0 0h-2a2 2 0 01-2-2v-2a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2z" /></svg>
                </span>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className={`pl-10 pr-3 py-2 w-full rounded-lg bg-white/90 shadow-sm border border-gray-200 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition outline-none ${formik.touched.companyName && formik.errors.companyName ? 'border-red-400' : ''}`}
                  value={formik.values.companyName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              {formik.touched.companyName && formik.errors.companyName && (
                <div className="text-xs text-red-500 mt-1">{formik.errors.companyName}</div>
              )}
            </div>
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
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zm6 0a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4zm6 0a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2a1 1 0 01-1-1v-4z" /></svg>
                </span>
                <input
                  id="mobileNumber"
                  name="mobileNumber"
                  type="text"
                  className={`pl-10 pr-3 py-2 w-full rounded-lg bg-white/90 shadow-sm border border-gray-200 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition outline-none ${formik.touched.mobileNumber && formik.errors.mobileNumber ? 'border-red-400' : ''}`}
                  value={formik.values.mobileNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                />
              </div>
              {formik.touched.mobileNumber && formik.errors.mobileNumber && (
                <div className="text-xs text-red-500 mt-1">{formik.errors.mobileNumber}</div>
              )}
            </div>
            <button
                  type="submit"
              className="w-full py-3 mt-2 rounded-lg font-semibold text-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-indigo-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:opacity-60"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? 'Updating...' : 'Update Profile'}
            </button>
            <button
              type="button"
              className="w-full py-3 mt-2 rounded-lg font-semibold text-lg border border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
