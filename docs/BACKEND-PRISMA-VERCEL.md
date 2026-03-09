# Prisma "Query Engine not found" on Vercel

If your backend returns:

```text
PrismaClientInitializationError: Prisma Client could not locate the Query Engine for runtime "rhel-openssl-3.0.x"
... has been copied to "../../ROOT/app/generated/prisma"
```

the Prisma engine binary is not in the Vercel serverless bundle. Fix it in your **backend** repo (not this app).

---

## Likely cause: custom `output` path

If the error mentions `app/generated/prisma`, your `schema.prisma` probably has:

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../app/generated/prisma"   // or similar
}
```

Vercel only bundles certain paths (e.g. `node_modules`, `.next`). A custom path like `app/generated/prisma` often **is not included** in the function, so the engine is missing at runtime.

### Fix: use default output (recommended for Vercel)

1. In your backend’s **prisma/schema.prisma**, remove the `output` line and add `binaryTargets`:

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}
```

2. In your backend code, change the Prisma import from the custom path to the default:

```ts
// Before (custom output):
import { PrismaClient } from '../app/generated/prisma'

// After (default = node_modules/.prisma/client):
import { PrismaClient } from '@prisma/client'
```

3. Run locally and fix any other imports:

```bash
npx prisma generate
```

4. Commit and redeploy. The client and engine will live in `node_modules`, which Vercel bundles.

---

## If you must keep a custom output path

- Add `binaryTargets = ["native", "rhel-openssl-3.0.x"]` to the generator.
- Ensure the **entire** generated folder (including `libquery_engine-rhel-openssl-3.0.x.so.node`) is inside a directory that Vercel includes in the serverless output (e.g. part of your app entry tree, not in `.vercelignore`).
- This is trickier; using the default client location is simpler and recommended.

---

## Ensure `prisma generate` runs on deploy

In **package.json** (backend):

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && next build"
  }
}
```

(Use your real build command if not Next.js.)

---

## Vercel project settings

- **Build Command:** must run a script that runs `prisma generate` (e.g. `npm run build`).
- **Output Directory:** as required by your framework (e.g. `.next` for Next.js).
- Do **not** put `app/generated` or `.prisma` in `.vercelignore` if you rely on a custom path.

Redeploy after these changes. The mobile app only needs `EXPO_PUBLIC_API_URL` set to your backend origin (no `/api` suffix).
