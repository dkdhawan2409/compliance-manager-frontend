const axios = require('axios');

/**
 * Comprehensive Xero Integration Test
 * Tests the complete OAuth flow and data access
 */

const API_BASE_URL = 'http://localhost:3333/api';
const FRONTEND_URL = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzU4NzgyNjM4LCJleHAiOjE3NTkzODc0Mzh9.P_OhjIDK96V4iYkcmhsiadIpEJbmrExL3pU54piPe-8';

const headers = {
  'Authorization': `Bearer ${TEST_TOKEN}`,
  'Content-Type': 'application/json'
};

async function testBackendHealth() {
  console.log('1️⃣ Testing Backend Health...');
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    if (response.data.success) {
      console.log('✅ Backend is healthy');
      return true;
    } else {
      console.log('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is not responding:', error.message);
    return false;
  }
}

async function testXeroOAuthUrl() {
  console.log('\n2️⃣ Testing Xero OAuth URL Generation...');
  try {
    const response = await axios.get(`${API_BASE_URL}/xero/connect`, { headers });
    
    if (response.data.success && response.data.data.authUrl) {
      console.log('✅ OAuth URL generated successfully');
      
      const authUrl = response.data.data.authUrl;
      const url = new URL(authUrl);
      
      // Validate URL components
      const clientId = url.searchParams.get('client_id');
      const redirectUri = url.searchParams.get('redirect_uri');
      const scope = url.searchParams.get('scope');
      const state = url.searchParams.get('state');
      
      console.log(`   Client ID: ${clientId}`);
      console.log(`   Redirect URI: ${redirectUri}`);
      console.log(`   Scope: ${scope}`);
      console.log(`   State: ${state}`);
      
      // Validate redirect URI
      if (redirectUri === 'https://compliance-manager-frontend.onrender.com/redirecturl') {
        console.log('✅ Redirect URI is correct (production URL)');
      } else {
        console.log('❌ Redirect URI is incorrect');
        return false;
      }
      
      return true;
    } else {
      console.log('❌ OAuth URL generation failed');
      console.log('Response:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Error generating OAuth URL:', error.response?.data || error.message);
    return false;
  }
}

async function testConnectionStatus() {
  console.log('\n3️⃣ Testing Connection Status...');
  try {
    const response = await axios.get(`${API_BASE_URL}/xero/status`, { headers });
    
    if (response.data.success) {
      const status = response.data.data;
      console.log('✅ Connection status retrieved');
      console.log(`   Is Connected: ${status.isConnected}`);
      console.log(`   Has Credentials: ${status.hasCredentials}`);
      console.log(`   Is Token Expired: ${status.isTokenExpired}`);
      console.log(`   Tenants Count: ${status.tenants?.length || 0}`);
      
      if (status.tenants && status.tenants.length > 0) {
        console.log('   Available Tenants:');
        status.tenants.forEach((tenant, index) => {
          console.log(`     ${index + 1}. ${tenant.tenantName || tenant.organisationName} (${tenant.tenantId})`);
        });
      }
      
      return true;
    } else {
      console.log('❌ Failed to get connection status');
      return false;
    }
  } catch (error) {
    console.log('❌ Error getting connection status:', error.response?.data || error.message);
    return false;
  }
}

async function testDataAccess() {
  console.log('\n4️⃣ Testing Data Access...');
  
  // First get connection status to check if we have tenants
  try {
    const statusResponse = await axios.get(`${API_BASE_URL}/xero/status`, { headers });
    const status = statusResponse.data.data;
    
    if (!status.isConnected || !status.tenants || status.tenants.length === 0) {
      console.log('⚠️  No connected tenants available for data testing');
      return true;
    }
    
    const tenantId = status.tenants[0].tenantId;
    console.log(`   Testing with tenant: ${tenantId}`);
    
    // Test different data types
    const dataTypes = ['organization', 'contacts', 'invoices', 'accounts'];
    let successCount = 0;
    
    for (const type of dataTypes) {
      try {
        const response = await axios.get(`${API_BASE_URL}/xero/data?type=${type}&tenantId=${tenantId}`, { headers });
        
        if (response.data.success) {
          console.log(`   ✅ ${type} data loaded successfully`);
          successCount++;
        } else {
          console.log(`   ❌ Failed to load ${type} data`);
        }
      } catch (error) {
        console.log(`   ❌ Error loading ${type} data:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log(`   Data access success rate: ${successCount}/${dataTypes.length}`);
    return successCount > 0;
    
  } catch (error) {
    console.log('❌ Error testing data access:', error.response?.data || error.message);
    return false;
  }
}

async function testFrontendAccess() {
  console.log('\n5️⃣ Testing Frontend Access...');
  try {
    const response = await axios.get(FRONTEND_URL);
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
      return true;
    } else {
      console.log('❌ Frontend returned non-200 status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend is not accessible:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 Xero Integration Comprehensive Test');
  console.log('=====================================\n');
  
  const tests = [
    { name: 'Backend Health', fn: testBackendHealth },
    { name: 'OAuth URL Generation', fn: testXeroOAuthUrl },
    { name: 'Connection Status', fn: testConnectionStatus },
    { name: 'Data Access', fn: testDataAccess },
    { name: 'Frontend Access', fn: testFrontendAccess }
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.log(`❌ Test "${test.name}" failed with error:`, error.message);
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Xero integration is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
  }
  
  console.log('\n🔗 Access URLs:');
  console.log(`   Frontend: ${FRONTEND_URL}`);
  console.log(`   Xero Integration: ${FRONTEND_URL}/integrations/xero`);
  console.log(`   Backend API: ${API_BASE_URL}`);
}

// Run the tests
runAllTests().catch(console.error);



