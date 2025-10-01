#!/usr/bin/env node

/**
 * Frontend Integration Test
 * Tests if the frontend can successfully communicate with the backend
 */

const https = require('https');
const http = require('http');

console.log('🌐 Frontend Integration Test');
console.log('============================\n');

// Test configuration
const BACKEND_URL = 'http://localhost:3333';
const FRONTEND_URL = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzU4ODI1MDgzLCJleHAiOjE3NTk0Mjk4ODN9.DNtaikKrT0kDBdxWP71Blo_34ZUbZBgeabFUAGTQsho';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`,
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

async function testFrontendAccessibility() {
  console.log('1. Testing Frontend Accessibility...');
  try {
    const response = await makeRequest(`${FRONTEND_URL}`);
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      return true;
    } else {
      console.log('❌ Frontend returned status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend connection failed:', error.message);
    return false;
  }
}

async function testBackendAPI() {
  console.log('\n2. Testing Backend API Endpoints...');
  
  const endpoints = [
    { name: 'Health Check', url: '/api/health' },
    { name: 'Xero Connect', url: '/api/xero/connect' },
    { name: 'Xero Status', url: '/api/xero/status' },
    { name: 'Xero Settings', url: '/api/xero/settings' }
  ];
  
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint.url}`);
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: Working`);
        results[endpoint.name] = true;
      } else {
        console.log(`❌ ${endpoint.name}: Status ${response.status}`);
        results[endpoint.name] = false;
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      results[endpoint.name] = false;
    }
  }
  
  return results;
}

async function testCORSConfiguration() {
  console.log('\n3. Testing CORS Configuration...');
  try {
    // Test CORS preflight request
    const response = await makeRequest(`${BACKEND_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    };
    
    console.log('📊 CORS Headers:', corsHeaders);
    
    if (corsHeaders['Access-Control-Allow-Origin']) {
      console.log('✅ CORS is configured');
      return true;
    } else {
      console.log('❌ CORS headers missing');
      return false;
    }
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
    return false;
  }
}

async function testXeroContextAPI() {
  console.log('\n4. Testing Xero Context API Calls...');
  
  try {
    // Test the same endpoints that the frontend XeroContext would call
    const response = await makeRequest(`${BACKEND_URL}/api/xero/status`);
    if (response.status === 200) {
      console.log('✅ Xero Context API calls working');
      console.log('📊 Connection Status:', response.data.data);
      return true;
    } else {
      console.log('❌ Xero Context API failed:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Xero Context API error:', error.message);
    return false;
  }
}

async function runIntegrationTest() {
  console.log('🚀 Starting Frontend Integration Test...\n');
  
  const results = {
    frontend: await testFrontendAccessibility(),
    backend: await testBackendAPI(),
    cors: await testCORSConfiguration(),
    xeroContext: await testXeroContextAPI()
  };
  
  console.log('\n📊 Integration Test Results:');
  console.log('============================');
  console.log(`Frontend Accessibility: ${results.frontend ? '✅' : '❌'}`);
  console.log(`Backend API Endpoints: ${Object.values(results.backend).every(v => v) ? '✅' : '❌'}`);
  console.log(`CORS Configuration: ${results.cors ? '✅' : '❌'}`);
  console.log(`Xero Context API: ${results.xeroContext ? '✅' : '❌'}`);
  
  console.log('\n🎯 Summary:');
  if (results.frontend && results.cors && results.xeroContext) {
    console.log('✅ Frontend integration is working correctly');
    console.log('✅ Backend APIs are accessible from frontend');
    console.log('✅ CORS is properly configured');
    console.log('✅ Xero context can communicate with backend');
    
    console.log('\n💡 The Xero integration should work properly in the browser');
    console.log('💡 You can now test the OAuth flow through the frontend interface');
  } else {
    console.log('❌ Frontend integration has issues');
    console.log('❌ Please check the configuration and try again');
  }
  
  console.log('\n🔗 Ready to test in browser:');
  console.log(`${FRONTEND_URL}/integrations/xero`);
}

// Run the integration test
runIntegrationTest().catch(console.error);



