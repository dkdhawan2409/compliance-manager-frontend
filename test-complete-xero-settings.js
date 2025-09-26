#!/usr/bin/env node

/**
 * Complete Xero Settings Check
 * Tests all aspects of Xero configuration and settings
 */

const https = require('https');
const http = require('http');

console.log('🔍 Complete Xero Settings Check');
console.log('================================\n');

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

async function createTestToken() {
  console.log('🔑 Using known working token...');
  
  // Use the token that we know works from our manual test
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiaWF0IjoxNzU4ODI3MzAyLCJleHAiOjE3NTk0MzIxMDJ9.vHbCeDNae0PWnDfXE3PAhU4SYhzWHtbe6A36CfQmssg';
  console.log('✅ Using known working token');
  return token;
}

async function testBackendHealth() {
  console.log('\n1. Testing Backend Health...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/health`);
    if (response.status === 200) {
      console.log('✅ Backend is running');
      console.log('📊 Response:', response.data);
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

async function testEnvironmentVariables() {
  console.log('\n2. Testing Environment Variables...');
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('cd /Users/harbor/Desktop/compliance-management-system/backend && node -e "require(\'dotenv\').config(); console.log(\'XERO_CLIENT_ID:\', process.env.XERO_CLIENT_ID ? \'present\' : \'missing\'); console.log(\'XERO_CLIENT_SECRET:\', process.env.XERO_CLIENT_SECRET ? \'present\' : \'missing\'); console.log(\'XERO_REDIRECT_URI:\', process.env.XERO_REDIRECT_URI); console.log(\'JWT_SECRET:\', process.env.JWT_SECRET ? \'present\' : \'missing\');"');
    
    console.log('📊 Environment Variables:');
    console.log(stdout);
    
    if (stdout.includes('XERO_CLIENT_ID: present') && 
        stdout.includes('XERO_CLIENT_SECRET: present') && 
        stdout.includes('JWT_SECRET: present')) {
      console.log('✅ All required environment variables are present');
      return true;
    } else {
      console.log('❌ Some environment variables are missing');
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to check environment variables:', error.message);
    return false;
  }
}

async function testXeroSettings(token) {
  console.log('\n3. Testing Xero Settings...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/xero/settings`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Settings Response Status:', response.status);
    console.log('📊 Settings Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      const settings = response.data.data;
      console.log('✅ Xero settings retrieved successfully');
      
      // Check specific settings
      const checks = {
        hasCredentials: settings.hasCredentials,
        hasTokens: settings.hasTokens,
        hasOAuthSettings: settings.hasOAuthSettings,
        clientId: settings.clientId,
        connectionStatus: settings.connectionStatus,
        isConnected: settings.isConnected
      };
      
      console.log('\n📋 Settings Analysis:');
      Object.entries(checks).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
      
      return true;
    } else {
      console.log('❌ Failed to get Xero settings');
      return false;
    }
  } catch (error) {
    console.log('❌ Error getting Xero settings:', error.message);
    return false;
  }
}

async function testConnectionStatus(token) {
  console.log('\n4. Testing Connection Status...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/xero/status`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Status Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success) {
      const status = response.data.data;
      console.log('✅ Connection status retrieved successfully');
      
      console.log('\n📋 Connection Analysis:');
      console.log(`   isConnected: ${status.isConnected}`);
      console.log(`   hasCredentials: ${status.hasCredentials}`);
      console.log(`   isTokenExpired: ${status.isTokenExpired}`);
      console.log(`   tenants: ${status.tenants?.length || 0}`);
      console.log(`   expiresAt: ${status.expiresAt}`);
      
      return true;
    } else {
      console.log('❌ Failed to get connection status');
      return false;
    }
  } catch (error) {
    console.log('❌ Error getting connection status:', error.message);
    return false;
  }
}

async function testOAuthUrlGeneration(token) {
  console.log('\n5. Testing OAuth URL Generation...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/xero/connect`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 OAuth Response Status:', response.status);
    console.log('📊 OAuth Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.success && response.data.data.authUrl) {
      console.log('✅ OAuth URL generated successfully');
      
      const authUrl = response.data.data.authUrl;
      const url = new URL(authUrl);
      
      console.log('\n📋 OAuth URL Analysis:');
      console.log(`   Base URL: ${url.origin}${url.pathname}`);
      console.log(`   Client ID: ${url.searchParams.get('client_id')}`);
      console.log(`   Redirect URI: ${url.searchParams.get('redirect_uri')}`);
      console.log(`   Scope: ${url.searchParams.get('scope')}`);
      console.log(`   State: ${url.searchParams.get('state')}`);
      
      // Validate OAuth URL components
      const clientId = url.searchParams.get('client_id');
      const redirectUri = url.searchParams.get('redirect_uri');
      const scope = url.searchParams.get('scope');
      
      const validations = {
        clientId: clientId === '8113118D16A84C8199677E98E3D8A446',
        redirectUri: redirectUri === 'https://compliance-manager-frontend.onrender.com/redirecturl',
        scope: scope && scope.includes('offline_access') && scope.includes('accounting.transactions'),
        state: url.searchParams.get('state') === '7'
      };
      
      console.log('\n🔍 OAuth URL Validations:');
      Object.entries(validations).forEach(([key, value]) => {
        console.log(`   ${key}: ${value ? '✅' : '❌'}`);
      });
      
      return Object.values(validations).every(v => v);
    } else {
      console.log('❌ OAuth URL generation failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Error generating OAuth URL:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('\n6. Testing Database Connection...');
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const { stdout } = await execAsync('cd /Users/harbor/Desktop/compliance-management-system/backend && node -e "const db = require(\'./src/config/database\'); db.query(\'SELECT COUNT(*) FROM xero_settings\').then(result => { console.log(\'Xero settings count:\', result.rows[0].count); process.exit(0); }).catch(err => { console.log(\'DB Error:\', err.message); process.exit(1); });"');
    
    console.log('📊 Database Response:', stdout.trim());
    
    if (stdout.includes('Xero settings count:')) {
      console.log('✅ Database connection successful');
      return true;
    } else {
      console.log('❌ Database connection failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Database test error:', error.message);
    return false;
  }
}

async function testFrontendIntegration() {
  console.log('\n7. Testing Frontend Integration...');
  try {
    const response = await makeRequest(`${FRONTEND_URL}`);
    if (response.status === 200) {
      console.log('✅ Frontend is accessible');
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

async function runCompleteCheck() {
  console.log('🚀 Starting Complete Xero Settings Check...\n');
  
  // Create test token
  const token = await createTestToken();
  if (!token) {
    console.log('❌ Cannot proceed without test token');
    return;
  }
  
  const results = {
    backend: await testBackendHealth(),
    envVars: await testEnvironmentVariables(),
    settings: await testXeroSettings(token),
    connection: await testConnectionStatus(token),
    oauth: await testOAuthUrlGeneration(token),
    database: await testDatabaseConnection(),
    frontend: await testFrontendIntegration()
  };
  
  console.log('\n📊 Complete Check Results:');
  console.log('==========================');
  console.log(`Backend Health: ${results.backend ? '✅' : '❌'}`);
  console.log(`Environment Variables: ${results.envVars ? '✅' : '❌'}`);
  console.log(`Xero Settings: ${results.settings ? '✅' : '❌'}`);
  console.log(`Connection Status: ${results.connection ? '✅' : '❌'}`);
  console.log(`OAuth URL Generation: ${results.oauth ? '✅' : '❌'}`);
  console.log(`Database Connection: ${results.database ? '✅' : '❌'}`);
  console.log(`Frontend Integration: ${results.frontend ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(v => v);
  
  console.log('\n🎯 Overall Status:');
  if (allPassed) {
    console.log('✅ All Xero settings and configuration are working correctly!');
    console.log('✅ The integration is ready for use');
  } else {
    console.log('❌ Some issues found in Xero configuration');
    console.log('🔧 Please check the failed components above');
  }
  
  console.log('\n💡 Next Steps:');
  if (allPassed) {
    console.log('1. Enable test mode in the frontend');
    console.log('2. Click "Connect to Xero" to start OAuth flow');
    console.log('3. Complete authorization with Xero');
    console.log('4. Access your Xero data');
  } else {
    console.log('1. Fix the failed components');
    console.log('2. Re-run this check');
    console.log('3. Test the integration again');
  }
}

// Run the complete check
runCompleteCheck().catch(console.error);
