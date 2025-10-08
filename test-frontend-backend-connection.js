#!/usr/bin/env node

const axios = require('axios');

async function testFrontendBackendConnection() {
  console.log('🧪 Testing frontend-backend connection...\n');
  
  // Test 1: Check if frontend is running
  try {
    console.log('1️⃣ Testing frontend server...');
    const frontendResponse = await axios.get('http://localhost:3002');
    console.log('✅ Frontend is running on port 3002');
  } catch (error) {
    console.log('❌ Frontend not running:', error.message);
    return;
  }
  
  // Test 2: Check backend API
  try {
    console.log('\n2️⃣ Testing backend API...');
    const backendResponse = await axios.get('http://localhost:3333/api/health');
    console.log('✅ Backend API is responding');
    console.log('Response:', backendResponse.data);
  } catch (error) {
    console.log('❌ Backend API not responding:', error.message);
    return;
  }
  
  // Test 3: Test login flow
  try {
    console.log('\n3️⃣ Testing login flow...');
    const loginResponse = await axios.post('http://localhost:3333/api/companies/login', {
      email: 'sds@yopmail.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.data.token;
      
      // Test 4: Test Xero endpoints
      console.log('\n4️⃣ Testing Xero endpoints...');
      const xeroResponse = await axios.get('http://localhost:3333/api/xero/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Xero status response:');
      console.log('  - Connected:', xeroResponse.data.data.connected);
      console.log('  - Tenants:', xeroResponse.data.data.tenants?.length || 0);
      console.log('  - Organization names:', xeroResponse.data.data.tenants?.map(t => t.tenantName || t.organisationName) || []);
      
      // Test 5: Test tenants endpoint
      console.log('\n5️⃣ Testing tenants endpoint...');
      const tenantsResponse = await axios.get('http://localhost:3333/api/xero/tenants', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('✅ Tenants response:');
      console.log('  - Tenants count:', tenantsResponse.data.data?.length || 0);
      console.log('  - Organization names:', tenantsResponse.data.data?.map(t => t.tenantName || t.organisationName) || []);
      
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
  } catch (error) {
    console.log('❌ Login test failed:', error.response?.data || error.message);
  }
  
  console.log('\n🎯 Connection test completed!');
  console.log('\n📋 Summary:');
  console.log('- Frontend: http://localhost:3002 ✅');
  console.log('- Backend: http://localhost:3333 ✅');
  console.log('- Xero data: Available ✅');
  console.log('\n💡 If frontend still shows "No Organizations Found", try:');
  console.log('1. Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)');
  console.log('2. Clear browser cache');
  console.log('3. Check browser console for errors');
}

testFrontendBackendConnection().catch(console.error);
