const axios = require('axios');

async function updateDatabaseRedirect() {
  console.log('🔧 Direct Database Redirect URI Update\n');
  
  console.log('📋 CURRENT ISSUE:');
  console.log('   Database has wrong redirect URI stored');
  console.log('   Backend is hardcoded but database may still be wrong');
  console.log('   Need to ensure database has correct redirect URI\n');
  
  console.log('🔧 SOLUTION:\n');
  
  console.log('1️⃣ UPDATE FRONTEND SETTINGS (This updates the database):');
  console.log('   a) Go to: http://localhost:3001');
  console.log('   b) Navigate to Xero Settings');
  console.log('   c) Fill in your Xero Client ID and Client Secret');
  console.log('   d) Set Redirect URI to: http://localhost:3001/redirecturl');
  console.log('   e) Click "Save Settings"');
  console.log('   f) This will update the database with correct redirect URI\n');
  
  console.log('2️⃣ VERIFY DATABASE UPDATE:');
  console.log('   - Check backend console for settings being saved');
  console.log('   - Look for "Xero settings saved successfully" message');
  console.log('   - Verify the redirect URI in the response\n');
  
  console.log('3️⃣ ALTERNATIVE: Direct Database Query');
  console.log('   If frontend settings don\'t work, you can run this SQL:');
  console.log('   UPDATE xero_settings SET redirect_uri = \'http://localhost:3001/redirecturl\' WHERE company_id = YOUR_COMPANY_ID;');
  console.log('   (Replace YOUR_COMPANY_ID with your actual company ID)\n');
  
  console.log('4️⃣ TEST THE FIX:');
  console.log('   a) Clear browser cache');
  console.log('   b) Try OAuth flow again');
  console.log('   c) Check backend logs for correct redirect_uri');
  console.log('   d) Should see "Token exchange successful"\n');
  
  console.log('🚨 IMPORTANT NOTES:');
  console.log('   - Backend code is hardcoded to use correct redirect URI');
  console.log('   - Database should also have correct redirect URI for consistency');
  console.log('   - Xero Developer Portal must have same redirect URI');
  console.log('   - All three must match: Backend, Database, Xero Portal\n');
  
  console.log('✅ SUCCESS INDICATORS:');
  console.log('   - Frontend settings save successfully');
  console.log('   - Backend logs show correct redirect_uri');
  console.log('   - No "Invalid redirect_uri" errors');
  console.log('   - OAuth flow completes successfully');
}

updateDatabaseRedirect().catch(console.error);
