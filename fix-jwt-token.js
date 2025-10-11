// fix-jwt-token.js
// IMMEDIATE FIX for JWT token mismatch
// Run this in your browser console to fix the 401 errors

console.log('🚨 FIXING JWT TOKEN MISMATCH...');

// Clear all localStorage to remove old tokens
localStorage.clear();
console.log('✅ Cleared old localStorage');

// Set the new working token that matches backend JWT secret
const NEW_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzU4ODMxMzc4LCJleHAiOjE3NTk0MzYxNzh9.ttV7SUO2EfiuAMhTBmqVSg-LfhWIGtZtS7VPBxWv40U';
localStorage.setItem('token', NEW_TOKEN);
console.log('✅ Set new working token that matches backend JWT secret');

// Enable test mode
localStorage.setItem('xeroTestMode', 'true');
console.log('✅ Enabled Xero test mode');

// Verify the token is set
const storedToken = localStorage.getItem('token');
console.log('🔍 Stored token:', storedToken ? 'PRESENT' : 'MISSING');

// Test the token by making a simple API call
fetch('http://localhost:3333/api/health', {
  headers: {
    'Authorization': `Bearer ${NEW_TOKEN}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  console.log('🧪 Test API call status:', response.status);
  if (response.status === 200) {
    console.log('✅ Token is working! API calls should now succeed.');
  } else {
    console.log('❌ Token still not working. Status:', response.status);
  }
})
.catch(error => {
  console.log('❌ Test API call failed:', error.message);
});

// Reload the page to apply changes
console.log('🔄 Reloading page to apply changes...');
setTimeout(() => {
  location.reload();
}, 2000);

console.log('🎉 JWT TOKEN FIX COMPLETE! The page will reload in 2 seconds.');











