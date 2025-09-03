import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import { companyService, ComplianceData, ComplianceDeadlines } from '../api/companyService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import SidebarLayout from '../components/SidebarLayout';
import { Grid, Card, CardContent, Container, Box, Typography, Button, TextField, MenuItem } from '@mui/material';
import CompanyComplianceForm, { CompanyComplianceFormValues } from '../components/CompanyComplianceForm';

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
  const [loading, setLoading] = useState(true);
  const [formDefaults, setFormDefaults] = useState<CompanyComplianceFormValues | undefined>(undefined);
  const [deadlines, setDeadlines] = useState<ComplianceDeadlines | null>(null);

  // Function to fetch compliance data
  const fetchCompliance = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [companyRes, deadlinesRes] = await Promise.all([
        companyService.getCompanyById(company.id),
        companyService.getComplianceDeadlines(),
      ]);
      
      // Fix: The API response has a nested data structure
      const compliance = companyRes.data?.data?.compliance || companyRes.data?.compliance;
      setDeadlines(deadlinesRes);
      
      if (compliance) {
        console.log('Fetched compliance data:', compliance); // Debug log
        setFormDefaults({
          basFrequency: compliance.basFrequency || 'Quarterly',
          nextBasDue: compliance.nextBasDue ? new Date(compliance.nextBasDue) : null,
          fbtApplicable: compliance.fbtApplicable ?? false,
          nextFbtDue: compliance.nextFbtDue ? new Date(compliance.nextFbtDue) : null,
          iasRequired: compliance.iasRequired ?? false,
          iasFrequency: compliance.iasFrequency || 'Quarterly',
          nextIasDue: compliance.nextIasDue ? new Date(compliance.nextIasDue) : null,
          financialEndDate: compliance.financialYearEnd ? new Date(compliance.financialYearEnd) : null,
        });
      } else {
        console.log('No compliance data found in response:', companyRes); // Debug log
      }
    } catch (e) {
      console.error('Error fetching compliance:', e); // Debug log
      setError('Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, [company?.id]);

  // Helper to get the current quarter
  function getCurrentQuarter(date: Date) {
    const month = date.getMonth() + 1;
    if (month >= 1 && month <= 3) return 'q3'; // Q3: Jan-Mar
    if (month >= 4 && month <= 6) return 'q4'; // Q4: Apr-Jun
    if (month >= 7 && month <= 9) return 'q1'; // Q1: Jul-Sep
    return 'q2'; // Q2: Oct-Dec
  }

  // Handler to auto-fill due dates based on frequency and deadlines
  const handleAutoFill = (values: CompanyComplianceFormValues, setValue: (name: keyof CompanyComplianceFormValues, value: any) => void) => {
    if (!deadlines) return;
    const now = new Date();
    // BAS
    if (values.basFrequency === 'Monthly') {
      if (deadlines.bas.monthly) {
        // Assume monthly is just a day of the month (e.g., '21')
        const due = dayjs(now).date(Number(deadlines.bas.monthly));
        setValue('nextBasDue', due.toDate());
      }
    } else if (values.basFrequency === 'Quarterly') {
      const q = getCurrentQuarter(now);
      const dateStr = deadlines.bas.quarterly[q];
      if (dateStr) {
        setValue('nextBasDue', dayjs(dateStr, 'DD MMM YYYY').toDate());
      }
    }
    // IAS
    if (values.iasRequired && values.iasFrequency === 'Monthly') {
      if (deadlines.ias.monthly) {
        const due = dayjs(now).date(Number(deadlines.ias.monthly));
        setValue('nextIasDue', due.toDate());
      }
    } else if (values.iasRequired && values.iasFrequency === 'Quarterly') {
      const q = getCurrentQuarter(now);
      const dateStr = deadlines.ias.quarterly[q];
      if (dateStr) {
        setValue('nextIasDue', dayjs(dateStr, 'DD MMM YYYY').toDate());
      }
    }
    // FBT (annual)
    // You can add similar logic for FBT if needed
  };

  const handleSubmit = async (data: CompanyComplianceFormValues) => {
    if (!company?.id) {
      toast.error('Company information not available');
      return;
    }

    try {
      setLoading(true);
      
      // Transform the data to match the backend ComplianceData interface
      const complianceData = {
        basFrequency: data.basFrequency as 'Monthly' | 'Quarterly' | 'Annually',
        nextBasDue: data.nextBasDue ? 
          (typeof data.nextBasDue === 'string' ? new Date().toISOString() : data.nextBasDue.toISOString()) : 
          new Date().toISOString(), // Ensure we always have a valid date
        fbtApplicable: data.fbtApplicable,
        nextFbtDue: data.fbtApplicable && data.nextFbtDue ? 
          (typeof data.nextFbtDue === 'string' ? new Date().toISOString() : data.nextFbtDue.toISOString()) : 
          undefined,
        iasRequired: data.iasRequired,
        iasFrequency: data.iasRequired && data.iasFrequency ? (data.iasFrequency as 'Monthly' | 'Quarterly' | 'Annually') : undefined,
        nextIasDue: data.iasRequired && data.nextIasDue ? 
          (typeof data.nextIasDue === 'string' ? new Date().toISOString() : data.nextIasDue.toISOString()) : 
          undefined,
        financialYearEnd: data.financialEndDate ? 
          (typeof data.financialEndDate === 'string' ? new Date().toISOString() : data.financialEndDate.toISOString()) : 
          new Date(new Date().getFullYear(), 5, 30).toISOString(), // Default to June 30th of current year
      };

      const response = await companyService.updateCompliance(complianceData);
      
      if (response.success) {
        toast.success('Compliance data saved successfully!');
        // Update the company context with new compliance data
        if (updateCompany) {
          updateCompany({
            ...company,
            ...response.data
          });
        }
        // Reload compliance data to ensure form shows updated values
        await fetchCompliance();
      } else {
        toast.error(response.message || 'Failed to save compliance data');
      }
    } catch (error: any) {
      console.error('Error saving compliance data:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save compliance data';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Company Compliance Deadlines</h1>
        {loading ? (
          <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
        ) : (
          <CompanyComplianceForm
            onSubmit={handleSubmit}
            defaultValues={formDefaults}
            deadlines={deadlines}
            onAutoFill={handleAutoFill}
            loading={loading}
          />
        )}
        {error && <div className="text-red-500 mt-4">{error}</div>}
                </div>
    </SidebarLayout>
  );
};

export default Compliance;
