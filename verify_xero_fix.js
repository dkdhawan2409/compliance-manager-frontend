const axios = require('axios');

async function verifyXeroFix() {
  console.log('🔍 Verifying Xero Redirect URI Fix\n');
  
  console.log('📋 Verification Steps:');
  console.log('\n1️⃣ Check if frontend is running:');
  try {
    const frontendResponse = await axios.get('http://localhost:3001', { timeout: 5000 });
    console.log('✅ Frontend is running on port 3001');
  } catch (error) {
    console.log('❌ Frontend not running on port 3001');
    console.log('   Start with: npm run dev');
  }
  
  console.log('\n2️⃣ Check if backend is running:');
  try {
    const backendResponse = await axios.get('http://localhost:3333/api/health', { timeout: 5000 });
    console.log('✅ Backend is running on port 3333');
  } catch (error) {
    console.log('❌ Backend not running on port 3333');
    console.log('   Start with: npm start (in backend directory)');
  }
  
  console.log('\n3️⃣ Manual Verification Steps:');
  console.log('   a) Open browser to: http://localhost:3001');
  console.log('   b) Go to Xero Settings');
  console.log('   c) Verify Redirect URI is: http://localhost:3001/redirecturl');
  console.log('   d) Try OAuth flow');
  console.log('   e) Check debug panel results');
  
  console.log('\n4️⃣ Expected Success Flow:');
  console.log('   - Click "Connect to Xero"');
  console.log('   - Redirect to Xero login');
  console.log('   - Authorize the app');
  console.log('   - Redirect back to: http://localhost:3001/redirecturl');
  console.log('   - Then to: http://localhost:3001/xero-callback');
  console.log('   - Success message displayed');
  
  console.log('\n🚨 If Still Failing:');
  console.log('   - Double-check Xero Developer Portal settings');
  console.log('   - Wait 5 minutes for Xero changes to propagate');
  console.log('   - Clear browser cache completely');
  console.log('   - Try in incognito/private window');
  console.log('   - Check browser console for errors');
}

verifyXeroFix().catch(console.error);
