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

### Frontend (`front/.env` / build-time)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_HOST` | No (dev) / **Yes** (typical prod) | Base URL of the API (e.g. `http://localhost:8000`). If unset, the client defaults to `http://localhost:8000`. Set this in production so the browser calls your deployed API, and ensure `CORS_ORIGIN` on the backend allows your front-end origin. |

# installation

1. Install build tools: NPM, Yarn
2. Copy or create `back/.env` with `DB_URI`, `CERT`, and `CORS_ORIGIN` (see table above). Optionally set `PORT`.
3. For a production build of the frontend, set `VITE_HOST` to your API URL before `yarn build`.
4. Backend:
   - In `/back` run `yarn install` for app dependencies
   - Then run `yarn build && yarn start` to start the backend
5. Frontend:
   - In `/front` run `yarn install` for app dependencies
   - Then run `yarn dev` to start the frontend
