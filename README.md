# MYUKCHEF website

The MYUKCHEF website: customers order from local chefs, plan meals, book chefs for events and track deliveries; chefs and the Super Admin each have their own portal. It talks to the API in [myukchef_backend](https://github.com/omoyeye/myukchef_backend).

Built with React, Vite, TypeScript, Tailwind CSS, shadcn/ui and React Query.

## Getting started

You need Node.js 20 or later, and the API running locally.

```sh
npm install --legacy-peer-deps
cp .env.example .env      # optional: Google Maps key
npm run dev
```

The site runs on http://localhost:8080. In development, `/api` and `/uploads` are passed to the API at `API_PROXY_TARGET` (for example `API_PROXY_TARGET=http://localhost:3002 npm run dev`). If you keep both repos side by side as `myukchef_frontend` and `myukchef_backend`, it reads the API's `PORT` from `../myukchef_backend/.env` instead.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Run the site with hot reload |
| `npm run build` | Build to `dist/` |
| `npm run lint` / `npm test` / `npm run typecheck` | Lint, test and type-check |

## Hosting

The site and the API are meant to share one domain: build the site and let the API serve `dist/`, or have your web host pass `/api` and `/uploads` through to the API. Uploaded photos and videos are linked as `/uploads/...`, so they only load when that path reaches the API.

Set `VITE_API_URL` only if the API is on another domain (and add this site to the API's `CORS_ORIGINS`).

Card payments (Stripe) and email (Brevo) are set up by the Super Admin under **Super Admin → Payments & email**.

## License

All rights reserved.
