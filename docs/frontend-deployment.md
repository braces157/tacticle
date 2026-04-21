# Frontend Deployment

This frontend is a static Vite build. It can be deployed to any static host that serves the generated `dist/` directory and forwards API traffic to the backend.

## Prerequisites

- Node.js 20+
- `npm`
- A reachable backend base URL

## Environment

Copy `.env.example` to `.env` and set the production API origin before building.

```env
VITE_API_BASE_URL=https://your-backend.example.com/api
```

If the frontend and backend are served from the same origin behind a reverse proxy, use the relative default:

```env
VITE_API_BASE_URL=/api
```

## Build

From the project root:

```bash
npm ci
npm run test
npm run build
```

The deployment artifact is the generated `dist/` directory.

## Static Hosting Notes

- Serve `dist/index.html` for application routes such as `/product/...`, `/orders/...`, and `/admin/...`.
- Preserve the built asset paths under `dist/assets/`.
- If you terminate TLS or route traffic at a proxy, make sure `/api`, `/oauth2`, `/login/oauth2`, and `/ws` reach the backend.

## Smoke Checks

After deployment, verify:

- Home page loads and client-side navigation works.
- Login can reach the backend auth endpoints.
- Product, cart, checkout, profile, and admin routes render through SPA fallback routing.
- WebSocket-backed chat routes can connect through `/ws` if enabled in the target environment.
