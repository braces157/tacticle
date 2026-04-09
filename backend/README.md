# Tactile Gallery Backend

This folder contains a standalone Spring Boot backend for the existing Vite storefront/admin project.

## What is implemented

- REST API for catalog, search, auth, checkout, profile, and admin screens
- SQL Server-backed persistence for catalog, auth, checkout, profile, and admin data
- Flyway-managed schema and demo seed data in `WorshopV2`
- Local CORS config for the frontend dev server on `http://localhost:5173`
- Frontend API integration against the Spring Boot backend

## Run locally

```bash
cd backend
mvn spring-boot:run
```

The API will start on `http://localhost:8081`.

## IntelliJ

You can run the app directly from IntelliJ now without adding a Spring profile.

- Default profile: `sqlserver`
- Default port: `8081`

If you want a different port inside IntelliJ, add:

```text
-DSERVER_PORT=8082
```

## SQL Server setup

Configure SQL Server through environment variables or the ignored local `secrets.properties` file.

Required connection values:

- Host
- Port
- Database
- Username
- Password
- JWT secret

Optional local-development values:

- `APP_DEMO_ACCOUNTS_ENABLED=true`
- `DB_TRUST_SERVER_CERTIFICATE=true`

Run with SQL Server profile:

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=sqlserver
```

Optional overrides:

```bash
set DB_HOST=your_sqlserver_host
set DB_NAME=your_database_name
set DB_PORT=1433
set DB_USERNAME=your_database_username
set DB_PASSWORD=your_database_password
set JWT_SECRET=your_base64_or_long_random_jwt_secret
set APP_DEMO_ACCOUNTS_ENABLED=true
mvn spring-boot:run -Dspring-boot.run.profiles=sqlserver
```

## Seed users

Demo users are disabled by default in production-safe deployments.

If you set `APP_DEMO_ACCOUNTS_ENABLED=true` for local development, the seeded accounts are:

- Customer: `member@tactile.gallery` / `quiet`
- Admin: `admin@tactile.gallery` / `quiet`

## Current persistence

The backend now reads and writes against `WorshopV2` through Spring Data JPA entities and repositories.

Current scope:

1. Catalog, profile, order history, and admin inventory read from SQL Server
2. Login, registration, password change, checkout, and admin product create/update/archive write to SQL Server
3. Flyway owns schema creation and demo seed data

Possible next steps:

1. Add stronger password hashing and token-based auth
2. Add tests around repository-backed service behavior
3. Add image upload/generated asset storage if you want locally managed product images

## Frontend integration note

The existing React app is already wired to these backend endpoints and builds successfully against the current API contract.
