import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { companyService, ProfileData } from '../api/companyService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Grid, Card, CardContent, Container, Box, Typography, Button, TextField, InputAdornment } from '@mui/material';
import { Business, Email, Phone } from '@mui/icons-material';
import CountryCodeSelect from '../components/CountryCodeSelect';
import SidebarLayout from '../components/SidebarLayout';

const validationSchema = Yup.object({
  companyName: Yup.string()
    .min(2, 'Company name must be at least 2 characters')
    .max(255, 'Company name must not exceed 255 characters')
    .required('Company name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  countryCode: Yup.string()
    .required('Country code is required'),
  mobileNumber: Yup.string()
    .matches(/^[1-9][\d\s\-\(\)]{8,20}$/, 'Invalid mobile number')
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
      countryCode: company?.countryCode || '+61',
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
          countryCode: values.countryCode,
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
    <SidebarLayout>
      <Container maxWidth="md">
        <Box sx={{ mt: 6, mb: 6 }}>
          <Card sx={{ width: '100%', maxWidth: 800, mx: 'auto', borderRadius: 3, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>
                Personal Information
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Update your personal information below
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
                      fullWidth
                      id="companyName"
                      name="companyName"
                      label="Company Name"
                      value={formik.values.companyName}
                      onChange={formik.handleChange}
                      error={formik.touched.companyName && Boolean(formik.errors.companyName)}
                      helperText={formik.touched.companyName && formik.errors.companyName}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Business />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      id="email"
                      name="email"
                      label="Email Address"
                      type="email"
                      value={formik.values.email}
                      onChange={formik.handleChange}
                      error={formik.touched.email && Boolean(formik.errors.email)}
                      helperText={formik.touched.email && formik.errors.email}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <CountryCodeSelect
                      value={formik.values.countryCode}
                      onChange={(value) => formik.setFieldValue('countryCode', value)}
                      error={formik.touched.countryCode && Boolean(formik.errors.countryCode)}
                      helperText={formik.touched.countryCode && formik.errors.countryCode ? String(formik.errors.countryCode) : undefined}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      id="mobileNumber"
                      name="mobileNumber"
                      label="Phone Number"
                      value={formik.values.mobileNumber}
                      onChange={formik.handleChange}
                      error={formik.touched.mobileNumber && Boolean(formik.errors.mobileNumber)}
                      helperText={formik.touched.mobileNumber && formik.errors.mobileNumber}
                      margin="normal"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone />
                          </InputAdornment>
                        ),
                      }}
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

export default Profile;
