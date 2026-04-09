# guest-who

A small website to help my friends and I organise a 'guess who' inspired party.

## Environment variables

### Backend (`back/.env` or process env)

| Variable | Required | Description |
|----------|----------|-------------|
| `DB_URI` | **Yes** | MongoDB connection string (e.g. Atlas with `authMechanism=MONGODB-X509` in the URI if you use X.509). |
| `CERT` | **Yes** | Filesystem path to the X.509 client certificate/key file used for TLS client authentication to MongoDB. |
| `CORS_ORIGIN` | **Yes** | Allowed browser origin for the API (e.g. `http://localhost:5173` in dev, or your deployed front-end URL). Use `*` only if you accept the security tradeoff. |
| `PORT` | No | HTTP port for the API. Defaults to `8000` if unset. |
| `TRUST_PROXY` | No | How Express treats `X-Forwarded-*` when the API sits behind a reverse proxy (nginx, Fly, Railway, load balancers, etc.). Affects `req.ip` and **per-IP rate limiting** for mutation routes. `0` or `false` disables trust. A positive integer is the number of proxy hops to trust (e.g. `1` for a single ingress). If unset: `1` when `NODE_ENV=production`, otherwise trust is off (typical for local dev without a proxy). |
| `RATE_LIMIT_WINDOW_MS` | No | Time window in milliseconds for **mutation** rate limits (`POST /games/new`, `POST /responses` only). Defaults to `900000` (15 minutes). Invalid or empty values fall back to the default. |
| `RATE_LIMIT_MAX` | No | Maximum mutation requests allowed per client IP per window. Defaults to `100`. Increase if many real clients share one public IP (e.g. same Wi‑Fi). Invalid or empty values fall back to the default. |

### Frontend (`front/.env` / build-time)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_HOST` | No (dev) / **Yes** (typical prod) | Base URL of the API (e.g. `http://localhost:8000`). If unset, the client defaults to `http://localhost:8000`. Set this in production so the browser calls your deployed API, and ensure `CORS_ORIGIN` on the backend allows your front-end origin. |

## Tests

From the repo root, after dependencies are installed (`yarn install` at the root, or the per-package installs you already use for development), run:

```bash
yarn test
```

That builds the shared package, runs shared Vitest unit tests (schemas), builds the backend, then runs backend Vitest (route and integration-style tests against `createApp` with **in-memory** collection stubs). **You do not need MongoDB, `DB_URI`, `CERT`, or `CORS_ORIGIN` for this command**—only for running the real API (`yarn --cwd back dev` or `yarn start:back`).

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs `yarn run build` then `yarn run test` on a clean checkout with the same expectations: **no database service** in CI.

# installation

1. Install build tools: NPM, Yarn
2. Copy or create `back/.env` with `DB_URI`, `CERT`, and `CORS_ORIGIN` (see table above). Optionally set `PORT`, `TRUST_PROXY` (if behind a proxy), and `RATE_LIMIT_*` to tune mutation rate limits.
3. For a production build of the frontend, set `VITE_HOST` to your API URL before `yarn build`.
4. Backend:
   - In `/back` run `yarn install` for app dependencies
   - Build the shared package first (`yarn --cwd shared build` from the repo root, or use `yarn build:all`) so `shared/dist` exists for imports
   - Production: `yarn build && yarn start` runs the compiled `dist/index.js` (with `GET /health` and `GET /ready` for probes)
   - Local development with TypeScript directly: `yarn dev` (still uses `ts-node`)
5. Frontend:
   - In `/front` run `yarn install` for app dependencies
   - Then run `yarn dev` to start the frontend
