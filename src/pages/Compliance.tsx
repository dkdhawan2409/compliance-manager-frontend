import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import { companyService, ComplianceData } from '../api/companyService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const validationSchema = Yup.object({
  basFrequency: Yup.string()
    .oneOf(['Monthly', 'Quarterly', 'Annually'])
    .required('BAS frequency is required'),
  fbtApplicable: Yup.boolean()
    .required('FBT applicable field is required'),
  financialYearEnd: Yup.date()
    .required('Financial year end date is required'),
});

const Compliance: React.FC = () => {
  const navigate = useNavigate();
  const { company, updateCompany } = useAuth();
  const [error, setError] = useState<string>('');

  const formik = useFormik({
    initialValues: {
      basFrequency: company?.basFrequency || '',
      fbtApplicable: company?.fbtApplicable || false,
      financialYearEnd: company?.financialYearEnd ? dayjs(company.financialYearEnd).format('YYYY-MM-DD') : '',
    },
    validationSchema,
    enableReinitialize: true,
    onSubmit: async (values) => {
      try {
        setError('');
        const complianceData: ComplianceData = {
          basFrequency: values.basFrequency as 'Monthly' | 'Quarterly' | 'Annually',
          fbtApplicable: values.fbtApplicable,
          financialYearEnd: values.financialYearEnd,
        };

        const response = await companyService.updateCompliance(complianceData);
        updateCompany(response.data!);
        toast.success('Compliance details updated successfully!');
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
        <span className="text-lg font-semibold text-indigo-700">Compliance Management</span>
      </nav>
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-2">
        <div className="w-full max-w-lg bg-white/90 rounded-2xl shadow-2xl border border-white/60 backdrop-blur-md p-8 mt-8">
          <h1 className="text-3xl font-bold text-center mb-1">Update Compliance Details</h1>
          <p className="text-center text-gray-500 mb-6 text-sm">Keep your compliance information up to date</p>
              {error && (
            <div className="mb-3">
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg animate-fade-in">
                  {error}
              </div>
            </div>
              )}
          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="basFrequency" className="block text-sm font-medium text-gray-700 mb-1">BAS Frequency</label>
              <select
                    id="basFrequency"
                    name="basFrequency"
                className={`w-full py-2 px-3 rounded-lg bg-white/90 border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition outline-none ${formik.touched.basFrequency && formik.errors.basFrequency ? 'border-red-400' : ''}`}
                    value={formik.values.basFrequency}
                    onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              >
                <option value="">Select frequency</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Annually">Annually</option>
              </select>
                  {formik.touched.basFrequency && formik.errors.basFrequency && (
                <div className="text-xs text-red-500 mt-1">{formik.errors.basFrequency}</div>
                  )}
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-1">FBT Applicable</span>
              <div className="flex gap-6 mt-1">
                <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="fbtApplicable"
                    value="true"
                    checked={formik.values.fbtApplicable === true}
                    onChange={() => formik.setFieldValue('fbtApplicable', true)}
                    className="mr-2 accent-indigo-500"
                  />
                  Yes
                </label>
                <label className="flex items-center text-sm text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="fbtApplicable"
                    value="false"
                    checked={formik.values.fbtApplicable === false}
                    onChange={() => formik.setFieldValue('fbtApplicable', false)}
                    className="mr-2 accent-indigo-500"
                  />
                  No
                </label>
              </div>
                  {formik.touched.fbtApplicable && formik.errors.fbtApplicable && (
                <div className="text-xs text-red-500 mt-1">{formik.errors.fbtApplicable}</div>
                  )}
            </div>
            <div>
              <label htmlFor="financialYearEnd" className="block text-sm font-medium text-gray-700 mb-1">Financial Year End</label>
              <input
                id="financialYearEnd"
                name="financialYearEnd"
                type="date"
                className={`w-full py-2 px-3 rounded-lg bg-white/90 border border-gray-200 shadow-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition outline-none ${formik.touched.financialYearEnd && formik.errors.financialYearEnd ? 'border-red-400' : ''}`}
                value={formik.values.financialYearEnd}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.financialYearEnd && formik.errors.financialYearEnd && (
                <div className="text-xs text-red-500 mt-1">{formik.errors.financialYearEnd}</div>
              )}
            </div>
            <button
                  type="submit"
              className="w-full py-3 mt-2 rounded-lg font-semibold text-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-indigo-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 disabled:opacity-60"
                  disabled={formik.isSubmitting}
                >
                  {formik.isSubmitting ? 'Updating...' : 'Update Compliance Details'}
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

export default Compliance;
