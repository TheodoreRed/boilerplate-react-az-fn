# Architecture & Development Guide

This repo is a production-ready monorepo boilerplate. Infrastructure, auth, theming, layout, CI/CD, and database are already configured. **Your job is to build business logic — nothing else.**

---

## Repo Structure

```
frontend/          → React + TypeScript + Vite
  src/
    app/           → Router, providers, app entry
    components/    → Shared UI components (layouts, loading screens)
    features/      → Feature modules (one folder per feature)
    i18n/          → Internationalization (react-intl)
    lib/           → Theme, utilities, external lib wrappers
backend/           → Azure Functions Node.js v4 + TypeScript
  src/
    functions/     → One file per function/route group
    models/        → Mongoose models
    mongodb/       → Database connection (client.ts)
    utils/         → Shared helpers (response.ts, etc.)
```

---

## What's Already Done — Do NOT Recreate

- **Auth** — Microsoft Entra External ID (CIAM) via MSAL. Login, logout, token acquisition, and route protection are wired up. The auth store (`features/auth/auth-store.ts`) exposes `displayName`, `email`, `roles`, `isAuthenticated`.
- **Theme** — MUI with dark/light mode toggle. Use `useThemeStore()` for mode. Use MUI's `theme.palette` tokens — never hardcode colors.
- **Layout** — `MainLayout` with responsive AppBar, mobile drawer, desktop inline nav. It renders `<Outlet />` for routed pages. All new pages go inside this layout via the router.
- **Routing** — React Router v7 in `app/Router.tsx`. Lazy-loaded routes with `<Suspense>`. Add new routes here.
- **API layer** — React Query for server state. Zustand for client state. Both are already configured with providers.
- **Internationalization** — react-intl is set up. Use `useT('namespace')` for translations.
- **CI/CD** — GitHub Actions deploy frontend on push to `staging`/`main`, backend on merged PR to `staging`/`main`.
- **Database** — MongoDB Atlas via Mongoose. Connection string is in `MONGODB_URI` env var. DB name is in `MONGODB_DB_NAME`.

---

## Environment Variables

### Frontend (Vite — must be prefixed with `VITE_`)

| Variable                       | What it is                             | Example                                  |
| ------------------------------ | -------------------------------------- | ---------------------------------------- |
| `VITE_GLOBAL_WEBAPP_CLIENT_ID` | MSAL app client ID (same for all apps) | `c913612b-0b3c-449a-92c0-e08e73d5305d`   |
| `VITE_CIAM_DOMAIN`             | CIAM tenant domain (same for all apps) | `tedredapps`                             |
| `VITE_API_SCOPE`               | API permission scope                   | `api://myapp-api/access_as_user`         |
| `VITE_BASE_URL`                | Backend API base URL                   | `https://fn-myapp-stg.azurewebsites.net` |

**Usage in code:**

```typescript
const BASE_URL = import.meta.env.VITE_BASE_URL ?? "";
fetch(`${BASE_URL}/api/your-endpoint`);
```

**NEVER use relative paths like `/api/...` for backend calls.** The frontend and backend are on different domains. Always prepend `VITE_BASE_URL`.

### Backend (Azure Function App Settings)

| Variable                      | What it is                             |
| ----------------------------- | -------------------------------------- |
| `MONGODB_URI`                 | MongoDB Atlas connection string        |
| `MONGODB_DB_NAME`             | Database name (typically `appname-db`) |
| `ALLOWED_ORIGIN`              | Frontend SWA hostname for CORS         |
| `FUNCTIONS_EXTENSION_VERSION` | Always `~4`                            |

These are set automatically by the provisioning script. Access them with `process.env.MONGODB_URI` etc.

---

## How to Add a Feature

### 1. Create the feature folder

```
frontend/src/features/your-feature/
  api/           → API client functions
  components/    → Feature-specific components
  pages/         → Route-level page components
  types/         → TypeScript types for this feature
```

### 2. Add the backend endpoints

Create `backend/src/functions/your-feature.ts`:

```typescript
import { app } from "@azure/functions";
import { z } from "zod";
import { connectDb } from "../mongodb/client";
import { YourModel } from "../models/your-model";
import {
  okResponse,
  createdResponse,
  notFound,
  badRequest,
} from "../utils/response";

app.http("yourFeatureList", {
  route: "your-feature",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req) => {
    await connectDb();
    const items = await YourModel.find().sort({ updatedAt: -1 }).lean();
    return okResponse({ items });
  },
});
```

Register it in `backend/src/index.ts`:

```typescript
import "./functions/your-feature";
```

### 3. Add the Mongoose model

Create `backend/src/models/your-model.ts`:

```typescript
import mongoose, { type Document, type Model } from "mongoose";

export interface IYourThing extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new mongoose.Schema<IYourThing>(
  {
    name: { type: String, required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

export const YourModel: Model<IYourThing> =
  (mongoose.models.YourThing as Model<IYourThing>) ??
  mongoose.model<IYourThing>("YourThing", schema);
```

### 4. Add the frontend API client

Create `frontend/src/features/your-feature/api/yourFeatureApi.ts`:

```typescript
const BASE_URL = import.meta.env.VITE_BASE_URL ?? "";

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}/api/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json();
}

export async function listItems() {
  const data = await api<{ items: YourItem[] }>("your-feature");
  return data.items;
}
```

### 5. Add the page component

Create `frontend/src/features/your-feature/pages/YourFeaturePage.tsx`:

```tsx
import { useQuery } from "@tanstack/react-query";
import { Box, Typography } from "@mui/material";
import { listItems } from "../api/yourFeatureApi";

export default function YourFeaturePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["your-feature"],
    queryFn: listItems,
  });

  if (isLoading) return <Typography>Loading...</Typography>;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
        Your Feature
      </Typography>
      {/* render your data */}
    </Box>
  );
}
```

### 6. Add the route

In `frontend/src/app/Router.tsx`:

```tsx
const YourFeaturePage = lazy(() => import('@/features/your-feature/pages/YourFeaturePage'))

// Inside <Route element={<MainLayout />}>
<Route path='/your-feature' element={<YourFeaturePage />} />
```

---

## Response Helpers

The backend has standardized response helpers in `backend/src/utils/response.ts`. Always use these:

```typescript
return okResponse({ data }); // 200
return createdResponse({ data }); // 201
return badRequest("message"); // 400
return notFound("message"); // 404
```

They automatically set CORS headers using `ALLOWED_ORIGIN`.

---

## Rules

1. **Always use `VITE_BASE_URL` for API calls.** Never `/api/...` relative paths.
2. **Always use MUI components.** No raw HTML for UI. No custom CSS files. Use `sx` prop for styling.
3. **Always use MUI theme tokens.** Never hardcode colors like `#1976d2`. Use `theme.palette.primary.main` or reference palette in `sx`.
4. **Always use React Query for server state.** `useQuery` for reads, `useMutation` for writes. Invalidate queries after mutations.
5. **Always use Zustand for client-only state** that needs to be shared across components.
6. **Always use `connectDb()` at the top of every backend handler** before any database operations.
7. **Always validate request bodies with Zod** in backend handlers.
8. **Always register new function files** in `backend/src/index.ts`.
9. **Never modify the auth flow, theme setup, layout, or CI/CD workflows** unless explicitly asked.
10. **Never install a database other than MongoDB.** Use the existing Mongoose setup.
11. **Lazy-load all page components** in the router with `React.lazy()`.
12. **Use `export default`** on page components so lazy loading works.
13. **Keep API client functions in the feature's `api/` folder**, not in components or pages.
14. **Use TypeScript strictly.** No `any` types unless absolutely necessary. Define interfaces for all data shapes.

---

## Local Development

### Frontend

```bash
cd frontend
pnpm install
pnpm dev          # starts on http://localhost:5173
```

Create a `.env.local` for local dev:

```
VITE_GLOBAL_WEBAPP_CLIENT_ID=c913612b-0b3c-449a-92c0-e08e73d5305d
VITE_CIAM_DOMAIN=tedredapps
VITE_API_SCOPE=api://APPNAME-api/access_as_user
VITE_BASE_URL=http://localhost:7071
```

### Backend

```bash
cd backend
npm install
npm run build
npm start         # starts on http://localhost:7071
```

Create a `local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "FUNCTIONS_EXTENSION_VERSION": "~4",
    "MONGODB_URI": "your-connection-string",
    "MONGODB_DB_NAME": "appname-db",
    "ALLOWED_ORIGIN": "http://localhost:5173"
  }
}
```

---

## Deployment

Handled automatically by GitHub Actions:

- **Frontend:** Push to `staging` or `main` branch → deploys to Azure Static Web Apps
- **Backend:** Merge a PR into `staging` or `main` → deploys to Azure Functions

Environment-specific secrets and variables are configured in GitHub repo settings under Environments (`staging` and `main`).

---

## Tech Stack Reference

| Layer              | Tech                             |
| ------------------ | -------------------------------- |
| Frontend framework | React 19 + TypeScript            |
| Build tool         | Vite                             |
| UI library         | MUI (Material UI)                |
| Client state       | Zustand                          |
| Server state       | React Query (TanStack)           |
| Auth               | MSAL (@azure/msal-react)         |
| i18n               | react-intl                       |
| Routing            | React Router v7                  |
| Backend runtime    | Azure Functions Node.js v4       |
| Database           | MongoDB Atlas via Mongoose       |
| Validation         | Zod                              |
| Hosting (frontend) | Azure Static Web Apps            |
| Hosting (backend)  | Azure Functions Flex Consumption |
| CI/CD              | GitHub Actions                   |
