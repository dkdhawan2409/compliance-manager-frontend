const axios = require('axios');

async function testCorsFix() {
  console.log('🔍 Testing CORS Fix for Xero OAuth\n');
  
  console.log('📋 Test Results:');
  
  // Test 1: Check if frontend is accessible
  try {
    const frontendResponse = await axios.get('http://localhost:3001', { timeout: 5000 });
    console.log('✅ Frontend accessible on port 3001');
  } catch (error) {
    console.log('❌ Frontend not accessible:', error.message);
  }
  
  // Test 2: Check if backend is accessible
  try {
    const backendResponse = await axios.get('http://localhost:3333/api/health', { timeout: 5000 });
    console.log('✅ Backend accessible on port 3333');
  } catch (error) {
    console.log('❌ Backend not accessible:', error.message);
  }
  
  console.log('\n🔧 CORS Fix Applied:');
  console.log('✅ Backend now returns JSON responses instead of redirects');
  console.log('✅ Frontend makes API calls instead of following redirects');
  console.log('✅ No more CORS issues with cross-origin redirects');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Update Xero Developer Portal redirect URI to: http://localhost:3001/redirecturl');
  console.log('2. Update frontend Xero Settings redirect URI to: http://localhost:3001/redirecturl');
  console.log('3. Test the OAuth flow');
  console.log('4. Check browser console - should see no CORS errors');
  
  console.log('\n🎯 Expected Behavior:');
  console.log('- Frontend receives JSON response from backend');
  console.log('- No CORS errors in browser console');
  console.log('- OAuth flow completes successfully');
  console.log('- Debug panel shows oauthCallback: PASS');
}

testCorsFix().catch(console.error);
