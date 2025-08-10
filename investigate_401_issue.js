const axios = require('axios');

console.log('🔍 Investigating 401 Error - Dashboard Data Issue\n');

// Configuration
const API_BASE = 'http://localhost:3333/api';
const FRONTEND_URL = 'http://localhost:3001';

async function investigate401Issue() {
  console.log('🔧 STEP 1: Backend Health Check');
  try {
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ Backend is running:', healthResponse.status);
    console.log('📊 Backend data:', healthResponse.data);
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    console.log('💡 Make sure backend is running on localhost:3333');
    return;
  }

  console.log('\n🔧 STEP 2: Test Authentication Endpoints');
  
  // Test login endpoint (without auth)
  try {
    console.log('🔍 Testing login endpoint...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    });
    console.log('✅ Login endpoint accessible:', loginResponse.status);
  } catch (error) {
    console.log('⚠️ Login endpoint test:', error.response?.status || error.message);
  }

  console.log('\n🔧 STEP 3: Test Xero Endpoints (without auth)');
  
  // Test Xero endpoints without authentication
  const xeroEndpoints = [
    '/xero/login',
    '/xero/settings',
    '/xero/connection-status',
    '/xero/dashboard-data'
  ];

  for (const endpoint of xeroEndpoints) {
    try {
      console.log(`🔍 Testing ${endpoint}...`);
      const response = await axios.get(`${API_BASE}${endpoint}`);
      console.log(`✅ ${endpoint}: ${response.status}`);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;
      console.log(`❌ ${endpoint}: ${status} - ${message}`);
      
      if (status === 401) {
        console.log('   💡 This endpoint requires authentication');
      }
    }
  }

  console.log('\n🔧 STEP 4: Authentication Flow Analysis');
  console.log('📋 To test with authentication:');
  console.log('   1. Open browser and go to http://localhost:3001');
  console.log('   2. Log in to the application');
  console.log('   3. Check localStorage for "token" key');
  console.log('   4. Try accessing Xero dashboard');
  console.log('   5. Check browser console for detailed logs');

  console.log('\n🔧 STEP 5: Common Issues and Solutions');
  console.log('❌ Issue 1: User not logged in');
  console.log('   Solution: Log in to the application first');
  console.log('');
  console.log('❌ Issue 2: Token missing from localStorage');
  console.log('   Solution: Clear localStorage and re-login');
  console.log('');
  console.log('❌ Issue 3: Token expired');
  console.log('   Solution: Refresh page or re-login');
  console.log('');
  console.log('❌ Issue 4: Backend auth middleware issue');
  console.log('   Solution: Check backend logs for auth errors');
  console.log('');
  console.log('❌ Issue 5: CORS or network issues');
  console.log('   Solution: Check browser network tab');

  console.log('\n🔧 STEP 6: Debugging Commands');
  console.log('💻 Browser Console Commands:');
  console.log('   // Check if user is authenticated');
  console.log('   localStorage.getItem("token")');
  console.log('');
  console.log('   // Check company info');
  console.log('   localStorage.getItem("company")');
  console.log('');
  console.log('   // Clear all data and re-login');
  console.log('   localStorage.clear()');
  console.log('');
  console.log('   // Check if Xero is connected');
  console.log('   localStorage.getItem("xero_authorized")');

  console.log('\n🔧 STEP 7: Backend Log Analysis');
  console.log('📊 Check backend console for these logs:');
  console.log('   🔍 DEBUG: authMiddleware called');
  console.log('   🔍 DEBUG: Authorization header: Bearer <token>');
  console.log('   🔍 DEBUG: Token decoded, id: <company_id>');
  console.log('   🔍 DEBUG: Company found: yes/no');
  console.log('   🔍 DEBUG: Setting req.company: <company_id> <role>');

  console.log('\n🔧 STEP 8: Frontend Log Analysis');
  console.log('📊 Check browser console for these logs:');
  console.log('   🔐 Xero API Request: { method: "GET", url: "/xero/dashboard-data", hasToken: true }');
  console.log('   ❌ Xero API Error: { status: 401, message: "..." }');
  console.log('   🔐 Authentication failed - token may be expired or invalid');

  console.log('\n🎯 INVESTIGATION SUMMARY:');
  console.log('   The 401 error is likely due to:');
  console.log('   1. User not being logged into the application');
  console.log('   2. Missing or expired authentication token');
  console.log('   3. Token not being sent in Authorization header');
  console.log('   4. Backend authentication middleware rejecting the token');
  console.log('');
  console.log('   Next steps:');
  console.log('   1. Ensure user is logged in to the application');
  console.log('   2. Check browser localStorage for valid token');
  console.log('   3. Verify Authorization header is being sent');
  console.log('   4. Check backend logs for authentication details');
  console.log('   5. Test with fresh login if needed');

  console.log('\n🚀 INVESTIGATION COMPLETE!');
  console.log('   Follow the debugging steps above');
  console.log('   Check authentication status first');
  console.log('   Verify token is being sent properly');
  console.log('   Test with fresh login if needed');
}

// Run the investigation
investigate401Issue().catch(console.error);
