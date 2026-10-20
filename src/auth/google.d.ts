interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdConfiguration {
  callback: (response: GoogleCredentialResponse) => void;
  client_id: string;
  ux_mode?: "popup" | "redirect";
}

interface GoogleButtonConfiguration {
  locale?: string;
  shape?: "rectangular" | "pill" | "circle" | "square";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  theme?: "outline" | "filled_blue" | "filled_black";
  width?: number;
}

interface Window {
  google?: {
    accounts: {
      id: {
        disableAutoSelect: () => void;
        initialize: (config: GoogleIdConfiguration) => void;
        renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
      };
    };
  };
}
