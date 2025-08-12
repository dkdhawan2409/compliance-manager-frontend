// Test script to verify OpenAI API endpoints
const axios = require('axios');

// Use environment variable for API URL or fallback to production URL
const API_BASE_URL = process.env.API_BASE_URL || 'https://compliance-manager-backend.onrender.com/api';

// Test data
const testSettings = {
  apiKey: 'sk-test-key-for-testing',
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7
};

// You'll need to get a valid token by logging in first
// For testing purposes, you can manually set a token here
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-jwt-token-here';

async function testOpenAIEndpoints() {
  console.log('🧪 Testing OpenAI API endpoints...\n');

  // Set up axios with auth header
  const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  try {
    // Test 1: Get settings (should return 404 if no settings exist)
    console.log('1️⃣ Testing GET /api/openai-admin/settings');
    try {
      const getResponse = await apiClient.get('/openai-admin/settings');
      console.log('✅ GET settings successful:', getResponse.data);
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️  No settings found (expected for first run)');
      } else if (error.response?.status === 401) {
        console.log('🔐 Authentication required - please set AUTH_TOKEN environment variable');
      } else {
        console.log('❌ GET settings failed:', error.response?.data || error.message);
      }
    }

    // Test 2: Save settings
    console.log('\n2️⃣ Testing POST /api/openai-admin/settings');
    try {
      const saveResponse = await apiClient.post('/openai-admin/settings', testSettings);
      console.log('✅ Save settings successful:', saveResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required - please set AUTH_TOKEN environment variable');
      } else {
        console.log('❌ Save settings failed:', error.response?.data || error.message);
      }
    }

    // Test 3: Test API key (try different endpoint paths)
    console.log('\n3️⃣ Testing POST /api/openai-admin/test-key');
    const testKeyEndpoints = [
      '/openai-admin/test-key',
      '/openai-admin/test-api-key',
      '/openai/test-key',
      '/openai/test-api-key'
    ];

    for (const endpoint of testKeyEndpoints) {
      try {
        console.log(`   Trying endpoint: ${endpoint}`);
        const testResponse = await apiClient.post(endpoint, { 
          apiKey: testSettings.apiKey 
        });
        console.log(`✅ Test API key successful (${endpoint}):`, testResponse.data);
        break;
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`   ❌ Endpoint not found: ${endpoint}`);
        } else if (error.response?.status === 401) {
          console.log(`   🔐 Authentication required for: ${endpoint}`);
          break;
        } else {
          console.log(`   ❌ Failed for ${endpoint}:`, error.response?.data || error.message);
        }
      }
    }

    // Test 4: Get settings again (should now return the saved settings)
    console.log('\n4️⃣ Testing GET /api/openai-admin/settings (after save)');
    try {
      const getResponse2 = await apiClient.get('/openai-admin/settings');
      console.log('✅ GET settings successful:', getResponse2.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required - please set AUTH_TOKEN environment variable');
      } else {
        console.log('❌ GET settings failed:', error.response?.data || error.message);
      }
    }

    // Test 5: Chat completion (this one works without auth)
    console.log('\n5️⃣ Testing POST /api/openai/chat');
    try {
      const chatResponse = await axios.post(`${API_BASE_URL}/openai/chat`, {
        prompt: 'Hello, this is a test message',
        model: 'gpt-3.5-turbo',
        maxTokens: 100,
        temperature: 0.7
      });
      console.log('✅ Chat completion successful:', chatResponse.data);
    } catch (error) {
      console.log('❌ Chat completion failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Instructions for running with authentication
console.log('📝 Instructions:');
console.log('1. Login to the application and get your JWT token');
console.log('2. Set the AUTH_TOKEN environment variable:');
console.log('   export AUTH_TOKEN="your-jwt-token-here"');
console.log('3. Run this script again\n');

// Run the tests
testOpenAIEndpoints();
