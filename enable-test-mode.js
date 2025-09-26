// Script to enable test mode in the browser
// Run this in the browser console to enable Xero test mode

console.log('🧪 Enabling Xero test mode...');
localStorage.setItem('xeroTestMode', 'true');
console.log('✅ Xero test mode enabled!');
console.log('🔄 Please refresh the page to apply the changes.');

// Also set the token directly for immediate use
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzU4ODI5ODYxLCJleHAiOjE3NTk0MzQ2NjF9.d-mFZ7b_sN8Taj29Wm9IechwenwXaAigL0X9JylyHDg');
console.log('🔑 Test token set in localStorage');
console.log('🎉 Ready to test Xero integration!');
