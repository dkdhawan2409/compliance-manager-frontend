#!/usr/bin/env node

/**
 * Xero OAuth Debug Test
 * Tests the complete OAuth flow to identify issues
 */

const https = require('https');
const http = require('http');

console.log('🔍 Xero OAuth Debug Test');
console.log('========================\n');

// Test configuration
const BACKEND_URL = 'http://localhost:3333';
const FRONTEND_URL = 'http://localhost:3001';
const XERO_CLIENT_ID = '8113118D16A84C8199677E98E3D8A446';
const XERO_REDIRECT_URI = 'https://compliance-manager-frontend.onrender.com/redirecturl';

// Test token
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

async function testBackendHealth() {
  console.log('1. Testing Backend Health...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`);
    if (response.status === 200) {
      console.log('✅ Backend is running');
      return true;
    } else {
      console.log('❌ Backend health check failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    return false;
  }
}

async function testOAuthUrlGeneration() {
  console.log('\n2. Testing OAuth URL Generation...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/xero/connect`);
    if (response.status === 200 && response.data.success) {
      console.log('✅ OAuth URL generated successfully');
      console.log('🔗 Auth URL:', response.data.data.authUrl);
      console.log('🔗 Redirect URI:', response.data.data.redirectUri);
      
      // Verify the URL components
      const authUrl = new URL(response.data.data.authUrl);
      const clientId = authUrl.searchParams.get('client_id');
      const redirectUri = authUrl.searchParams.get('redirect_uri');
      const scope = authUrl.searchParams.get('scope');
      
      console.log('\n📋 URL Analysis:');
      console.log(`   Client ID: ${clientId}`);
      console.log(`   Redirect URI: ${redirectUri}`);
      console.log(`   Scope: ${scope}`);
      
      if (clientId === XERO_CLIENT_ID) {
        console.log('✅ Client ID matches configuration');
      } else {
        console.log('❌ Client ID mismatch');
      }
      
      if (redirectUri === XERO_REDIRECT_URI) {
        console.log('✅ Redirect URI matches configuration');
      } else {
        console.log('❌ Redirect URI mismatch');
      }
      
      return response.data.data.authUrl;
    } else {
      console.log('❌ OAuth URL generation failed:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ OAuth URL generation error:', error.message);
    return null;
  }
}

async function testXeroAppConfiguration() {
  console.log('\n3. Testing Xero App Configuration...');
  
  // Test if the Xero app accepts our client ID
  const testUrl = `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${XERO_CLIENT_ID}&redirect_uri=${encodeURIComponent(XERO_REDIRECT_URI)}&scope=offline_access&state=test`;
  
  console.log('🔗 Testing Xero app with URL:', testUrl);
  
  try {
    const response = await makeRequest(testUrl);
    console.log('📊 Response Status:', response.status);
    
    if (response.status === 400) {
      console.log('❌ Xero returned 400 - likely unauthorized_client error');
      console.log('💡 This suggests the Xero app is not properly configured');
      return false;
    } else if (response.status === 302) {
      console.log('✅ Xero accepted the request (redirect response)');
      return true;
    } else {
      console.log('⚠️ Unexpected response from Xero:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Xero app test failed:', error.message);
    return false;
  }
}

async function testFrontendConnection() {
  console.log('\n4. Testing Frontend Connection...');
  try {
    const response = await makeRequest(`${FRONTEND_URL}`);
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      return true;
    } else {
      console.log('❌ Frontend connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend connection error:', error.message);
    return false;
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting Xero OAuth Diagnostics...\n');
  
  const results = {
    backend: await testBackendHealth(),
    oauthUrl: await testOAuthUrlGeneration(),
    xeroApp: await testXeroAppConfiguration(),
    frontend: await testFrontendConnection()
  };
  
  console.log('\n📊 Diagnostic Results:');
  console.log('======================');
  console.log(`Backend Health: ${results.backend ? '✅' : '❌'}`);
  console.log(`OAuth URL Generation: ${results.oauthUrl ? '✅' : '❌'}`);
  console.log(`Xero App Configuration: ${results.xeroApp ? '✅' : '❌'}`);
  console.log(`Frontend Connection: ${results.frontend ? '✅' : '❌'}`);
  
  console.log('\n🔧 Recommendations:');
  if (!results.xeroApp) {
    console.log('❌ Xero App Issue:');
    console.log('   1. Check Xero Developer Portal (https://developer.xero.com/)');
    console.log('   2. Verify client ID: 8113118D16A84C8199677E98E3D8A446');
    console.log('   3. Verify redirect URI: https://compliance-manager-frontend.onrender.com/redirecturl');
    console.log('   4. Ensure the app is published/active');
    console.log('   5. Check if the app has the required scopes');
  }
  
  if (results.oauthUrl && !results.xeroApp) {
    console.log('\n💡 The OAuth URL is being generated correctly, but Xero is rejecting it.');
    console.log('   This indicates a configuration issue in the Xero Developer Portal.');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Verify Xero app configuration in developer portal');
  console.log('2. Check if the app is published and active');
  console.log('3. Ensure redirect URI exactly matches: https://compliance-manager-frontend.onrender.com/redirecturl');
  console.log('4. Verify the app has all required scopes');
}

// Run the diagnostics
runDiagnostics().catch(console.error);









