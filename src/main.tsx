import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/react'
import './index.css'
import App from './App.tsx'

const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_bGl2ZS1qYXZlbGluLTYxLmNsZXJrLmFjY291bnRzLmRldiQ";

function ClerkProviderWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      signInUrl="/login"
      signUpUrl="/login"
    >
      {children}
    </ClerkProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProviderWithRouter>
        <App />
      </ClerkProviderWithRouter>
    </BrowserRouter>
  </StrictMode>,
)
