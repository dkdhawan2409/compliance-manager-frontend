#!/usr/bin/env node

/**
 * Debug Frontend OAuth Issue
 * Tests what happens when frontend tries to get OAuth URL
 */

const https = require('https');
const http = require('http');

console.log('🔍 Debug Frontend OAuth Issue');
console.log('=============================\n');

// Test configuration
const BACKEND_URL = 'http://localhost:3333';
const FRONTEND_URL = 'http://localhost:3001';
const API_BASE_URL = 'http://localhost:3333/api';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testWithoutToken() {
  console.log('1. Testing OAuth URL request WITHOUT token...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/xero/connect`);
    console.log('📊 Status:', response.status);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 401) {
      console.log('✅ Expected 401 - authentication required');
      return false;
    } else {
      console.log('⚠️ Unexpected response without token');
      return false;
    }
  } catch (error) {
    console.log('❌ Error without token:', error.message);
    return false;
  }
}

async function testWithToken() {
  console.log('\n2. Testing OAuth URL request WITH token...');
  
  // Create a fresh token
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('cd /Users/harbor/Desktop/compliance-management-system/backend && node create-working-token.js');
    const tokenMatch = stdout.match(/Token: (eyJ[^\\s]+)/);
    
    if (!tokenMatch) {
      console.log('❌ Could not extract token from output');
      return false;
    }
    
    const token = tokenMatch[1];
    console.log('🔑 Using token:', token.substring(0, 20) + '...');
    
    const response = await makeRequest(`${API_BASE_URL}/xero/connect`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success && response.data.data.authUrl) {
      console.log('✅ OAuth URL generated successfully');
      console.log('🔗 Auth URL:', response.data.data.authUrl);
      return true;
    } else {
      console.log('❌ OAuth URL generation failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Error with token:', error.message);
    return false;
  }
}

async function testFrontendToken() {
  console.log('\n3. Testing with frontend token...');
  
  try {
    // Test if we can get a token from the frontend
    const response = await makeRequest(`${FRONTEND_URL}`);
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      
      // Check if there's a way to get a token from the frontend
      console.log('💡 Frontend is running, but we need to check if user is logged in');
      console.log('💡 The issue might be that the user is not authenticated in the frontend');
      return true;
    } else {
      console.log('❌ Frontend not accessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend test error:', error.message);
    return false;
  }
}

async function checkAuthenticationFlow() {
  console.log('\n4. Checking Authentication Flow...');
  
  console.log('🔍 Possible issues:');
  console.log('   1. User not logged in to frontend');
  console.log('   2. Token expired or invalid');
  console.log('   3. CORS issues');
  console.log('   4. API endpoint mismatch');
  console.log('   5. Backend authentication middleware issue');
  
  console.log('\n💡 Solutions to try:');
  console.log('   1. Check if user is logged in to the frontend');
  console.log('   2. Check browser console for errors');
  console.log('   3. Check if token exists in localStorage');
  console.log('   4. Verify API endpoint is correct');
  console.log('   5. Check backend logs for authentication errors');
}

async function runDebug() {
  console.log('🚀 Starting Frontend OAuth Debug...\n');
  
  const results = {
    withoutToken: await testWithoutToken(),
    withToken: await testWithToken(),
    frontend: await testFrontendToken()
  };
  
  console.log('\n📊 Debug Results:');
  console.log('==================');
  console.log(`Without Token: ${results.withoutToken ? '✅' : '❌'}`);
  console.log(`With Token: ${results.withToken ? '✅' : '❌'}`);
  console.log(`Frontend Access: ${results.frontend ? '✅' : '❌'}`);
  
  if (results.withToken) {
    console.log('\n✅ Backend OAuth URL generation is working correctly');
    console.log('❌ The issue is likely in the frontend authentication');
    console.log('\n🔧 Frontend Issues to Check:');
    console.log('   1. Is the user logged in?');
    console.log('   2. Is there a valid token in localStorage?');
    console.log('   3. Are there any JavaScript errors in the browser console?');
    console.log('   4. Is the API call being made correctly?');
  } else {
    console.log('\n❌ Backend OAuth URL generation has issues');
    console.log('🔧 Backend Issues to Check:');
    console.log('   1. Is the backend running?');
    console.log('   2. Are the routes configured correctly?');
    console.log('   3. Is the authentication middleware working?');
  }
  
  await checkAuthenticationFlow();
}

// Run the debug
runDebug().catch(console.error);

