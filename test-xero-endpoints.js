#!/usr/bin/env node

const axios = require('axios');

async function testXeroEndpoints() {
  console.log('🧪 Testing Xero API endpoints...\n');
  
  const baseURL = 'http://localhost:3333/api';
  
  // Test 1: Check if backend is running
  try {
    console.log('1️⃣ Testing backend connection...');
    const response = await axios.get(`${baseURL}/xero/status`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Backend is running');
    console.log('Response:', response.data);
  } catch (error) {
    console.log('❌ Backend connection failed:', error.response?.data || error.message);
  }
  
  // Test 2: Check with a real company token (if available)
  try {
    console.log('\n2️⃣ Testing with company 54 (has Xero data)...');
    
    // First, we need to get a valid token for company 54
    // Let's try to login as company 54
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'company54@test.com', // This might need to be adjusted
      password: 'password'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful, testing Xero status...');
      
      const xeroResponse = await axios.get(`${baseURL}/xero/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Xero status response:', JSON.stringify(xeroResponse.data, null, 2));
    } else {
      console.log('❌ Login failed:', loginResponse.data);
    }
  } catch (error) {
    console.log('❌ Test with company 54 failed:', error.response?.data || error.message);
  }
  
  // Test 3: Check tenants endpoint directly
  try {
    console.log('\n3️⃣ Testing tenants endpoint...');
    const tenantsResponse = await axios.get(`${baseURL}/xero/tenants`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Tenants endpoint response:', tenantsResponse.data);
  } catch (error) {
    console.log('❌ Tenants endpoint failed:', error.response?.data || error.message);
  }
}

testXeroEndpoints().catch(console.error);
