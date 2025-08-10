const axios = require('axios');

async function debugXeroStepByStep() {
  console.log('🔍 Step-by-Step Xero Debugging\n');
  
  console.log('📋 Current Status:');
  console.log('✅ Backend is running (health check passed)');
  console.log('✅ OAuth redirect URI is working');
  console.log('❌ Callback is still failing with "Xero Connection Failed"\n');
  
  console.log('🔧 STEP-BY-STEP DEBUGGING:\n');
  
  console.log('1️⃣ CHECK BACKEND LOGS (MOST IMPORTANT):');
  console.log('   - Look at your backend terminal/console');
  console.log('   - Look for these specific messages:');
  console.log('     ✅ "Token exchange successful"');
  console.log('     ✅ "Xero callback completed successfully"');
  console.log('     ❌ "OAuth Callback Error:"');
  console.log('     ❌ "Failed to exchange code for tokens"');
  console.log('     ❌ "Invalid client credentials"');
  console.log('     ❌ Database connection errors\n');
  
  console.log('2️⃣ CHECK BROWSER CONSOLE:');
  console.log('   - Press F12 to open DevTools');
  console.log('   - Go to Console tab');
  console.log('   - Look for:');
  console.log('     ❌ "Backend callback error:"');
  console.log('     ❌ "Failed to complete Xero authorization"');
  console.log('     ❌ Network request failures\n');
  
  console.log('3️⃣ CHECK BROWSER NETWORK TAB:');
  console.log('   - In DevTools, go to Network tab');
  console.log('   - Try the OAuth flow again');
  console.log('   - Look for failed requests to:');
  console.log('     - http://localhost:3333/api/xero/callback');
  console.log('     - Any 4xx or 5xx status codes\n');
  
  console.log('4️⃣ CHECK CALLBACK URL PARAMETERS:');
  console.log('   - Look at browser address bar when error shows');
  console.log('   - Should see: localhost:3001/xero-callback?success=...');
  console.log('   - Check what parameters are present\n');
  
  console.log('5️⃣ TEST XERO SETTINGS:');
  console.log('   - Go to: http://localhost:3001');
  console.log('   - Navigate to Xero Settings');
  console.log('   - Verify Client ID and Client Secret are correct');
  console.log('   - Verify Redirect URI is: http://localhost:3001/redirecturl\n');
  
  console.log('🚨 MOST COMMON ISSUES:\n');
  
  console.log('A) INVALID CLIENT CREDENTIALS:');
  console.log('   - Wrong Client ID or Client Secret');
  console.log('   - Check Xero Developer Portal for correct values');
  console.log('   - Update frontend settings with correct credentials\n');
  
  console.log('B) DATABASE CONNECTION ISSUE:');
  console.log('   - Backend can\'t save tokens to database');
  console.log('   - Check backend logs for database errors');
  console.log('   - Restart backend server\n');
  
  console.log('C) XERO API RATE LIMITING:');
  console.log('   - Too many requests to Xero API');
  console.log('   - Wait a few minutes and try again\n');
  
  console.log('D) FRONTEND-BACKEND COMMUNICATION:');
  console.log('   - Frontend can\'t reach backend callback endpoint');
  console.log('   - Check Network tab for failed requests');
  console.log('   - Verify backend is running on port 3333\n');
  
  console.log('📝 WHAT TO SHARE WITH ME:');
  console.log('1. Backend console logs (any error messages)');
  console.log('2. Browser console logs (any JavaScript errors)');
  console.log('3. Network tab failures (any failed API calls)');
  console.log('4. The exact URL in browser address bar');
  console.log('5. Any specific error messages you see\n');
  
  console.log('🎯 QUICK FIXES TO TRY:');
  console.log('- Restart backend server');
  console.log('- Clear browser cache completely');
  console.log('- Try in incognito/private window');
  console.log('- Verify Xero app credentials in Developer Portal');
  console.log('- Wait 5 minutes and try again (rate limiting)');
}

debugXeroStepByStep().catch(console.error);
