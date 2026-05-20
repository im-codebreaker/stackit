# stackit

> Stack it your way — minimal full-stack starter (Vue 3 + Fastify + Drizzle).

A clean, opinionated, modular pnpm monorepo for shipping a full-stack app fast.

## Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| Frontend     | Vue 3.5, Vite 7, Pinia, Vue Router, Tailwind v4, @rebnd/ui  |
| Backend      | Fastify 5, autoload, type-provider-zod                      |
| Database     | PostgreSQL via Drizzle ORM (pgvector-ready)                  |
| Validation   | Zod v4 — shared between frontend and backend                |
| Cache        | Redis (optional)                                             |
| Auth         | better-auth (optional)                                       |
| Tooling      | TypeScript, ESLint (antfu), Vitest, Docker, Traefik, Turborepo |

## Quickstart

**Local dev (recommended)** — apps run on host, infra in docker:

```bash
git clone git@github.com:im-codebreaker/stackit.git my-app
cd my-app
git remote set-url origin <your-repo-url>  # stackit is a template — point to your own repo
pnpm install
pnpm setup                              # interactive — pick optional modules + project name
cp .env.example .env
docker compose up -d postgres redis     # just the infra
pnpm db:migrate
pnpm db:seed
pnpm dev                                # api on :3000, web on :5173
```

**Full stack in docker** — everything containerized, hot-reload via `--watch`:

```bash
cp .env.example .env
docker compose up --build --watch       # traefik, postgres, redis, api, web
```

Open <http://localhost>. Traefik on `:80` routes `/` → Vite, `/api` → Fastify, `/docs` → Swagger UI. The api and web containers also expose `:3000` and `:5173` directly if you prefer.

API health: <http://localhost/api/v1/health> · OpenAPI docs: <http://localhost/docs>

## Structure

```
stackit/
├── apps/
│   ├── api/                    Fastify backend (domain modules, Zod-validated routes)
│   └── web/                    Vue 3 SPA (Pinia, Vue Router, Tailwind v4)
├── packages/
│   ├── shared/                 @stackit/shared      — Zod schemas, TS types, utilities
│   ├── db/                     @stackit/db          — Drizzle client + schema
│   ├── cache/                  @stackit/cache       — Redis client (optional)
│   ├── auth/                   @stackit/auth        — better-auth wrapper (optional)
│   └── config/
│       ├── tsconfig/           shared tsconfigs (base, node, web, vitest)
│       └── eslint-config/      shared ESLint config (wraps @antfu/eslint-config)
├── infrastructure/             traefik config; reserved for k8s/terraform
├── scripts/init.ts             post-clone setup (pnpm setup) — self-deletes
├── docker-compose.yml          traefik + postgres + redis + api + web
└── Dockerfile                  multi-stage: deps → api/web {build,dev,prod}
```

## Validation flow (Zod, end to end)

1. Define a schema once in `packages/shared/src/schemas/<domain>/`.
2. Fastify route uses it via `fastify-type-provider-zod` — request/response inferred.
3. Vue form imports the same schema and validates with the `useZodForm` composable.
4. OpenAPI docs are generated from the schemas automatically.

```ts
// packages/shared/src/schemas/users/requests.ts
export const CreateUserSchema = z.object({ email: z.email(), name: z.string().min(1) })

// apps/api/src/modules/users/users.routes.ts
fastify.post('/', { schema: users.routes.createUserRoute }, handlers.create)

// apps/web/src/views/UsersView.vue
const { form, errors, validate } = useZodForm(users.requests.CreateUserSchema, { email: '', name: '' })
```

## Scripts (root)

| Command             | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `pnpm setup`        | One-time interactive setup (removed after first run)  |
| `pnpm dev`          | Run all apps in parallel                              |
| `pnpm build`        | Build every workspace                                 |
| `pnpm lint`         | ESLint across the repo                                |
| `pnpm test`         | Vitest across api + web                               |
| `pnpm type-check`   | tsc / vue-tsc across all packages                     |
| `pnpm db:generate`  | Generate a Drizzle migration from schema changes      |
| `pnpm db:migrate`   | Apply pending Drizzle migrations                      |
| `pnpm db:push`      | Push schema to DB without migration (dev only)        |
| `pnpm db:seed`      | Seed the database                                     |
| `pnpm db:studio`    | Open Drizzle Studio                                   |

## Architecture choices

- **Turborepo** — task orchestration with intelligent caching. Run `pnpm dev` to start all apps in parallel, or `pnpm build` to build with cached layers.
- **Source-only packages** — every shared package exports `./src/index.ts` directly. Apps compile through their own tooling (`tsx`, `vite`). No build step in `packages/`.
- **Domain-based API modules** — each feature lives in `apps/api/src/modules/<domain>/` with its own routes, handlers, services, and repositories. Four-layer architecture: routes → handlers (HTTP) → services (business logic) → repositories (data access).
- **Service layer** — business logic lives between handlers and repositories. Handlers deal with HTTP concerns (status codes, error mapping), services contain domain logic, repositories handle data access with optional transaction support.
- **Autoloaded Fastify plugins** — drop a file in `plugins/external/` or `plugins/app/`; it registers automatically. Removing a feature is just deleting its file.
- **Repository pattern** — repositories accept an optional `tx?: DatabaseClient` parameter for participating in Drizzle transactions.
- **pgvector-ready** — Drizzle natively supports the `vector` column type and `cosineDistance`/`l2Distance` operators. Add `CREATE EXTENSION IF NOT EXISTS vector;` to a migration, declare a `vector('embedding', { dimensions: 1536 })` column, and similarity queries become fully typed.
- **Module augmentation** — `apps/api/src/types/fastify.d.ts` declares decorators (`fastify.db`, `fastify.cache`, `fastify.auth`).
- **One demo domain (`users`)** — full CRUD slice with shared schemas, module structure (routes/handlers/services/repositories), store, and view as a template to copy.

## Optional modules

The `pnpm setup` script asks at install time. Each module is structured so that removing it is purely additive cleanup:

| Module     | Removed if declined                                                              |
| ---------- | -------------------------------------------------------------------------------- |
| Redis      | `packages/cache/`, `apps/api/src/plugins/app/redis.ts`, redis service in compose |
| better-auth | `packages/auth/`, auth plugin/route/lib, login view, auth store, auth schema     |

Re-enabling a module after removal: copy it from this template's git history, or just `pnpm add` and rebuild from scratch.

## License

MIT — see [LICENSE](./LICENSE).
