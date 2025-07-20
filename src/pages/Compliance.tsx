import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import dayjs from 'dayjs';
import { companyService, ComplianceData } from '../api/companyService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import SidebarLayout from '../components/SidebarLayout';
import { Grid, Card, CardContent, Container, Box, Typography, Button, TextField, MenuItem } from '@mui/material';

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
    <SidebarLayout>
      <Container maxWidth="md">
        <Box sx={{ mt: 6, mb: 6 }}>
          <Card sx={{ width: '100%', maxWidth: 800, mx: 'auto', borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>
                Compliance Information
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Update your compliance details below
              </Typography>
              {error && (
                <div className="mb-3">
                  <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-lg animate-fade-in">
                    {error}
                  </div>
                </div>
              )}
              <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      sx={{ minWidth: 220 }}
                      id="basFrequency"
                      name="basFrequency"
                      label="BAS Frequency"
                      value={formik.values.basFrequency}
                      onChange={formik.handleChange}
                      error={formik.touched.basFrequency && Boolean(formik.errors.basFrequency)}
                      helperText={formik.touched.basFrequency && formik.errors.basFrequency}
                      margin="normal"
                    >
                      <MenuItem value="">Select frequency</MenuItem>
                      <MenuItem value="Monthly">Monthly</MenuItem>
                      <MenuItem value="Quarterly">Quarterly</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      sx={{ minWidth: 220 }}
                      id="nextBasDue"
                      name="nextBasDue"
                      label="Next BAS Due"
                      type="date"
                      value={formik.values.nextBasDue}
                      onChange={formik.handleChange}
                      error={formik.touched.nextBasDue && Boolean(formik.errors.nextBasDue)}
                      helperText={formik.touched.nextBasDue && formik.errors.nextBasDue}
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      sx={{ minWidth: 220 }}
                      id="fbtApplicable"
                      name="fbtApplicable"
                      label="FBT Applicable"
                      value={formik.values.fbtApplicable}
                      onChange={formik.handleChange}
                      error={formik.touched.fbtApplicable && Boolean(formik.errors.fbtApplicable)}
                      helperText={formik.touched.fbtApplicable && formik.errors.fbtApplicable}
                      margin="normal"
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      sx={{ minWidth: 220 }}
                      id="nextFbtDue"
                      name="nextFbtDue"
                      label="Next FBT Due"
                      type="date"
                      value={formik.values.nextFbtDue}
                      onChange={formik.handleChange}
                      error={formik.touched.nextFbtDue && Boolean(formik.errors.nextFbtDue)}
                      helperText={formik.touched.nextFbtDue && formik.errors.nextFbtDue}
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      sx={{ minWidth: 220 }}
                      id="iasRequired"
                      name="iasRequired"
                      label="IAS Required"
                      value={formik.values.iasRequired}
                      onChange={formik.handleChange}
                      error={formik.touched.iasRequired && Boolean(formik.errors.iasRequired)}
                      helperText={formik.touched.iasRequired && formik.errors.iasRequired}
                      margin="normal"
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      sx={{ minWidth: 220 }}
                      id="iasFrequency"
                      name="iasFrequency"
                      label="IAS Frequency"
                      value={formik.values.iasFrequency}
                      onChange={formik.handleChange}
                      error={formik.touched.iasFrequency && Boolean(formik.errors.iasFrequency)}
                      helperText={formik.touched.iasFrequency && formik.errors.iasFrequency}
                      margin="normal"
                    >
                      <MenuItem value="">Select frequency</MenuItem>
                      <MenuItem value="Monthly">Monthly</MenuItem>
                      <MenuItem value="Quarterly">Quarterly</MenuItem>
                      <MenuItem value="Annually">Annually</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      sx={{ minWidth: 220 }}
                      id="nextIasDue"
                      name="nextIasDue"
                      label="Next IAS Due"
                      type="date"
                      value={formik.values.nextIasDue}
                      onChange={formik.handleChange}
                      error={formik.touched.nextIasDue && Boolean(formik.errors.nextIasDue)}
                      helperText={formik.touched.nextIasDue && formik.errors.nextIasDue}
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      sx={{ minWidth: 220 }}
                      id="financialEndDate"
                      name="financialEndDate"
                      label="Financial Year End"
                      type="date"
                      value={formik.values.financialEndDate}
                      onChange={formik.handleChange}
                      error={formik.touched.financialEndDate && Boolean(formik.errors.financialEndDate)}
                      helperText={formik.touched.financialEndDate && formik.errors.financialEndDate}
                      margin="normal"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate('/dashboard')}
                    sx={{ minWidth: 120, borderRadius: 2 }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ minWidth: 120, borderRadius: 2 }}
                    disabled={formik.isSubmitting}
                  >
                    {formik.isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </SidebarLayout>
  );
};

export default Compliance;
