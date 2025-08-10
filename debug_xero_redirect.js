const axios = require('axios');

async function debugXeroRedirect() {
  console.log('🔍 Debugging Xero Redirect URI Mismatch\n');
  
  // Step 1: Check what's currently stored in the database
  console.log('1️⃣ Checking current Xero settings in database...');
  try {
    const response = await axios.get('http://localhost:3333/api/xero/settings', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE' // Replace with actual token
      }
    });
    console.log('✅ Database settings:', response.data);
  } catch (error) {
    console.log('❌ Could not fetch settings:', error.response?.data || error.message);
  }
  
  console.log('\n2️⃣ Expected redirect URIs:');
  console.log('   Frontend expects: http://localhost:3001/redirecturl');
  console.log('   Backend should use: http://localhost:3001/redirecturl');
  console.log('   Xero app should have: http://localhost:3001/redirecturl');
  
  console.log('\n3️⃣ Steps to fix:');
  console.log('   a) Update Xero Developer Portal:');
  console.log('      - Go to https://developer.xero.com/app/manage');
  console.log('      - Find your app');
  console.log('      - Set Redirect URI to: http://localhost:3001/redirecturl');
  console.log('      - Save changes');
  
  console.log('\n   b) Update database settings:');
  console.log('      - Go to your frontend app');
  console.log('      - Navigate to Xero Settings');
  console.log('      - Set Redirect URI to: http://localhost:3001/redirecturl');
  console.log('      - Save settings');
  
  console.log('\n   c) Verify the flow:');
  console.log('      - Clear browser cache');
  console.log('      - Try OAuth flow again');
}

debugXeroRedirect().catch(console.error);
