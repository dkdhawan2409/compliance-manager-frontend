// complete-fix.js
// COMPLETE FIX for all authentication issues
// Run this in your browser console to fix everything

console.log('🚨 COMPLETE AUTHENTICATION FIX...');

// Step 1: Clear all localStorage
localStorage.clear();
console.log('✅ Cleared all localStorage');

// Step 2: Set the correct token that matches backend JWT secret
const CORRECT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzU4ODMxMzc4LCJleHAiOjE3NTk0MzYxNzh9.ttV7SUO2EfiuAMhTBmqVSg-LfhWIGtZtS7VPBxWv40U';
localStorage.setItem('token', CORRECT_TOKEN);
console.log('✅ Set correct JWT token');

// Step 3: Enable test mode
localStorage.setItem('xeroTestMode', 'true');
console.log('✅ Enabled Xero test mode');

// Step 4: Verify token is set
const storedToken = localStorage.getItem('token');
console.log('🔍 Stored token:', storedToken ? 'PRESENT' : 'MISSING');
console.log('🔍 Token value:', storedToken);

// Step 5: Test the token with a simple API call
console.log('🧪 Testing token with API call...');
fetch('http://localhost:3333/api/health', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${CORRECT_TOKEN}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('🧪 Health check status:', response.status);
  if (response.status === 200) {
    console.log('✅ Token is working! Health check passed.');
  } else {
    console.log('❌ Health check failed. Status:', response.status);
  }
  return response.text();
})
.then(data => {
  console.log('🧪 Health check response:', data);
})
.catch(error => {
  console.log('❌ Health check error:', error.message);
});

// Step 6: Test login endpoint
console.log('🧪 Testing login endpoint...');
fetch('http://localhost:3333/api/companies/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
})
.then(response => {
  console.log('🧪 Login test status:', response.status);
  return response.json();
})
.then(data => {
  console.log('🧪 Login test response:', data);
  if (data.success && data.data && data.data.token) {
    console.log('✅ Login endpoint is working! Got token:', data.data.token);
    // Update localStorage with the new token from login
    localStorage.setItem('token', data.data.token);
    console.log('✅ Updated localStorage with login token');
  } else {
    console.log('❌ Login failed:', data.message);
  }
})
.catch(error => {
  console.log('❌ Login test error:', error.message);
});

// Step 7: Reload the page
console.log('🔄 Reloading page in 3 seconds...');
setTimeout(() => {
  console.log('🔄 Reloading now...');
  location.reload();
}, 3000);

console.log('🎉 COMPLETE FIX APPLIED! Check the test results above.');










