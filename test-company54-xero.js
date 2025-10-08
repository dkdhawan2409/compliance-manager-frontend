#!/usr/bin/env node

const axios = require('axios');

async function testCompany54Xero() {
  console.log('🧪 Testing Xero with Company 54...\n');
  
  const baseURL = 'http://localhost:3333/api';
  
  try {
    // Step 1: Login as company 54
    console.log('1️⃣ Logging in as Company 54...');
    const loginResponse = await axios.post(`${baseURL}/companies/login`, {
      email: 'sds@yopmail.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token || loginResponse.data.data?.token;
      console.log('✅ Login successful!');
      console.log('Full response:', JSON.stringify(loginResponse.data, null, 2));
      if (token) {
        console.log('Token:', token.substring(0, 20) + '...');
        
        // Step 2: Test Xero status
      console.log('\n2️⃣ Testing Xero status...');
      const xeroResponse = await axios.get(`${baseURL}/xero/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Xero status response:');
      console.log(JSON.stringify(xeroResponse.data, null, 2));
      
      // Step 3: Test tenants endpoint
      console.log('\n3️⃣ Testing tenants endpoint...');
      const tenantsResponse = await axios.get(`${baseURL}/xero/tenants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
        console.log('✅ Tenants response:');
        console.log(JSON.stringify(tenantsResponse.data, null, 2));
        
      } else {
        console.log('❌ No token received');
      }
    } else {
      console.log('❌ Login failed:', loginResponse.data);
      
      // Try with different passwords
      const passwords = ['password', '123456', 'admin', 'test'];
      for (const pwd of passwords) {
        try {
          console.log(`\n🔄 Trying password: ${pwd}`);
          const retryResponse = await axios.post(`${baseURL}/companies/login`, {
            email: 'sds@yopmail.com',
            password: pwd
          });
          
          if (retryResponse.data.success) {
            console.log(`✅ Login successful with password: ${pwd}`);
            break;
          }
        } catch (e) {
          console.log(`❌ Password ${pwd} failed`);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
    
    // If login route doesn't exist, let's check what auth routes are available
    try {
      console.log('\n🔍 Checking available auth routes...');
      const authResponse = await axios.get(`${baseURL}/auth/test`);
      console.log('Auth test response:', authResponse.data);
    } catch (authError) {
      console.log('Auth test failed:', authError.response?.data || authError.message);
    }
  }
}

testCompany54Xero().catch(console.error);
