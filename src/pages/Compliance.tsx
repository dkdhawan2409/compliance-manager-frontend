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
    .oneOf(['Monthly', 'Quarterly'])
    .required('BAS frequency is required'),
  nextBasDue: Yup.date().required('Next BAS due date is required'),
  fbtApplicable: Yup.string().oneOf(['yes', 'no']).required('FBT applicable field is required'),
  nextFbtDue: Yup.string().when('fbtApplicable', ([fbtApplicable], schema) =>
    fbtApplicable === 'yes' ? schema.required('Next FBT due date is required') : schema.notRequired()
  ),
  iasRequired: Yup.string().oneOf(['yes', 'no']).required('IAS required field is required'),
  iasFrequency: Yup.string().when('iasRequired', ([iasRequired], schema) =>
    iasRequired === 'yes' ? schema.required('IAS frequency is required') : schema.notRequired()
  ),
  nextIasDue: Yup.string().when('iasRequired', ([iasRequired], schema) =>
    iasRequired === 'yes' ? schema.required('Next IAS due date is required') : schema.notRequired()
  ),
  financialEndDate: Yup.date().required('Financial end date is required'),
});

const Compliance: React.FC = () => {
  const navigate = useNavigate();
  const { company, updateCompany } = useAuth();
  const [error, setError] = useState<string>('');

  const formik = useFormik({
    initialValues: {
      basFrequency: '',
      nextBasDue: '',
      fbtApplicable: '',
      nextFbtDue: '',
      iasRequired: '',
      iasFrequency: '',
      nextIasDue: '',
      financialEndDate: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      // Transform values to backend payload
      const payload = {
        basFrequency: values.basFrequency as 'Monthly' | 'Quarterly' | 'Annually',
        nextBasDue: values.nextBasDue,
        fbtApplicable: values.fbtApplicable === 'yes',
        ...(values.fbtApplicable === 'yes' && { nextFbtDue: values.nextFbtDue }),
        iasRequired: values.iasRequired === 'yes',
        ...(values.iasRequired === 'yes' && {
          iasFrequency: values.iasFrequency as 'Monthly' | 'Quarterly' | 'Annually',
          nextIasDue: values.nextIasDue,
        }),
        financialYearEnd: values.financialEndDate,
      };
      try {
        setError('');
        const response = await companyService.updateComplianceDetails(payload);
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
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm flex items-center h-16 px-4 md:px-8">
        <button
          className="mr-4 text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 rounded-full p-2"
          onClick={() => navigate('/dashboard')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span className="text-lg font-semibold text-indigo-700">Compliance Management</span>
      </nav>
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-2">
        <div className="w-full max-w-xl bg-white/90 rounded-2xl shadow-2xl border border-white/60 backdrop-blur-md p-8 mt-8">
          <h1 className="text-3xl font-bold text-center mb-1">Compliance Manager</h1>
          <form onSubmit={formik.handleSubmit} className="space-y-6">
            {/* BAS Frequency */}
            <div>
              <label htmlFor="basFrequency" className="block font-semibold mb-1">BAS Frequency <span className="text-red-500">*</span></label>
              <select
                id="basFrequency"
                name="basFrequency"
                className={`w-full border rounded px-3 py-2 ${formik.touched.basFrequency && formik.errors.basFrequency ? 'border-red-400' : ''}`}
                value={formik.values.basFrequency}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
              >
                <option value="">Select frequency</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
              </select>
              {formik.touched.basFrequency && formik.errors.basFrequency && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.basFrequency}</div>
              )}
            </div>
            {/* Next BAS Due */}
            <div>
              <label htmlFor="nextBasDue" className="block font-semibold mb-1">Next BAS Due <span className="text-red-500">*</span></label>
              <input
                type="date"
                id="nextBasDue"
                name="nextBasDue"
                className={`w-full border rounded px-3 py-2 ${formik.touched.nextBasDue && formik.errors.nextBasDue ? 'border-red-400' : ''}`}
                value={formik.values.nextBasDue}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
              />
              {formik.touched.nextBasDue && formik.errors.nextBasDue && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.nextBasDue}</div>
              )}
            </div>
            {/* FBT Applicable */}
            <div>
              <label className="block font-semibold mb-1">FBT Applicable? <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label><input type="radio" name="fbtApplicable" value="yes" checked={formik.values.fbtApplicable === 'yes'} onChange={formik.handleChange} required /> Yes</label>
                <label><input type="radio" name="fbtApplicable" value="no" checked={formik.values.fbtApplicable === 'no'} onChange={formik.handleChange} required /> No</label>
              </div>
              {formik.touched.fbtApplicable && formik.errors.fbtApplicable && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.fbtApplicable}</div>
              )}
            </div>
            {/* Next FBT Due Date (conditional) */}
            {formik.values.fbtApplicable === 'yes' && (
              <div>
                <label htmlFor="nextFbtDue" className="block font-semibold mb-1">Next FBT Due Date <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  id="nextFbtDue"
                  name="nextFbtDue"
                  className={`w-full border rounded px-3 py-2 ${formik.touched.nextFbtDue && formik.errors.nextFbtDue ? 'border-red-400' : ''}`}
                  value={formik.values.nextFbtDue}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  required
                />
                {formik.touched.nextFbtDue && formik.errors.nextFbtDue && (
                  <div className="text-red-500 text-xs mt-1">{formik.errors.nextFbtDue}</div>
                )}
              </div>
            )}
            {/* IAS Required */}
            <div>
              <label className="block font-semibold mb-1">IAS Required? <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                <label><input type="radio" name="iasRequired" value="yes" checked={formik.values.iasRequired === 'yes'} onChange={formik.handleChange} required /> Yes</label>
                <label><input type="radio" name="iasRequired" value="no" checked={formik.values.iasRequired === 'no'} onChange={formik.handleChange} required /> No</label>
              </div>
              {formik.touched.iasRequired && formik.errors.iasRequired && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.iasRequired}</div>
              )}
            </div>
            {/* IAS Frequency (conditional) */}
            {formik.values.iasRequired === 'yes' && (
              <div>
                <label htmlFor="iasFrequency" className="block font-semibold mb-1">IAS Frequency <span className="text-red-500">*</span></label>
                <select
                  id="iasFrequency"
                  name="iasFrequency"
                  className={`w-full border rounded px-3 py-2 ${formik.touched.iasFrequency && formik.errors.iasFrequency ? 'border-red-400' : ''}`}
                  value={formik.values.iasFrequency}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  required
                >
                  <option value="">Select frequency</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                </select>
                {formik.touched.iasFrequency && formik.errors.iasFrequency && (
                  <div className="text-red-500 text-xs mt-1">{formik.errors.iasFrequency}</div>
                )}
              </div>
            )}
            {/* Next IAS Due (conditional) */}
            {formik.values.iasRequired === 'yes' && (
              <div>
                <label htmlFor="nextIasDue" className="block font-semibold mb-1">Next IAS Due <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  id="nextIasDue"
                  name="nextIasDue"
                  className={`w-full border rounded px-3 py-2 ${formik.touched.nextIasDue && formik.errors.nextIasDue ? 'border-red-400' : ''}`}
                  value={formik.values.nextIasDue}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  required
                />
                {formik.touched.nextIasDue && formik.errors.nextIasDue && (
                  <div className="text-red-500 text-xs mt-1">{formik.errors.nextIasDue}</div>
                )}
              </div>
            )}
            {/* Financial End Date */}
            <div>
              <label htmlFor="financialEndDate" className="block font-semibold mb-1">Financial End Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                id="financialEndDate"
                name="financialEndDate"
                className={`w-full border rounded px-3 py-2 ${formik.touched.financialEndDate && formik.errors.financialEndDate ? 'border-red-400' : ''}`}
                value={formik.values.financialEndDate}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                required
              />
              {formik.touched.financialEndDate && formik.errors.financialEndDate && (
                <div className="text-red-500 text-xs mt-1">{formik.errors.financialEndDate}</div>
              )}
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-2 rounded hover:bg-indigo-700 transition">Submit</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Compliance;
