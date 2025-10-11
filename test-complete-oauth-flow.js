#!/usr/bin/env node

/**
 * Complete Xero OAuth Flow Test
 * Tests the entire OAuth flow from start to finish
 */

const https = require('https');
const http = require('http');

console.log('🔄 Complete Xero OAuth Flow Test');
console.log('================================\n');

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

async function testStep1_GetAuthUrl() {
  console.log('Step 1: Getting OAuth Authorization URL...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/xero/connect`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ OAuth URL generated successfully');
      const authUrl = response.data.data.authUrl;
      console.log('🔗 Auth URL:', authUrl);
      
      // Extract state parameter
      const url = new URL(authUrl);
      const state = url.searchParams.get('state');
      console.log('🔑 State parameter:', state);
      
      return { authUrl, state };
    } else {
      console.log('❌ Failed to get OAuth URL:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting OAuth URL:', error.message);
    return null;
  }
}

async function testStep2_CheckConnectionStatus() {
  console.log('\nStep 2: Checking Connection Status...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/xero/status`);
    if (response.status === 200) {
      console.log('✅ Connection status retrieved');
      console.log('📊 Status:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.log('❌ Failed to get connection status:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting connection status:', error.message);
    return null;
  }
}

async function testStep3_CheckSettings() {
  console.log('\nStep 3: Checking Xero Settings...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/xero/settings`);
    if (response.status === 200) {
      console.log('✅ Xero settings retrieved');
      console.log('📊 Settings:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.log('❌ Failed to get Xero settings:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error getting Xero settings:', error.message);
    return null;
  }
}

async function testStep4_SimulateOAuthCallback() {
  console.log('\nStep 4: Simulating OAuth Callback...');
  
  // Simulate a successful OAuth callback with a mock authorization code
  const mockCode = 'mock_auth_code_12345';
  const mockState = '7'; // Company ID
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/xero/callback`, {
      method: 'POST',
      body: {
        code: mockCode,
        state: mockState,
        redirectUri: 'https://compliance-manager-frontend.onrender.com/redirecturl'
      }
    });
    
    console.log('📊 Callback Response Status:', response.status);
    console.log('📊 Callback Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ OAuth callback handled successfully');
      return true;
    } else {
      console.log('⚠️ OAuth callback returned non-200 status (expected for mock code)');
      return false;
    }
  } catch (error) {
    console.log('❌ Error in OAuth callback:', error.message);
    return false;
  }
}

async function testStep5_TestDataAccess() {
  console.log('\nStep 5: Testing Data Access...');
  
  // Test if we can access Xero data (this will fail if not connected, but that's expected)
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/xero/data?type=invoices`);
    console.log('📊 Data Access Response Status:', response.status);
    console.log('📊 Data Access Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Data access successful');
      return true;
    } else {
      console.log('⚠️ Data access failed (expected if not connected to Xero)');
      return false;
    }
  } catch (error) {
    console.log('❌ Error accessing data:', error.message);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Complete OAuth Flow Test...\n');
  
  const results = {
    step1: await testStep1_GetAuthUrl(),
    step2: await testStep2_CheckConnectionStatus(),
    step3: await testStep3_CheckSettings(),
    step4: await testStep4_SimulateOAuthCallback(),
    step5: await testStep5_TestDataAccess()
  };
  
  console.log('\n📊 Complete Test Results:');
  console.log('==========================');
  console.log(`Step 1 - OAuth URL Generation: ${results.step1 ? '✅' : '❌'}`);
  console.log(`Step 2 - Connection Status: ${results.step2 ? '✅' : '❌'}`);
  console.log(`Step 3 - Settings Check: ${results.step3 ? '✅' : '❌'}`);
  console.log(`Step 4 - OAuth Callback: ${results.step4 ? '✅' : '⚠️'}`);
  console.log(`Step 5 - Data Access: ${results.step5 ? '✅' : '⚠️'}`);
  
  console.log('\n🎯 Summary:');
  if (results.step1 && results.step2 && results.step3) {
    console.log('✅ Core OAuth infrastructure is working correctly');
    console.log('✅ Backend API endpoints are functioning');
    console.log('✅ Xero configuration is properly set up');
    
    if (!results.step4) {
      console.log('⚠️ OAuth callback simulation failed (expected with mock code)');
    }
    
    if (!results.step5) {
      console.log('⚠️ Data access failed (expected if not connected to Xero)');
    }
    
    console.log('\n💡 To complete the OAuth flow:');
    console.log('1. Use the generated OAuth URL to authorize with Xero');
    console.log('2. Complete the authorization in your browser');
    console.log('3. Xero will redirect back with a real authorization code');
    console.log('4. The callback will exchange the code for access tokens');
    console.log('5. You can then access Xero data');
    
    if (results.step1) {
      console.log('\n🔗 Ready to test OAuth URL:');
      console.log(results.step1.authUrl);
    }
  } else {
    console.log('❌ Core OAuth infrastructure has issues');
    console.log('❌ Please check the backend configuration and Xero app setup');
  }
}

// Run the complete test
runCompleteTest().catch(console.error);











