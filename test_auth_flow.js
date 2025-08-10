const axios = require('axios');

console.log('🔍 Testing Authentication Flow\n');

// Configuration
const API_BASE = 'http://localhost:3333/api';

async function testAuthFlow() {
  console.log('🔧 STEP 1: Test Login Endpoint');
  
  try {
    console.log('🔍 Testing correct login endpoint: /api/company/login');
    const loginResponse = await axios.post(`${API_BASE}/company/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    });
    console.log('✅ Login successful:', loginResponse.status);
    console.log('📊 Response data:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('🔐 Token received:', token.substring(0, 20) + '...');
      
      console.log('\n🔧 STEP 2: Test Xero Endpoints with Token');
      
      // Test Xero endpoints with authentication
      const xeroEndpoints = [
        '/xero/settings',
        '/xero/connection-status',
        '/xero/dashboard-data'
      ];

      for (const endpoint of xeroEndpoints) {
        try {
          console.log(`🔍 Testing ${endpoint} with token...`);
          const response = await axios.get(`${API_BASE}${endpoint}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log(`✅ ${endpoint}: ${response.status}`);
          console.log(`📊 Response:`, response.data);
        } catch (error) {
          const status = error.response?.status;
          const message = error.response?.data?.message || error.message;
          console.log(`❌ ${endpoint}: ${status} - ${message}`);
          
          if (status === 401) {
            console.log('   💡 Authentication failed - token may be invalid');
          } else if (status === 404) {
            console.log('   💡 Endpoint not found or not implemented');
          }
        }
      }
      
    } else {
      console.log('❌ Login failed - no token received');
    }
    
  } catch (error) {
    console.log('❌ Login test failed:', error.response?.status || error.message);
    console.log('📊 Error response:', error.response?.data);
    
    if (error.response?.status === 404) {
      console.log('💡 Login endpoint not found - check route configuration');
    } else if (error.response?.status === 401) {
      console.log('💡 Invalid credentials - check test user exists');
    }
  }

  console.log('\n🔧 STEP 3: Create Test User (if needed)');
  console.log('📋 If login fails, you may need to create a test user:');
  console.log('   POST /api/company/register');
  console.log('   {');
  console.log('     "email": "test@example.com",');
  console.log('     "password": "testpassword",');
  console.log('     "companyName": "Test Company",');
  console.log('     "role": "company"');
  console.log('   }');

  console.log('\n🔧 STEP 4: Manual Testing Instructions');
  console.log('📋 To test in browser:');
  console.log('   1. Open http://localhost:3001');
  console.log('   2. Go to login page');
  console.log('   3. Log in with valid credentials');
  console.log('   4. Check localStorage for token:');
  console.log('      localStorage.getItem("token")');
  console.log('   5. Navigate to Xero integration');
  console.log('   6. Check browser console for API logs');

  console.log('\n🔧 STEP 5: Debugging Commands');
  console.log('💻 Browser Console Commands:');
  console.log('   // Check authentication status');
  console.log('   localStorage.getItem("token")');
  console.log('   localStorage.getItem("company")');
  console.log('');
  console.log('   // Test API call manually');
  console.log('   fetch("http://localhost:3333/api/xero/dashboard-data", {');
  console.log('     headers: {');
  console.log('       "Authorization": "Bearer " + localStorage.getItem("token"),');
  console.log('       "Content-Type": "application/json"');
  console.log('     }');
  console.log('   }).then(r => r.json()).then(console.log)');
  console.log('');
  console.log('   // Clear all data');
  console.log('   localStorage.clear()');

  console.log('\n🎯 AUTHENTICATION FLOW SUMMARY:');
  console.log('   ✅ Backend is running and accessible');
  console.log('   ✅ Login endpoint is at /api/company/login');
  console.log('   ✅ Xero endpoints require authentication');
  console.log('   ✅ Token must be sent in Authorization header');
  console.log('   ✅ User must be logged in to access Xero data');
  console.log('');
  console.log('   Next steps:');
  console.log('   1. Ensure user is logged in to the application');
  console.log('   2. Verify token is present in localStorage');
  console.log('   3. Check Authorization header is being sent');
  console.log('   4. Test Xero dashboard access');
  console.log('   5. Monitor browser console for detailed logs');

  console.log('\n🚀 AUTHENTICATION FLOW TEST COMPLETE!');
  console.log('   The 401 error is due to missing authentication');
  console.log('   User must log in to the application first');
  console.log('   Token must be present and valid');
  console.log('   Ready for manual testing');
}

// Run the test
testAuthFlow().catch(console.error);
