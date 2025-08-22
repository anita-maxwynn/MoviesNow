// Google OAuth configuration
// TODO: Replace with your actual Google OAuth Client ID
// To get this:
// 1. Go to https://console.cloud.google.com/
// 2. Create a new project or select existing one
// 3. Enable Google+ API
// 4. Go to Credentials and create OAuth 2.0 Client ID
// 5. Add your domain (e.g., http://localhost:5173) to authorized origins
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// For development/testing, you can temporarily use this format:
// export const GOOGLE_CLIENT_ID = "1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com";
export const GOOGLE_OAUTH_CONFIG = {
  client_id: GOOGLE_CLIENT_ID,
  callback: handleGoogleLoginResponse,
  auto_select: false,
  cancel_on_tap_outside: true,
};

// Google OAuth response handler
export function handleGoogleLoginResponse(response: any) {
  console.log('Google OAuth response:', response);
}

// Initialize Google OAuth
export function initializeGoogleOAuth() {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.initialize(GOOGLE_OAUTH_CONFIG);
  }
}

// Render Google Sign-In button
export function renderGoogleSignInButton(element: HTMLElement, callback: (response: any) => void) {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: callback,
    });
    
    window.google.accounts.id.renderButton(element, {
      theme: 'outline',
      size: 'large',
      width: 300,
    });
  }
}

// Prompt for Google One Tap
export function promptGoogleOneTap(callback: (response: any) => void) {
  if (typeof window !== 'undefined' && window.google) {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: callback,
    });
    
    window.google.accounts.id.prompt();
  }
}
