// 🚨 GLOBAL EMERGENCY BRAKE - Block all Xero API calls
// This file provides a global emergency brake to stop all Xero-related API calls

const EMERGENCY_BRAKE_ACTIVE = false;

console.log('🚨🚨🚨 EMERGENCY BRAKE FILE LOADED - INITIALIZING GLOBAL BLOCKS 🚨🚨🚨');

// Override fetch to block Xero API calls
const originalFetch = window.fetch;

window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = typeof input === 'string' ? input : input.toString();
  
  console.log('🔍 FETCH INTERCEPTED:', url);
  
  // Block all Xero-related API calls
  if (EMERGENCY_BRAKE_ACTIVE && (
    url.includes('/api/xero') || 
    url.includes('/xero/') ||
    url.includes('xero-plug-play')
  )) {
    console.log('🚨🚨🚨 EMERGENCY BRAKE: Blocking Xero API call to:', url);
    
    // Return a mock response to prevent errors
    return new Response(JSON.stringify({
      success: false,
      message: 'Emergency brake active - Xero operations disabled',
      error: 'EMERGENCY_BRAKE_ACTIVE'
    }), {
      status: 503,
      statusText: 'Service Unavailable - Emergency Brake Active',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  console.log('✅ ALLOWING NON-XERO REQUEST:', url);
  // Allow non-Xero requests to proceed normally
  return originalFetch(input, init);
};

// Override XMLHttpRequest to block Xero API calls
const originalXHROpen = XMLHttpRequest.prototype.open;
const originalXHRSend = XMLHttpRequest.prototype.send;

XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
  const urlString = url.toString();
  
  if (EMERGENCY_BRAKE_ACTIVE && (
    urlString.includes('/api/xero') || 
    urlString.includes('/xero/') ||
    urlString.includes('xero-plug-play')
  )) {
    console.log('🚨🚨🚨 EMERGENCY BRAKE: Blocking Xero XHR call to:', urlString);
    
    // Override send to prevent the request
    this.send = function() {
      // Simulate an error response
      setTimeout(() => {
        if (this.onerror) {
          this.onerror(new ErrorEvent('error', {
            message: 'Emergency brake active - Xero operations disabled'
          }));
        }
      }, 0);
    };
    
    return;
  }
  
  // Allow non-Xero requests to proceed normally
  return originalXHROpen.call(this, method, url, ...args);
};

console.log('🚨🚨🚨 GLOBAL EMERGENCY BRAKE INITIALIZED - ALL XERO API CALLS BLOCKED 🚨🚨🚨');

export { EMERGENCY_BRAKE_ACTIVE };
