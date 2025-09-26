// fix-token-now.js
// IMMEDIATE FIX for "Invalid token" error
// Run this in your browser console to fix the token issue

console.log('🚨 FIXING TOKEN ISSUE...');

// Clear all localStorage to remove old tokens
localStorage.clear();
console.log('✅ Cleared old localStorage');

// Set the new working token
const NEW_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzU4ODI5ODYxLCJleHAiOjE3NTk0MzQ2NjF9.d-mFZ7b_sN8Taj29Wm9IechwenwXaAigL0X9JylyHDg';
localStorage.setItem('token', NEW_TOKEN);
console.log('✅ Set new working token');

// Enable test mode
localStorage.setItem('xeroTestMode', 'true');
console.log('✅ Enabled Xero test mode');

// Verify the token is set
const storedToken = localStorage.getItem('token');
console.log('🔍 Stored token:', storedToken ? 'PRESENT' : 'MISSING');

// Reload the page to apply changes
console.log('🔄 Reloading page to apply changes...');
setTimeout(() => {
  location.reload();
}, 1000);

console.log('🎉 TOKEN FIX COMPLETE! The page will reload in 1 second.');

