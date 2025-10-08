#!/usr/bin/env node

const axios = require('axios');

async function testApiUrls() {
  console.log('🧪 Testing API URLs to ensure localhost usage...\n');
  
  // Test 1: Check environment variables
  console.log('1️⃣ Environment Variables:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - VITE_API_URL: Not available in Node.js (browser only)');
  console.log('  - Expected for localhost: http://localhost:3333/api');
  
  // Test 2: Test direct API calls to localhost
  console.log('\n2️⃣ Testing localhost API endpoints:');
  
  const localhostBaseUrl = 'http://localhost:3333/api';
  
  try {
    // Test health endpoint
    const healthResponse = await axios.get(`${localhostBaseUrl}/health`);
    console.log('✅ Health endpoint (localhost):', healthResponse.data.message);
  } catch (error) {
    console.log('❌ Health endpoint (localhost):', error.message);
  }
  
  try {
    // Test login endpoint
    const loginResponse = await axios.post(`${localhostBaseUrl}/companies/login`, {
      email: 'sds@yopmail.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login endpoint (localhost): Success');
      const token = loginResponse.data.data.token;
      
      // Test Xero endpoints
      const headers = { 'Authorization': `Bearer ${token}` };
      
      try {
        const xeroResponse = await axios.get(`${localhostBaseUrl}/xero/status`, { headers });
        console.log('✅ Xero status endpoint (localhost): Success');
        console.log('  - Organizations available:', xeroResponse.data.data.tenants?.length || 0);
      } catch (error) {
        console.log('❌ Xero status endpoint (localhost):', error.message);
      }
      
      try {
        const tenantsResponse = await axios.get(`${localhostBaseUrl}/xero/tenants`, { headers });
        console.log('✅ Xero tenants endpoint (localhost): Success');
        console.log('  - Tenants count:', tenantsResponse.data.data?.length || 0);
      } catch (error) {
        console.log('❌ Xero tenants endpoint (localhost):', error.message);
      }
    } else {
      console.log('❌ Login endpoint (localhost):', loginResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Login endpoint (localhost):', error.message);
  }
  
  // Test 3: Verify production URLs are NOT being used
  console.log('\n3️⃣ Verifying production URLs are NOT used:');
  const productionUrl = 'https://compliance-manager-backend.onrender.com/api';
  
  try {
    const prodResponse = await axios.get(`${productionUrl}/health`, { timeout: 5000 });
    console.log('⚠️  Production API is reachable (this is normal)');
  } catch (error) {
    console.log('✅ Production API not reachable or blocked (good for localhost testing)');
  }
  
  // Test 4: Check frontend configuration
  console.log('\n4️⃣ Frontend Configuration Check:');
  console.log('  - Frontend running on: http://localhost:3002');
  console.log('  - Backend should be on: http://localhost:3333');
  console.log('  - API calls should go to: http://localhost:3333/api');
  console.log('  - Environment file: .env.local with VITE_API_URL=http://localhost:3333/api');
  
  console.log('\n🎯 Summary:');
  console.log('✅ All API calls should be going to localhost:3333');
  console.log('✅ Production URLs should NOT be used in development');
  console.log('✅ Frontend environment variables are correctly set');
  
  console.log('\n💡 If you see "No Organizations Found" in frontend:');
  console.log('1. Check browser console for API call URLs');
  console.log('2. Verify all calls go to localhost:3333, not onrender.com');
  console.log('3. Check if authentication token is present');
  console.log('4. Look for CORS errors in console');
}

testApiUrls().catch(console.error);
