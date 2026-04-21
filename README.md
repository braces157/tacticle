# Tactile Gallery

Tactile Gallery is a full-stack project that simulates a premium mechanical keyboard storefront and admin dashboard. The frontend is built with `Vite + React + TypeScript`, while the backend uses `Spring Boot`, with data managed through `SQL Server + Flyway + Redis`.

## Overview

The project currently includes:

- Home page, category pages, search, product detail, cart, and checkout
- Login, registration, password change, forgot password, and user profile
- Order history and order detail pages
- Admin area for dashboard, orders, customers, inventory, and products
- Seed data and demo accounts for local development

## Tech Stack

### Frontend

- `React 19`
- `TypeScript`
- `Vite`
- `React Router`
- `Tailwind CSS 4`
- `Vitest` + Testing Library

### Backend

- `Java 21`
- `Spring Boot 3`
- `Spring Web`
- `Spring Data JPA`
- `Spring Security`
- `Flyway`
- `SQL Server`
- `Redis`
- `JWT`

## Project Structure

```text
.
|-- src/                 # frontend application
|-- backend/             # Spring Boot API
|-- component/           # UI assets and mockups
|-- docs/                # additional documentation
|-- products.json        # large product data source
|-- DESIGN.md            # design system and UI direction
```

## Environment Requirements

- `Node.js` 20+
- `npm`
- `Java 21`
- `Maven`
- `SQL Server` if you want to run the backend with the default `sqlserver` profile
- `Redis` for backend catalog caching

## Running Locally

### 1. Start the frontend

```bash
npm install
npm run dev
```

The frontend runs by default at `http://localhost:5173`.

To start from the documented frontend defaults, copy `.env.example` to `.env`.

If you need to override the API base URL, use:

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

### 2. Start Redis

If you do not already have Redis running locally, start it with Docker:

```bash
docker run -d --name redis -p 6379:6379 redis:trixie
```

The local backend expects Redis at `localhost:6379`. The default local container above does not require a password.

### 3. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The backend runs by default at `http://localhost:8081` and uses the `sqlserver` profile as the default profile.

### 4. Configure SQL Server and Redis

Start from `backend/.env.example` and copy the values into your local shell environment or `backend/secrets.properties`.

The backend reads configuration from environment variables:

```bash
set DB_HOST=your_sqlserver_host
set DB_PORT=1433
set DB_NAME=your_database_name
set DB_USERNAME=your_database_username
set DB_PASSWORD=your_database_password
set JWT_SECRET=your_base64_or_long_random_jwt_secret
set FRONTEND_BASE_URL=http://localhost:5173
set MAIL_USERNAME=your_smtp_username
set MAIL_PASSWORD=your_smtp_password
set REDIS_HOST=localhost
set REDIS_PORT=6379
set REDIS_PASSWORD=
set REDIS_DATABASE=0
set APP_DEMO_ACCOUNTS_ENABLED=true
```

Then run:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=sqlserver
```

`FRONTEND_BASE_URL` is required by the backend for OAuth redirects and generated frontend links. In local development it should usually match the Vite dev server origin, `http://localhost:5173`.

If you use the local Docker Redis container shown above, keep `REDIS_PASSWORD` empty.

## Demo Accounts

Demo accounts are disabled by default in production-safe deployments.

If you explicitly enable them for local development with `APP_DEMO_ACCOUNTS_ENABLED=true`, the seeded accounts are:

- Customer: `member@tactile.gallery` / `quiet`
- Admin: `admin@tactile.gallery` / `quiet`

## Important Scripts

From the project root:

```bash
npm run dev
npm run build
npm run preview
npm run test
```

From `backend/`:

```bash
mvn spring-boot:run
mvn test
```

## Notes

- The frontend calls the API at `http://localhost:8081/api` by default
- The backend uses Redis for catalog caching, so local backend startup now depends on both SQL Server and Redis being reachable
- The backend has its own additional documentation in `backend/README.md`
- `.env.example` and `backend/.env.example` document the supported local configuration
- `dist/`, `node_modules/`, `backend/target/`, and `run-logs/` are local development artifacts and are already included in `.gitignore`

## Troubleshooting

- If Vite shows `ws proxy socket error` or `ECONNABORTED`, the backend on `http://localhost:8081` usually is not running, is restarting, or dropped the proxied socket during an exception.
- If you change Redis cache serialization or cache structure during development, clear cached keys before restarting the backend:

```bash
docker exec redis redis-cli KEYS "tactile-gallery::*"
docker exec redis redis-cli DEL "tactile-gallery::catalog:categories::SimpleKey []" "tactile-gallery::catalog:featured-products::SimpleKey []"
```

- To remove all project cache keys more broadly, use:

```bash
docker exec redis sh -c 'redis-cli --scan --pattern "tactile-gallery::*" | while IFS= read -r key; do redis-cli DEL "$key"; done'
```

## Suggested Next Steps

- Split deployment instructions for frontend and backend into separate documentation
- Add broader end-to-end coverage for checkout, profile, and admin workflows
