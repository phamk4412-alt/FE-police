# FE Police

React + Vite frontend for the police dashboard.

## Authentication

Users sign in with email and password or with Google (no Clerk). `/sign-up` creates an email/password account (`POST /api/auth/register`), `/login` signs in with it (`POST /api/auth/login`); both return the same backend token as Google.

- `src/auth/GoogleSignInButton.tsx` loads Google Identity Services and gets an ID token.
- `src/auth/AuthProvider.tsx` sends it to `POST /api/auth/google`; the backend verifies it, creates the account and returns its own token.
- The token is kept in `localStorage` and sent as `Authorization: Bearer ...` by `src/services/api.ts`.
- The role comes from the backend database. New accounts are `user`; admins change roles on the admin page.

After sign-in, users are routed by role:

| Role | Route |
| --- | --- |
| `admin` | `/#/admin` |
| `police` | `/#/police` |
| `support` | `/#/support` |
| `user` | `/#/user` |


## Environment

For local development, create `.env.local`:

```text
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id.apps.googleusercontent.com
VITE_API_URL=http://localhost:5055
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here
```

For Vercel, set `VITE_GOOGLE_CLIENT_ID` in Project Settings → Environment Variables. It must be the same Client ID as `GOOGLE_CLIENT_ID` on the backend.

## Commands

```powershell
npm ci
npm run dev
npm run build
```

## Project structure

The repo is organized so each kind of code has a predictable home:

- `src/pages` - route-level screens
- `src/components` - reusable UI, layout, and map components
- `src/services` - backend API access
- `src/routes` - app routing and redirect logic
- `src/types` - shared TypeScript types
- `src/utils` - constants, role helpers, and local utilities
- `src/assets` - images, logos, and style assets
- `public` - static files served directly

See `docs/PROJECT_STRUCTURE.md` for the full search guide and naming rules.

## Deploy

This repo is ready for Vercel:

- Framework: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`

## Mobile app (iPhone / Android)

`ios/` and `android/` are Capacitor projects that open the live site inside a native app, with native Google sign-in, camera and location permissions. See `docs/MOBILE_APP.md` for setup and build steps.
