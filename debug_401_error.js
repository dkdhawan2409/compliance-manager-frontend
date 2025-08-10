console.log('🔧 Debugging 401 Error for Dashboard Data\n');

console.log('🔧 ISSUE IDENTIFIED:');
console.log('   ❌ 401 Unauthorized error on /api/xero/dashboard-data');
console.log('   ❌ Authentication token issue');
console.log('   ❌ User not properly authenticated');
console.log('   ❌ Dashboard data cannot be loaded');
console.log('');

console.log('🛠️ ROOT CAUSE ANALYSIS:');
console.log('   The 401 error indicates one of these issues:');
console.log('   1. User is not logged into the application');
console.log('   2. Authentication token is missing from localStorage');
console.log('   3. Authentication token is expired');
console.log('   4. Token is not being sent in Authorization header');
console.log('   5. Backend auth middleware is rejecting the token');
console.log('');

console.log('🔍 INVESTIGATION STEPS:');
console.log('   1. Check if user is logged in to the application');
console.log('   2. Verify token exists in localStorage');
console.log('   3. Check if token is being sent in requests');
console.log('   4. Verify backend auth middleware logs');
console.log('   5. Test authentication flow');
console.log('');

console.log('🎯 POSSIBLE SOLUTIONS:');
console.log('   ✅ Solution 1: User needs to log in to the application first');
console.log('   ✅ Solution 2: Clear localStorage and re-authenticate');
console.log('   ✅ Solution 3: Check token expiration and refresh');
console.log('   ✅ Solution 4: Verify backend authentication middleware');
console.log('   ✅ Solution 5: Check if user has proper permissions');
console.log('');

console.log('🔧 DEBUGGING CHECKLIST:');
console.log('   1. Browser Console Check:');
console.log('      - Open browser DevTools (F12)');
console.log('      - Check Console tab for authentication logs');
console.log('      - Look for "🔐 Xero API Request" logs');
console.log('      - Check if "hasToken: true" is shown');
console.log('');
console.log('   2. LocalStorage Check:');
console.log('      - Open browser DevTools (F12)');
console.log('      - Go to Application tab > Local Storage');
console.log('      - Check if "token" key exists');
console.log('      - Verify token value is not null/empty');
console.log('');
console.log('   3. Network Tab Check:');
console.log('      - Open browser DevTools (F12)');
console.log('      - Go to Network tab');
console.log('      - Make the dashboard request');
console.log('      - Check if Authorization header is present');
console.log('      - Verify the request URL and headers');
console.log('');
console.log('   4. Backend Logs Check:');
console.log('      - Check backend console for auth middleware logs');
console.log('      - Look for "🔍 DEBUG: authMiddleware called"');
console.log('      - Check if token is being received');
console.log('      - Verify company lookup is successful');
console.log('');

console.log('🚀 IMMEDIATE ACTIONS:');
console.log('   1. Ensure user is logged into the application');
console.log('   2. Check browser console for authentication logs');
console.log('   3. Verify localStorage contains valid token');
console.log('   4. Test with a fresh login if needed');
console.log('   5. Check backend logs for authentication details');
console.log('');

console.log('📊 EXPECTED BEHAVIOR:');
console.log('   ✅ User must be logged in to access Xero dashboard');
console.log('   ✅ Token must be present in localStorage');
console.log('   ✅ Authorization header must be sent with requests');
console.log('   ✅ Backend must successfully validate the token');
console.log('   ✅ Company must be found in database');
console.log('');

console.log('🔧 DEBUG INFORMATION:');
console.log('   - Check browser console for detailed logs');
console.log('   - Verify authentication flow is working');
console.log('   - Test with different user accounts');
console.log('   - Check backend authentication middleware');
console.log('   - Validate token format and expiration');
console.log('');

console.log('🚀 401 ERROR DEBUGGING READY!');
console.log('   Follow the debugging checklist above');
console.log('   Check authentication status first');
console.log('   Verify token is being sent properly');
console.log('   Test with fresh login if needed');
