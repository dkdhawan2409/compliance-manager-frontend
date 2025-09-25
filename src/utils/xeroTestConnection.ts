// Utility to test Xero connection states for debugging
export const simulateXeroConnection = () => {
  // Simulate connected state in localStorage for testing
  localStorage.setItem('xero_authorized', 'true');
  localStorage.setItem('xero_auth_timestamp', Date.now().toString());
  
  console.log('🧪 Simulated Xero connection - refresh page to see connected state');
  
  // You can also manually trigger a page refresh
  window.location.reload();
};

export const clearXeroConnection = () => {
  // Clear connection state
  localStorage.removeItem('xero_authorized');
  localStorage.removeItem('xero_auth_timestamp');
  localStorage.removeItem('xero_tokens');
  localStorage.removeItem('xero_connected');
  
  console.log('🧪 Cleared Xero connection - refresh page to see disconnected state');
  
  // You can also manually trigger a page refresh
  window.location.reload();
};

// Add to global window for easy testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testXeroConnection = simulateXeroConnection;
  (window as any).clearXeroConnection = clearXeroConnection;
}

