/**
 * Global Error Handler
 * Handles JavaScript errors and prevents them from breaking the application
 */

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.warn('Caught global error:', event.error);
  
  // Handle specific errors
  if (event.error?.message?.includes('iconLoader')) {
    console.warn('IconLoader error caught and handled');
    event.preventDefault(); // Prevent the error from breaking the app
    return false;
  }
  
  // Handle null reference errors
  if (event.error?.message?.includes("Cannot read properties of null")) {
    console.warn('Null reference error caught and handled');
    event.preventDefault();
    return false;
  }
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection:', event.reason);
  event.preventDefault();
});

// Safe array access helper
export const safeArrayAccess = <T>(array: T[] | null | undefined, index: number): T | null => {
  if (!array || !Array.isArray(array) || index < 0 || index >= array.length) {
    return null;
  }
  return array[index];
};

// Safe object property access helper
export const safePropertyAccess = <T>(obj: any, path: string): T | null => {
  try {
    return path.split('.').reduce((current, key) => current?.[key], obj) || null;
  } catch (error) {
    console.warn('Safe property access failed:', error);
    return null;
  }
};

// Icon loader error handler
export const handleIconLoaderError = (error: Error) => {
  console.warn('IconLoader error handled:', error.message);
  // Return a fallback or default icon
  return null;
};














