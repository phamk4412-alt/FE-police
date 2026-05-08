# FE Police

React + Vite frontend for the police dashboard.

## Authentication

The app uses Clerk React:

- `@clerk/react`
- `ClerkProvider` in `src/main.tsx`
- Clerk sign-in UI in `src/pages/Login.tsx`
- Role-based redirects through Clerk user metadata

After sign-in, users are routed by role:

| Role | Route |
| --- | --- |
| `admin` | `/#/admin` |
| `police` | `/#/police` |
| `support` | `/#/support` |
| `user` | `/#/user` |

If a new Clerk user has no role yet, the app sends them to `/#/select-role` once.

## Environment

For local development, create `.env.local`:

```text
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
VITE_API_URL=http://localhost:5055
VITE_MAPBOX_TOKEN=your_mapbox_public_token_here
```

For Vercel, `vercel.json` sets the Clerk publishable key used by this project.

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

See `PROJECT_STRUCTURE.md` for the full search guide and naming rules.

## Deploy

This repo is ready for Vercel:

- Framework: Vite
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
