#!/usr/bin/env node

const axios = require('axios');

async function testAuthenticationFlow() {
  console.log('🧪 Testing complete authentication flow...\n');
  
  try {
    // Step 1: Login to get token
    console.log('1️⃣ Logging in to get authentication token...');
    const loginResponse = await axios.post('http://localhost:3333/api/companies/login', {
      email: 'sds@yopmail.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('Company:', loginResponse.data.data.company.companyName);
    
    // Step 2: Test Xero endpoints with token
    console.log('\n2️⃣ Testing Xero endpoints with authentication...');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Test status endpoint
    const statusResponse = await axios.get('http://localhost:3333/api/xero/status', { headers });
    console.log('✅ Xero status response:');
    console.log('  - Connected:', statusResponse.data.data.connected);
    console.log('  - Has expired tokens:', statusResponse.data.data.hasExpiredTokens);
    console.log('  - Tenants count:', statusResponse.data.data.tenants?.length || 0);
    
    if (statusResponse.data.data.tenants?.length > 0) {
      console.log('  - Organization names:', statusResponse.data.data.tenants.map(t => t.tenantName || t.organisationName));
    }
    
    // Test tenants endpoint
    const tenantsResponse = await axios.get('http://localhost:3333/api/xero/tenants', { headers });
    console.log('\n✅ Tenants endpoint response:');
    console.log('  - Tenants count:', tenantsResponse.data.data?.length || 0);
    console.log('  - Organization names:', tenantsResponse.data.data?.map(t => t.tenantName || t.organisationName) || []);
    
    // Step 3: Simulate frontend data mapping
    console.log('\n3️⃣ Simulating frontend data mapping...');
    const backendData = statusResponse.data.data;
    const frontendMappedData = {
      isConnected: backendData.connected || false,
      connectionStatus: backendData.connected ? 'connected' : 'disconnected',
      message: backendData.connected ? 'Xero connected successfully' : 'Not connected to Xero',
      tenants: (backendData.tenants || []).map((tenant) => ({
        id: tenant.tenantId,
        name: tenant.tenantName || tenant.organisationName || 'Unnamed Organization',
        organizationName: tenant.organisationName,
        tenantName: tenant.tenantName,
        tenantId: tenant.tenantId
      })),
      hasCredentials: backendData.hasCredentials || false,
      needsOAuth: backendData.needsOAuth || false,
      tokenRefreshed: backendData.tokenRefreshed || false,
      action: backendData.needsOAuth ? 'connect' : undefined
    };
    
    console.log('✅ Frontend mapped data:');
    console.log('  - isConnected:', frontendMappedData.isConnected);
    console.log('  - connectionStatus:', frontendMappedData.connectionStatus);
    console.log('  - message:', frontendMappedData.message);
    console.log('  - tenants count:', frontendMappedData.tenants.length);
    console.log('  - tenant names:', frontendMappedData.tenants.map(t => t.name));
    console.log('  - hasCredentials:', frontendMappedData.hasCredentials);
    console.log('  - needsOAuth:', frontendMappedData.needsOAuth);
    
    // Step 4: Check if frontend should show organizations
    console.log('\n4️⃣ Frontend display logic:');
    const shouldShowOrganizations = frontendMappedData.isConnected || frontendMappedData.tenants.length > 0;
    console.log('  - Should show organization selector:', shouldShowOrganizations);
    console.log('  - Reason:', shouldShowOrganizations ? 
      (frontendMappedData.isConnected ? 'User is connected to Xero' : 'Tenants are available even if not connected') :
      'No connection and no tenants available'
    );
    
    if (shouldShowOrganizations && frontendMappedData.tenants.length > 0) {
      console.log('\n🎉 SUCCESS: Organizations should be visible in frontend!');
      console.log('Available organizations:');
      frontendMappedData.tenants.forEach((tenant, index) => {
        console.log(`  ${index + 1}. ${tenant.name} (ID: ${tenant.id})`);
      });
    } else {
      console.log('\n❌ Organizations will NOT be visible in frontend');
    }
    
    // Step 5: Recommendations
    console.log('\n5️⃣ Recommendations:');
    if (backendData.hasExpiredTokens) {
      console.log('⚠️  Tokens are expired - user should reconnect to Xero for full functionality');
    }
    if (frontendMappedData.tenants.length > 0) {
      console.log('✅ Organizations are available - frontend should display them');
    }
    if (!frontendMappedData.isConnected) {
      console.log('ℹ️  User is not connected but organizations are available - this is normal');
    }
    
  } catch (error) {
    console.error('❌ Authentication flow test failed:', error.response?.data || error.message);
  }
}

testAuthenticationFlow();
