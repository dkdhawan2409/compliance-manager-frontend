// enable-xero-test-mode.js
// Run this in your browser console to enable Xero test mode

console.log('🚀 Enabling Xero test mode...');

// Set xeroTestMode to true
localStorage.setItem('xeroTestMode', 'true');
console.log('✅ Xero test mode enabled!');

// Set the working token that matches the backend
localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiaWF0IjoxNzU4ODI4MjgyLCJleHAiOjE3NTk0MzMwODJ9.fI64px4lZkkHU3D9LXnibbKGypKaZseFzBDu4LxzYfc');
console.log('🔑 Working token set in localStorage');

console.log('🎉 Ready to test Xero integration!');
console.log('🔄 Please refresh the page to apply the changes.');

// Auto-refresh after 2 seconds
setTimeout(() => {
  console.log('🔄 Auto-refreshing page...');
  location.reload();
}, 2000);












