const axios = require('axios');

async function checkRedirectUri() {
  console.log('🔍 Checking Current Redirect URI Configuration\n');
  
  console.log('📋 What Should Be Configured:');
  console.log('✅ Xero Developer Portal: http://localhost:3001/redirecturl');
  console.log('✅ Database Settings: http://localhost:3001/redirecturl');
  console.log('✅ Frontend Settings: http://localhost:3001/redirecturl');
  console.log('❌ Backend is sending: http://localhost:3001/xero-callback (WRONG!)\n');
  
  console.log('🚨 PROBLEM IDENTIFIED:');
  console.log('   Your database has the wrong redirect URI stored!');
  console.log('   Backend is using: xeroSettings.redirect_uri from database');
  console.log('   But database has: http://localhost:3001/xero-callback');
  console.log('   Should be: http://localhost:3001/redirecturl\n');
  
  console.log('🔧 FIX REQUIRED:\n');
  
  console.log('1️⃣ UPDATE FRONTEND SETTINGS (This updates the database):');
  console.log('   a) Go to: http://localhost:3001');
  console.log('   b) Navigate to Xero Settings');
  console.log('   c) Set Redirect URI to: http://localhost:3001/redirecturl');
  console.log('   d) Click "Save Settings"');
  console.log('   e) This will update the database with correct redirect URI\n');
  
  console.log('2️⃣ UPDATE XERO DEVELOPER PORTAL:');
  console.log('   a) Go to: https://developer.xero.com/app/manage');
  console.log('   b) Find your app');
  console.log('   c) Set Redirect URI to: http://localhost:3001/redirecturl');
  console.log('   d) Save changes\n');
  
  console.log('3️⃣ VERIFY THE FIX:');
  console.log('   a) Clear browser cache');
  console.log('   b) Try OAuth flow again');
  console.log('   c) Backend should now send: http://localhost:3001/redirecturl');
  console.log('   d) Xero should accept the redirect URI\n');
  
  console.log('📝 IMPORTANT NOTES:');
  console.log('   - The backend code is CORRECT');
  console.log('   - The issue is in the DATABASE settings');
  console.log('   - Updating frontend settings will fix the database');
  console.log('   - Both Xero Developer Portal and database must match');
  
  console.log('\n✅ EXPECTED RESULT:');
  console.log('   - No more "Invalid redirect_uri" errors');
  console.log('   - OAuth flow works correctly');
  console.log('   - Backend sends correct redirect URI to Xero');
}

checkRedirectUri().catch(console.error);
