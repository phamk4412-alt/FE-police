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
        elements: {
          formFieldInput: {
            backgroundColor: "#ffffff",
            color: "#111827",
            borderColor: "#d1d5db",
          },
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

export default ClerkProviderWithRouter;
