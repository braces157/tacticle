# Tactile Gallery

Tactile Gallery is a full-stack project that simulates a premium mechanical keyboard storefront and admin dashboard. The frontend is built with `Vite + React + TypeScript`, while the backend uses `Spring Boot`, with data managed through `SQL Server + Flyway`.

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

## Running Locally

### 1. Start the frontend

```bash
npm install
npm run dev
```

The frontend runs by default at `http://localhost:5173`.

If you need to override the API base URL, create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8081/api
```

### 2. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The backend runs by default at `http://localhost:8081` and uses the `sqlserver` profile as the default profile.

### 3. Configure SQL Server

The backend reads configuration from environment variables:

```bash
set DB_HOST=localhost
set DB_PORT=1433
set DB_NAME=WorshopV2
set DB_USERNAME=sa
set DB_PASSWORD=your_password
set JWT_SECRET=replace-with-a-long-random-secret
```

Then run:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=sqlserver
```

## Demo Accounts

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
- The backend has its own additional documentation in `backend/README.md`
- `dist/`, `node_modules/`, `backend/target/`, and `run-logs/` are local development artifacts and are already included in `.gitignore`

## Suggested Next Steps

- Add `.env.example` and `backend/.env.example` files to document configuration more clearly
- Add CI for `npm run test` and `mvn test`
- Split deployment instructions for frontend and backend into separate documentation
