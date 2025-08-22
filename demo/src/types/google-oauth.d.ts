// Google OAuth types
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleOAuthConfig) => void;
          renderButton: (element: HTMLElement, options: GoogleButtonConfig) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export interface GoogleOAuthConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

export interface GoogleButtonConfig {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  width?: number;
  type?: 'standard' | 'icon';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
}

export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

export {};
