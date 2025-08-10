const axios = require('axios');

async function debugCallbackIssue() {
  console.log('🔍 Debugging Xero Callback Issue\n');
  
  console.log('📋 Current Status:');
  console.log('✅ OAuth redirect URI is working (no more "Invalid redirect_uri" error)');
  console.log('❌ Callback is failing during token exchange or data processing');
  console.log('❌ "Xero Connection Failed" error is showing\n');
  
  console.log('🔍 Possible Issues:\n');
  
  console.log('1️⃣ BACKEND TOKEN EXCHANGE ISSUE:');
  console.log('   - Backend might be failing to exchange code for tokens');
  console.log('   - Check backend console logs for errors');
  console.log('   - Look for "Token exchange successful" message\n');
  
  console.log('2️⃣ DATABASE STORAGE ISSUE:');
  console.log('   - Tokens might not be saving to database');
  console.log('   - Check for database connection errors');
  console.log('   - Verify Xero settings are properly configured\n');
  
  console.log('3️⃣ FRONTEND PARAMETER ISSUE:');
  console.log('   - Success/error parameters might not be passed correctly');
  console.log('   - Check browser console for parameter values');
  console.log('   - Verify URL parameters in callback\n');
  
  console.log('🔧 DEBUGGING STEPS:\n');
  
  console.log('1️⃣ Check Backend Logs:');
  console.log('   - Look at backend console for error messages');
  console.log('   - Check for "Token exchange successful" or error messages');
  console.log('   - Look for database errors\n');
  
  console.log('2️⃣ Check Browser Console:');
  console.log('   - Open browser DevTools (F12)');
  console.log('   - Go to Console tab');
  console.log('   - Look for error messages or API call failures');
  console.log('   - Check Network tab for failed requests\n');
  
  console.log('3️⃣ Check URL Parameters:');
  console.log('   - Look at the callback URL in browser address bar');
  console.log('   - Should have: success=true&companyId=...&tenants=...');
  console.log('   - Or error parameters if it failed\n');
  
  console.log('4️⃣ Test Backend Health:');
  console.log('   - Check if backend is responding: http://localhost:3333/api/health');
  console.log('   - Verify database connection');
  console.log('   - Check Xero settings in database\n');
  
  console.log('📝 NEXT STEPS:');
  console.log('1. Check backend console logs');
  console.log('2. Check browser console for errors');
  console.log('3. Share any error messages you find');
  console.log('4. We can then fix the specific issue\n');
  
  console.log('🎯 COMMON SOLUTIONS:');
  console.log('- Restart backend server');
  console.log('- Check database connection');
  console.log('- Verify Xero app credentials');
  console.log('- Clear browser cache and try again');
}

debugCallbackIssue().catch(console.error);
