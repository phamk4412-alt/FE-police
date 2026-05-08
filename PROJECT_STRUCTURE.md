# Project structure

This project keeps files grouped by feature responsibility so they are easy to find during development.

```text
FE-police/
├─ public/
│  └─ maps/                  Static map data served as-is
├─ src/
│  ├─ assets/
│  │  ├─ images/             Image assets used by screens and components
│  │  ├─ logos/              Brand, hospital, police station, and partner logos
│  │  └─ styles/             Shared style-only assets, if needed later
│  ├─ components/
│  │  ├─ common/             Reusable UI controls
│  │  ├─ layout/             Header, sidebar, and dashboard shells
│  │  └─ map/                Mapbox map UI and map-related presentation
│  ├─ pages/                 Route-level screens
│  ├─ routes/                Route definitions and redirect logic
│  ├─ services/              API clients grouped by domain
│  ├─ types/                 Shared TypeScript types
│  └─ utils/                 Small pure helpers and local storage utilities
├─ .env.example              Example local environment variables
├─ vercel.json               Vercel build and environment configuration
└─ vite.config.ts            Vite configuration
```

## Search guide

- Need to change a screen: start in `src/pages`.
- Need to change a shared button, input, layout, or map component: start in `src/components`.
- Need to change backend calls: start in `src/services`.
- Need to change role handling or constants: start in `src/utils`.
- Need to change route access or redirects: start in `src/routes`.
- Need to change shared data shapes: start in `src/types`.
- Need to add images or logos: place them in `src/assets/images` or `src/assets/logos`.
- Need static files served directly by Vite: place them in `public`.

## Naming rules

- React components and pages use `PascalCase.tsx`.
- Hooks, utilities, services, and type files use descriptive camelCase names.
- Keep files close to the responsibility they serve. Shared code goes up to `components/common`, `utils`, `types`, or `services` only when more than one place uses it.
