// Script to update the frontend token
// Run this in the browser console to update the token

console.log('🔄 Updating frontend token...');

// Remove old token
localStorage.removeItem('token');
localStorage.removeItem('xeroTestMode');

// Set new token
const newToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzU4ODI5ODYxLCJleHAiOjE3NTk0MzQ2NjF9.d-mFZ7b_sN8Taj29Wm9IechwenwXaAigL0X9JylyHDg';
localStorage.setItem('token', newToken);
localStorage.setItem('xeroTestMode', 'true');

console.log('✅ New token set:', newToken);
console.log('🧪 Test mode enabled');
console.log('🔄 Please refresh the page to apply the changes.');

// Also try to update any existing token in the current session
if (window.localStorage) {
  console.log('🔍 Current localStorage contents:');
  console.log('token:', localStorage.getItem('token'));
  console.log('xeroTestMode:', localStorage.getItem('xeroTestMode'));
}









