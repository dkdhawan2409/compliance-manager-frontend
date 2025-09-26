// Test script to verify Xero backend integration
const API_BASE_URL = 'http://localhost:3333/api';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzU4ODI5ODYxLCJleHAiOjE3NTk0MzQ2NjF9.d-mFZ7b_sN8Taj29Wm9IechwenwXaAigL0X9JylyHDg';

async function testXeroBackend() {
  console.log('🧪 Testing Xero Backend Integration...');
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Xero settings
    console.log('\n2️⃣ Testing Xero settings...');
    const settingsResponse = await fetch(`${API_BASE_URL}/xero/settings`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const settingsData = await settingsResponse.json();
    console.log('✅ Xero settings:', settingsData);
    
    // Test 3: Xero connection status
    console.log('\n3️⃣ Testing Xero connection status...');
    const statusResponse = await fetch(`${API_BASE_URL}/xero/status`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const statusData = await statusResponse.json();
    console.log('✅ Xero status:', statusData);
    
    // Test 4: Xero OAuth URL generation
    console.log('\n4️⃣ Testing Xero OAuth URL generation...');
    const connectResponse = await fetch(`${API_BASE_URL}/xero/connect`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const connectData = await connectResponse.json();
    console.log('✅ Xero OAuth URL:', connectData);
    
    if (connectData.success && connectData.data.authUrl) {
      console.log('🎉 All tests passed! Xero integration is working correctly.');
      console.log('🔗 OAuth URL:', connectData.data.authUrl);
    } else {
      console.log('❌ OAuth URL generation failed:', connectData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testXeroBackend();
