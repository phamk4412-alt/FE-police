import { ClerkProvider } from "@clerk/react";
import { useNavigate } from "react-router-dom";
import type { ReactNode } from "react";

type ClerkProviderWithRouterProps = {
  children: ReactNode;
  publishableKey: string;
};

function ClerkProviderWithRouter({ children, publishableKey }: ClerkProviderWithRouterProps) {
  const navigate = useNavigate();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/login"
      signUpUrl="/sign-up"
      appearance={{
        variables: {
          colorPrimary: "#ff4655",
          colorBackground: "#111c26",
          colorInputBackground: "#08111a",
          colorInputText: "#ece8e1",
          colorText: "#ece8e1",
          colorTextSecondary: "#a8b2bd",
          borderRadius: "8px",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        elements: {
          cardBox: {
            boxShadow: "none",
          },
          card: {
            backgroundColor: "transparent",
            border: "0",
            boxShadow: "none",
            padding: "0",
          },
          headerTitle: {
            display: "none",
          },
          headerSubtitle: {
            display: "none",
          },
          socialButtonsBlockButton: {
            backgroundColor: "#182633",
            borderColor: "#2a3a49",
            color: "#ece8e1",
            fontWeight: "800",
          },
          dividerLine: {
            backgroundColor: "#2a3a49",
          },
          dividerText: {
            color: "#a8b2bd",
          },
          formFieldLabel: {
            color: "#ece8e1",
            fontWeight: "800",
          },
          formFieldInput: {
            backgroundColor: "#08111a",
            color: "#ece8e1",
            borderColor: "#2a3a49",
            boxShadow: "none",
          },
          formButtonPrimary: {
            backgroundColor: "#ff4655",
            color: "#ffffff",
            fontWeight: "900",
            boxShadow: "0 14px 30px rgba(255, 70, 85, 0.22)",
          },
          footer: {
            display: "none",
          },
          footerAction: {
            display: "none",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export default ClerkProviderWithRouter;
