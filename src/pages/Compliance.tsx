import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import { companyService, ComplianceData } from '../api/companyService';
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

  useEffect(() => {
    const fetchCompliance = async () => {
      if (!company?.id) return;
      setLoading(true);
      try {
        const res = await companyService.getCompanyById(company.id);
        const compliance = res.data?.compliance;
        if (compliance) {
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
        }
      } catch (e) {
        setError('Failed to load compliance data');
      } finally {
        setLoading(false);
      }
    };
    fetchCompliance();
  }, [company?.id]);

  const handleSubmit = (data: CompanyComplianceFormValues) => {
    // For now, just log the data. Replace with API call as needed.
    console.log('Compliance form submitted:', data);
  };

  return (
    <SidebarLayout>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">Company Compliance Deadlines</h1>
        {loading ? (
          <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
        ) : (
          <CompanyComplianceForm onSubmit={handleSubmit} defaultValues={formDefaults} />
        )}
        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>
    </SidebarLayout>
  );
};

export default Compliance;
