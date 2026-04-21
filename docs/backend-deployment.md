# Backend Deployment

This backend is a Spring Boot application that depends on SQL Server and Redis. Deploy it anywhere Java 21 applications can run, as long as those dependencies are reachable and the required environment variables are provided.

## Prerequisites

- Java 21
- Maven if building on the target host
- SQL Server database
- Redis instance

## Environment

Start from `backend/.env.example` and provide real values through your deployment platform, shell environment, or an externalized properties source.

Required values:

- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `FRONTEND_BASE_URL`

Usually required in non-local deployments:

- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DATABASE`

Optional operational values:

- `APP_DEMO_ACCOUNTS_ENABLED`
- `DB_TRUST_SERVER_CERTIFICATE`
- `APP_AUTH_COOKIE_NAME`
- `APP_AUTH_COOKIE_SECURE`
- `APP_AUTH_COOKIE_SAME_SITE`
- `APP_UPLOADS_PATH`
- `APP_UPLOADS_MAX_FILE_SIZE_BYTES`

## Build

From `backend/`:

```bash
mvn -B test
mvn -B -DskipTests package
```

The deployment artifact is the generated JAR in `backend/target/`.

## Run

```bash
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

The application defaults to port `8081` and the `sqlserver` profile unless overridden.

## Deployment Notes

- Flyway migrations run on startup, so the configured database user must be allowed to apply schema changes.
- Redis must be reachable at startup because catalog caching is enabled.
- `FRONTEND_BASE_URL` must match the public frontend origin used for OAuth callbacks and generated links.
- If the backend is deployed behind a proxy, make sure cookies, OAuth routes, and WebSocket traffic are forwarded correctly.

## Smoke Checks

After deployment, verify:

- `GET /actuator/health` returns healthy.
- Public catalog endpoints under `/api/categories`, `/api/products`, and `/api/search` respond.
- Login and protected routes work with the deployed frontend origin.
- Admin APIs and WebSocket chat endpoints behave correctly behind the target proxy/load balancer.
