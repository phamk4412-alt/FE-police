import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './assets/styles/global.css'
import App from './App.tsx'
import ClerkProviderWithRouter from './ClerkProviderWithRouter.tsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY environment variable");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ClerkProviderWithRouter publishableKey={clerkPublishableKey}>
        <App />
      </ClerkProviderWithRouter>
    </BrowserRouter>
  </StrictMode>,
)
