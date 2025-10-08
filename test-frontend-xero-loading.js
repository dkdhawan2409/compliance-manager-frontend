#!/usr/bin/env node

const axios = require('axios');

async function testFrontendXeroLoading() {
  console.log('🧪 Testing frontend Xero data loading...\n');
  
  // First login to get a token
  const loginResponse = await axios.post('http://localhost:3333/api/companies/login', {
    email: 'sds@yopmail.com',
    password: 'password123'
  });
  
  if (!loginResponse.data.success) {
    console.log('❌ Login failed');
    return;
  }
  
  const token = loginResponse.data.data.token;
  console.log('✅ Login successful, testing Xero endpoints...\n');
  
  // Test the same endpoints the frontend would call
  const baseURL = 'http://localhost:3333/api';
  
  try {
    console.log('1️⃣ Testing getConnectionStatus...');
    const statusResponse = await axios.get(`${baseURL}/xero/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Status response:');
    console.log('  - Connected:', statusResponse.data.data.connected);
    console.log('  - Has expired tokens:', statusResponse.data.data.hasExpiredTokens);
    console.log('  - Tenants count:', statusResponse.data.data.tenants?.length || 0);
    console.log('  - Tenant names:', statusResponse.data.data.tenants?.map(t => t.tenantName || t.organisationName) || []);
    
    // Test the frontend mapping
    console.log('\n2️⃣ Testing frontend mapping...');
    const backendData = statusResponse.data.data;
    const mappedData = {
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
    
    console.log('✅ Mapped data:');
    console.log('  - isConnected:', mappedData.isConnected);
    console.log('  - Tenants:', mappedData.tenants.map(t => `${t.name} (${t.id})`));
    
    // Test tenants endpoint
    console.log('\n3️⃣ Testing tenants endpoint...');
    const tenantsResponse = await axios.get(`${baseURL}/xero/tenants`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Tenants response:');
    console.log('  - Tenants count:', tenantsResponse.data.data?.length || 0);
    console.log('  - Tenant names:', tenantsResponse.data.data?.map(t => t.tenantName || t.organisationName) || []);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

testFrontendXeroLoading().catch(console.error);
