#!/usr/bin/env node

/**
 * Test Frontend OAuth Request
 * Simulates what the frontend should be doing
 */

const https = require('https');
const http = require('http');

console.log('🌐 Test Frontend OAuth Request');
console.log('==============================\n');

// Test configuration
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

async function testFrontendOAuthRequest() {
  console.log('Testing OAuth request as frontend would make it...');
  
  // Simulate what the frontend XeroContext.connect() function does
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzU4ODI1OTY1LCJleHAiOjE3NTk0MzA3NjV9.DE676swwvOPK0GthWyjfUuFaMNGbgFqstEldu42xhwc';
  
  try {
    console.log('🔗 Making request to:', `${API_BASE_URL}/xero/connect`);
    console.log('🔑 Using token:', token.substring(0, 20) + '...');
    
    const response = await makeRequest(`${API_BASE_URL}/xero/connect`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success && response.data.data.authUrl) {
      console.log('✅ OAuth URL received successfully!');
      console.log('🔗 Auth URL:', response.data.data.authUrl);
      return true;
    } else {
      console.log('❌ OAuth URL request failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Request error:', error.message);
    return false;
  }
}

async function testCORSHeaders() {
  console.log('\nTesting CORS headers...');
  
  try {
    const response = await makeRequest(`${API_BASE_URL}/xero/connect`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      }
    });
    
    console.log('📊 CORS Response Status:', response.status);
    console.log('📊 CORS Headers:', {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    });
    
    return response.status === 200;
  } catch (error) {
    console.log('❌ CORS test error:', error.message);
    return false;
  }
}

async function runTest() {
  console.log('🚀 Starting Frontend OAuth Request Test...\n');
  
  const results = {
    oauthRequest: await testFrontendOAuthRequest(),
    cors: await testCORSHeaders()
  };
  
  console.log('\n📊 Test Results:');
  console.log('================');
  console.log(`OAuth Request: ${results.oauthRequest ? '✅' : '❌'}`);
  console.log(`CORS Headers: ${results.cors ? '✅' : '❌'}`);
  
  if (results.oauthRequest) {
    console.log('\n✅ Backend is working correctly!');
    console.log('❌ The issue is in the frontend code');
    console.log('\n🔧 Frontend Issues to Check:');
    console.log('   1. Is the user logged in?');
    console.log('   2. Is the token being sent correctly?');
    console.log('   3. Are there JavaScript errors in the browser?');
    console.log('   4. Is the API call being made at all?');
    console.log('   5. Check browser Network tab for failed requests');
  } else {
    console.log('\n❌ Backend has issues');
    console.log('🔧 Backend Issues to Check:');
    console.log('   1. Authentication middleware');
    console.log('   2. Route configuration');
    console.log('   3. Environment variables');
  }
}

// Run the test
runTest().catch(console.error);

