const axios = require('axios');

// Test script to directly check Xero API data
async function testXeroAPI() {
  try {
    console.log('🔍 Testing Xero API directly...');
    
    // You'll need to replace these with actual values from your database
    const accessToken = 'YOUR_ACCESS_TOKEN_HERE';
    const tenantId = '7a513ee2-adb4-44be-b7ae-0f3ee60e7efc'; // Demo Company Global
    
    console.log('📋 Using Tenant ID:', tenantId);
    
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Xero-tenant-id': tenantId,
      'Accept': 'application/json'
    };
    
    // Test different endpoints
    const endpoints = [
      'Invoices',
      'Contacts', 
      'BankTransactions',
      'Accounts',
      'Organisations'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing ${endpoint}...`);
      
      try {
        const url = `https://api.xero.com/api.xro/2.0/${endpoint}`;
        const response = await axios.get(url, { headers });
        
        console.log(`✅ ${endpoint} Response Status:`, response.status);
        console.log(`📊 ${endpoint} Data:`, JSON.stringify(response.data, null, 2));
        
        // Check if data exists
        const dataKey = endpoint.toLowerCase();
        if (response.data[dataKey]) {
          console.log(`📈 ${endpoint} Count:`, response.data[dataKey].length);
        } else {
          console.log(`❌ No ${dataKey} array found in response`);
        }
        
      } catch (error) {
        console.error(`❌ Error testing ${endpoint}:`, error.response?.status, error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions for running this test
console.log(`
🚀 Xero API Direct Test Script

To run this test:

1. Get your access token from the database:
   SELECT access_token FROM xero_settings WHERE company_id = YOUR_COMPANY_ID;

2. Replace 'YOUR_ACCESS_TOKEN_HERE' with the actual token

3. Run: node test_xero_api_direct.js

This will help us see if:
- The access token is valid
- The tenant ID is correct
- The organization actually has data
- There are any API permission issues
`);

// Uncomment the line below to run the test
// testXeroAPI();

