import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Grid,
} from '@mui/material';
import { Visibility, VisibilityOff, Business, Email, Phone } from '@mui/icons-material';
import { companyService, CompanyRegistrationData } from '../api/companyService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import CountryCodeSelect from '../components/CountryCodeSelect';

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
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const formik = useFormik({
    initialValues: {
      companyName: '',
      email: '',
      countryCode: '+61',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError('');
        const registrationData: CompanyRegistrationData = {
          companyName: values.companyName,
          email: values.email,
          mobileNumber: values.mobileNumber,
          countryCode: values.countryCode,
          password: values.password,
        };

        const response = await companyService.register(registrationData);
        login(response.data.company, response.data.token);
        toast.success('Registration successful!');
        navigate('/dashboard');
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Registration failed';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    },
  });

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 6, mb: 6 }}>
        <Card sx={{ width: '100%', maxWidth: 800, mx: 'auto', borderRadius: 3, boxShadow: 2 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h2" variant="h5" fontWeight={700} gutterBottom>
              Personal Information
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please provide your personal information in order to complete your KYC
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
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
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                    margin="normal"
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
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
                  onClick={() => navigate('/login')}
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
                  {formik.isSubmitting ? 'Creating Account...' : 'Next'}
                </Button>
              </Box>
              <Box textAlign="center" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Already have an account?{' '}
                  <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none' }}>
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Register;
