// Xero OAuth Helper - Comprehensive OAuth flow management
import { getCurrentDomain, getRenderRedirectUri } from './envChecker';
import toast from 'react-hot-toast';

export interface OAuthState {
  isInProgress: boolean;
  startTime: number | null;
  expectedState: string | null;
  redirectUri: string;
}

export class XeroOAuthHelper {
  private static instance: XeroOAuthHelper;
  private state: OAuthState = {
    isInProgress: false,
    startTime: null,
    expectedState: null,
    redirectUri: ''
  };

  static getInstance(): XeroOAuthHelper {
    if (!XeroOAuthHelper.instance) {
      XeroOAuthHelper.instance = new XeroOAuthHelper();
    }
    return XeroOAuthHelper.instance;
  }

  // Generate a secure state parameter
  generateState(): string {
    const state = Math.random().toString(36).substring(2, 15) + 
                  Math.random().toString(36).substring(2, 15);
    this.state.expectedState = state;
    return state;
  }

  // Get the correct redirect URI for current environment
  getRedirectUri(): string {
    // Always use Render redirect URI (no localhost)
    const redirectUri = getRenderRedirectUri();
    this.state.redirectUri = redirectUri;
    
    console.log('🔧 OAuth Helper - Generated redirect URI:', redirectUri);
    console.log('🔧 OAuth Helper - Current domain:', getCurrentDomain());
    console.log('🔧 OAuth Helper - Environment:', import.meta.env.PROD ? 'Production' : 'Development');
    console.log('🔧 OAuth Helper - Window hostname:', typeof window !== 'undefined' ? window.location.hostname : 'Not available');
    console.log('🔧 OAuth Helper - NO LOCALHOST - Using Render domain only');
    
    return redirectUri;
  }

  // Start OAuth flow
  startOAuth(): { redirectUri: string; state: string } {
    if (this.state.isInProgress) {
      const elapsed = Date.now() - (this.state.startTime || 0);
      if (elapsed < 300000) { // 5 minutes
        toast.error('OAuth flow already in progress. Please wait or refresh the page.');
        throw new Error('OAuth flow already in progress');
      }
    }

    this.state.isInProgress = true;
    this.state.startTime = Date.now();
    
    const redirectUri = this.getRedirectUri();
    const state = this.generateState();
    
    // Store state in localStorage for verification
    localStorage.setItem('xero_oauth_state', state);
    localStorage.setItem('xero_oauth_start_time', this.state.startTime.toString());
    localStorage.setItem('xero_oauth_redirect_uri', redirectUri);
    
    console.log('🚀 OAuth Helper - Starting OAuth flow:', {
      redirectUri,
      state,
      startTime: this.state.startTime
    });
    
    return { redirectUri, state };
  }

  // Verify OAuth callback
  verifyCallback(receivedState: string): boolean {
    const storedState = localStorage.getItem('xero_oauth_state');
    const startTime = localStorage.getItem('xero_oauth_start_time');
    
    console.log('🔍 OAuth Helper - Verifying callback:', {
      receivedState,
      storedState,
      startTime: startTime ? new Date(parseInt(startTime)).toISOString() : 'null'
    });
    
    if (!storedState || !startTime) {
      console.error('❌ OAuth Helper - No stored state found');
      return false;
    }
    
    if (receivedState !== storedState) {
      console.error('❌ OAuth Helper - State mismatch');
      return false;
    }
    
    const elapsed = Date.now() - parseInt(startTime);
    if (elapsed > 300000) { // 5 minutes
      console.error('❌ OAuth Helper - OAuth flow expired');
      return false;
    }
    
    console.log('✅ OAuth Helper - Callback verified successfully');
    return true;
  }

  // Complete OAuth flow
  completeOAuth(): void {
    this.state.isInProgress = false;
    this.state.startTime = null;
    this.state.expectedState = null;
    
    // Clear stored state
    localStorage.removeItem('xero_oauth_state');
    localStorage.removeItem('xero_oauth_start_time');
    localStorage.removeItem('xero_oauth_redirect_uri');
    
    console.log('✅ OAuth Helper - OAuth flow completed');
  }

  // Reset OAuth flow
  resetOAuth(): void {
    this.state.isInProgress = false;
    this.state.startTime = null;
    this.state.expectedState = null;
    
    // Clear stored state
    localStorage.removeItem('xero_oauth_state');
    localStorage.removeItem('xero_oauth_start_time');
    localStorage.removeItem('xero_oauth_redirect_uri');
    
    console.log('🔄 OAuth Helper - OAuth flow reset');
  }

  // Get current OAuth state
  getOAuthState(): OAuthState {
    return { ...this.state };
  }

  // Check if OAuth is in progress
  isOAuthInProgress(): boolean {
    const startTime = localStorage.getItem('xero_oauth_start_time');
    if (!startTime) return false;
    
    const elapsed = Date.now() - parseInt(startTime);
    if (elapsed > 300000) { // 5 minutes
      this.resetOAuth();
      return false;
    }
    
    return this.state.isInProgress;
  }

  // Get redirect URI for display
  getDisplayRedirectUri(): string {
    return this.state.redirectUri || this.getRedirectUri();
  }
}

// Export singleton instance
export const xeroOAuthHelper = XeroOAuthHelper.getInstance();
