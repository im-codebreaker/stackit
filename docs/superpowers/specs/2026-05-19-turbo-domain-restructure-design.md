# Turbo + Domain Restructure + Better-Auth Seeding

**Date:** 2026-05-19  
**Status:** Approved  
**Approach:** Bottom-up (Infrastructure First)

## Overview

This design documents a comprehensive modernization of the stackit monorepo structure, introducing Turborepo for build orchestration, consolidating packages for cleaner imports, restructuring the API to a domain-based module pattern with service layer, and enhancing seed files with proper better-auth password hashing.

## Goals

1. **Add Turborepo** - Better build orchestration and caching
2. **Consolidate packages** - Merge `helpers`, `validations`, `types` → `shared` (following brand-radar pattern)
3. **Restructure API** - Move from flat structure to domain-based modules with service layer
4. **Enhance seeding** - Add better-auth account seeding with scrypt password hashing

## Scope

This is a single-PR refactoring that touches multiple areas but forms a coherent "modernization" effort. All changes are interdependent:
- Turbo provides better build orchestration
- Package consolidation cleans up imports before API restructure
- API restructure benefits from cleaner package structure
- Seed file update leverages the new structure

## Non-Goals

- No RBAC system (keeping auth simple - just users + accounts)
- No new features or behavior changes
- No breaking changes to runtime behavior (only internal structure)

---

## 1. Turbo Configuration

### Files to Create

**`turbo.json`** at project root:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", ".nuxt/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    },
    "lint": {
      "cache": false
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "db:generate": {
      "cache": false
    },
    "db:migrate": {
      "cache": false
    },
    "db:push": {
      "cache": false
    },
    "db:seed": {
      "cache": false
    },
    "db:studio": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Optimizations Over Brand-Radar

1. **`lint` cache disabled** - Linting is fast; ESLint cache is unreliable with config changes
2. **`test` outputs coverage** - Enables caching test runs when code unchanged
3. **All `db:*` tasks cache disabled** - Database operations are side-effectful, never cache

### Package.json Changes

Replace `pnpm -r --parallel` commands with `turbo run`:

```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:api": "turbo run dev --filter=@stackit/api",
    "dev:web": "turbo run dev --filter=@stackit/web",
    "build": "turbo run build",
    "type-check": "turbo run type-check",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:generate": "turbo run db:generate --filter=@stackit/db",
    "db:migrate": "turbo run db:migrate --filter=@stackit/db",
    "db:push": "turbo run db:push --filter=@stackit/db",
    "db:seed": "turbo run db:seed --filter=@stackit/db",
    "db:studio": "turbo run db:studio --filter=@stackit/db"
  },
  "devDependencies": {
    "turbo": "^2.3.3"
  }
}
```

### Why This Matters

- **Parallel execution** with proper dependency tracking
- **Incremental builds** - only rebuild what changed
- **Remote caching** - share build artifacts across team (future)
- **Better DX** - clearer task dependencies, faster feedback

---

## 2. Package Consolidation (`shared`)

### Current State

Three separate packages:
- `@stackit/helpers` - utilities
- `@stackit/validations` - Zod schemas
- `@stackit/types` - TypeScript types

### New Structure

Single `@stackit/shared` package following brand-radar pattern:

```
packages/shared/
├── src/
│   ├── constants/          # Shared constants
│   ├── enums/              # Shared enums
│   ├── errors/             # Custom error classes
│   ├── guards/             # Type guards
│   ├── schemas/            # Zod schemas (from validations)
│   │   ├── env/
│   │   │   ├── api.ts
│   │   │   ├── shared.ts
│   │   │   └── index.ts
│   │   ├── shared/
│   │   │   ├── pagination.ts
│   │   │   ├── response.ts
│   │   │   └── index.ts
│   │   ├── users/
│   │   │   ├── requests.ts
│   │   │   ├── responses.ts
│   │   │   ├── routes.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── types/              # TypeScript types (from types)
│   │   ├── api.ts
│   │   └── index.ts
│   ├── utils/              # Utilities (from helpers)
│   │   └── index.ts
│   └── index.ts            # Barrel export
├── package.json
└── tsconfig.json
```

### Migration Steps

1. Create `packages/shared/` with new structure
2. Move `packages/validations/src/*` → `packages/shared/src/schemas/`
3. Move `packages/types/src/*` → `packages/shared/src/types/`
4. Move `packages/helpers/src/*` → `packages/shared/src/utils/`
5. Add empty directories for future use: `constants/`, `enums/`, `errors/`, `guards/`
6. Update barrel exports in `packages/shared/src/index.ts`
7. Update all imports across codebase:
   - `@stackit/validations` → `@stackit/shared/schemas`
   - `@stackit/types` → `@stackit/shared/types`
   - `@stackit/helpers` → `@stackit/shared/utils`
8. Delete old packages: `helpers/`, `validations/`, `types/`
9. Update workspace `package.json` and references

### Barrel Export Pattern

```typescript
// packages/shared/src/index.ts
export * from './schemas/index.js'
export * from './types/index.js'
export * from './utils/index.js'
export * from './constants/index.js'
export * from './enums/index.js'
export * from './errors/index.js'
export * from './guards/index.js'
```

### Import Examples

**Before:**
```typescript
import { userCreateSchema } from '@stackit/validations/users/requests'
import type { ApiResponse } from '@stackit/types'
import { formatDate } from '@stackit/helpers'
```

**After:**
```typescript
import { userCreateSchema } from '@stackit/shared/schemas/users/requests'
import type { ApiResponse } from '@stackit/shared/types'
import { formatDate } from '@stackit/shared/utils'
```

### Why This Matters

- **Simpler mental model** - one package for all cross-cutting concerns
- **Easier discoverability** - everything related in one place
- **Matches industry patterns** - follows brand-radar and other modern monorepos
- **Fewer package.json dependencies** - one `@stackit/shared` instead of three

---

## 3. API Module Structure

### Current State (Flat)

```
apps/api/src/
├── handlers/
│   └── users.ts           # HTTP handlers
├── repositories/
│   └── users.ts           # Data access
└── routes/
    └── users.ts           # Route definitions
```

### New Structure (Domain Modules)

```
apps/api/src/
├── modules/
│   └── users/
│       ├── users.handlers.ts      # HTTP handlers
│       ├── users.service.ts       # Business logic (NEW)
│       ├── users.repository.ts    # Data access
│       └── users.routes.ts        # Route definitions
├── plugins/
│   ├── app/
│   │   ├── db.ts
│   │   ├── redis.ts
│   │   ├── auth.ts
│   │   └── error-handler.ts
│   └── external/
│       ├── cors.ts
│       ├── helmet.ts
│       └── swagger.ts
├── lib/                           # Shared API utilities (non-exported)
├── types/                         # API-specific types
│   └── fastify.d.ts
└── config/
    └── index.ts
```

### Service Layer (NEW)

**Why add a service layer?**

The service layer sits between handlers and repositories, providing:
1. **Business logic encapsulation** - validation, transformation, orchestration
2. **Transaction management** - coordinate multiple repository calls
3. **Cleaner handlers** - handlers focus on HTTP concerns (request/response)
4. **Easier testing** - test business logic without HTTP mocking

**Layer responsibilities:**
- **Handlers** - HTTP concerns (parse request, validate via Zod, format response, set status codes)
- **Services** - Business logic (validation beyond schema, orchestration, side effects)
- **Repositories** - Data access (pure Drizzle queries, transaction support)

### Module Pattern (Users Example)

#### `users.repository.ts`

```typescript
import type { DatabaseClient } from '@stackit/db'
import { users } from '@stackit/db/schema'
import { eq } from 'drizzle-orm'

export function createUsersRepository(db: DatabaseClient) {
  return {
    async findById(id: string, tx?: DatabaseClient) {
      const client = tx ?? db
      return client.query.users.findFirst({
        where: eq(users.id, id),
      })
    },

    async findByEmail(email: string, tx?: DatabaseClient) {
      const client = tx ?? db
      return client.query.users.findFirst({
        where: eq(users.email, email),
      })
    },

    async create(data: typeof users.$inferInsert, tx?: DatabaseClient) {
      const client = tx ?? db
      const [user] = await client.insert(users).values(data).returning()
      return user
    },

    async update(id: string, data: Partial<typeof users.$inferInsert>, tx?: DatabaseClient) {
      const client = tx ?? db
      const [user] = await client
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning()
      return user
    },

    async delete(id: string, tx?: DatabaseClient) {
      const client = tx ?? db
      await client.delete(users).where(eq(users.id, id))
    },
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
```

**Key patterns:**
- Factory function returns repository interface
- All methods accept optional `tx` for transaction support
- Type-safe with Drizzle's `$inferInsert` / `$inferSelect`
- No business logic - pure data access

#### `users.service.ts` (NEW)

```typescript
import type { UsersRepository } from './users.repository.js'
import type { DatabaseClient } from '@stackit/db'

export function createUsersService(
  repository: UsersRepository,
  db: DatabaseClient
) {
  return {
    async getUserById(id: string) {
      const user = await repository.findById(id)
      if (!user) {
        throw new Error('User not found')
      }
      return user
    },

    async getUserByEmail(email: string) {
      const user = await repository.findByEmail(email)
      if (!user) {
        throw new Error('User not found')
      }
      return user
    },

    async createUser(data: { email: string; name: string }) {
      // Business logic: check for duplicates
      const existing = await repository.findByEmail(data.email)
      if (existing) {
        throw new Error('User with this email already exists')
      }

      // Future: could send welcome email, create profile, etc.
      return repository.create(data)
    },

    async updateUser(id: string, data: { name?: string }) {
      // Business logic: validate user exists
      const existing = await repository.findById(id)
      if (!existing) {
        throw new Error('User not found')
      }

      return repository.update(id, data)
    },

    async deleteUser(id: string) {
      // Business logic: validate user exists
      const existing = await repository.findById(id)
      if (!existing) {
        throw new Error('User not found')
      }

      // Future: could archive instead of delete, cleanup related data, etc.
      await repository.delete(id)
    },
  }
}

export type UsersService = ReturnType<typeof createUsersService>
```

**Key patterns:**
- Takes repository + db as dependencies
- Throws domain errors (not HTTP errors)
- Coordinates business rules (duplicate checks, validation)
- Can orchestrate multiple repositories
- Transaction-ready (can pass `db.transaction` callback)

#### `users.handlers.ts`

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UsersService } from './users.service.js'

export function createUsersHandlers(service: UsersService) {
  return {
    async getUser(
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) {
      try {
        const { id } = request.params
        const user = await service.getUserById(id)
        return reply.send(user)
      } catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
          return reply.status(404).send({ error: error.message })
        }
        throw error
      }
    },

    async createUser(
      request: FastifyRequest<{ Body: { email: string; name: string } }>,
      reply: FastifyReply
    ) {
      try {
        const user = await service.createUser(request.body)
        return reply.status(201).send(user)
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          return reply.status(409).send({ error: error.message })
        }
        throw error
      }
    },

    async updateUser(
      request: FastifyRequest<{
        Params: { id: string }
        Body: { name?: string }
      }>,
      reply: FastifyReply
    ) {
      try {
        const { id } = request.params
        const user = await service.updateUser(id, request.body)
        return reply.send(user)
      } catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
          return reply.status(404).send({ error: error.message })
        }
        throw error
      }
    },

    async deleteUser(
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) {
      try {
        const { id } = request.params
        await service.deleteUser(id)
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
          return reply.status(404).send({ error: error.message })
        }
        throw error
      }
    },
  }
}
```

**Key patterns:**
- Focus on HTTP concerns (status codes, response format)
- Translate domain errors to HTTP errors
- No business logic (that's in service)
- Type-safe request/reply

#### `users.routes.ts`

```typescript
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { createUsersRepository } from './users.repository.js'
import { createUsersService } from './users.service.js'
import { createUsersHandlers } from './users.handlers.js'
import {
  userCreateSchema,
  userUpdateSchema,
  userResponseSchema,
} from '@stackit/shared/schemas/users'

const usersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Initialize layers
  const repository = createUsersRepository(fastify.db)
  const service = createUsersService(repository, fastify.db)
  const handlers = createUsersHandlers(service)

  // Define routes with Zod validation
  fastify.get(
    '/:id',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 200: userResponseSchema },
      },
    },
    handlers.getUser
  )

  fastify.post(
    '/',
    {
      schema: {
        body: userCreateSchema,
        response: { 201: userResponseSchema },
      },
    },
    handlers.createUser
  )

  fastify.patch(
    '/:id',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
        body: userUpdateSchema,
        response: { 200: userResponseSchema },
      },
    },
    handlers.updateUser
  )

  fastify.delete(
    '/:id',
    {
      schema: {
        params: { type: 'object', properties: { id: { type: 'string' } } },
        response: { 204: { type: 'null' } },
      },
    },
    handlers.deleteUser
  )
}

export default usersRoutes
export const autoPrefix = '/users'
```

**Key patterns:**
- Wires up all three layers
- Exports `autoPrefix` for Fastify autoload
- Zod schemas for request/response validation
- Type-safe with `FastifyPluginAsyncZod`

### Fastify Plugin Changes

**Remove:** `apps/api/src/plugins/app/repositories.ts`

Repositories are no longer global decorators. Each module creates its own repository instance.

**Update:** Autoload configuration in `apps/api/src/server.ts`

```typescript
// Before
await app.register(AutoLoad, {
  dir: join(__dirname, 'routes'),
  options: { prefix: '/api' },
})

// After
await app.register(AutoLoad, {
  dir: join(__dirname, 'modules'),
  dirNameRoutePrefix: false,
  matchFilter: (path) => path.endsWith('.routes.js') || path.endsWith('.routes.ts'),
  options: { prefix: '/api' },
})
```

### Future Modules

As new domains are added, follow the same pattern:

```
modules/
├── users/
│   ├── users.handlers.ts
│   ├── users.service.ts
│   ├── users.repository.ts
│   └── users.routes.ts
├── projects/
│   ├── projects.handlers.ts
│   ├── projects.service.ts
│   ├── projects.repository.ts
│   └── projects.routes.ts
└── teams/
    ├── teams.handlers.ts
    ├── teams.service.ts
    ├── teams.repository.ts
    └── teams.routes.ts
```

### Why This Matters

- **Scalability** - each domain is self-contained
- **Discoverability** - everything for a domain in one place
- **Maintainability** - clear separation of concerns
- **Testability** - each layer can be tested in isolation
- **Consistency** - enforce the same pattern across all domains

---

## 4. Seed File Enhancement

### Current State

Simple seed file in `packages/db/scripts/seed.ts`:
```typescript
async function main() {
  const [demo] = await db
    .insert(users)
    .values({ email: 'demo@stackit.dev', name: 'Demo User' })
    .onConflictDoNothing({ target: users.email })
    .returning()

  console.warn(`Seeded user: ${demo?.email ?? 'demo@stackit.dev (already existed)'}`)
}
```

**Problems:**
- No password/account created
- Can't actually log in with this user
- Not aligned with better-auth setup

### New Seed Structure

**Add dependencies:**
```json
{
  "dependencies": {
    "@noble/hashes": "^1.6.2"
  }
}
```

**Enhanced seed file:**

```typescript
import process from 'node:process'
import { createDatabaseClient } from '../src/client.js'
import { users } from '../src/schema/users.js'
import { accounts } from '../src/schema/auth.js'
import { scryptAsync } from '@noble/hashes/scrypt'
import { randomBytes, bytesToHex } from '@noble/hashes/utils'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const db = createDatabaseClient({ url: databaseUrl })

/**
 * Hash password using scrypt (EXACT better-auth implementation)
 * CRITICAL: Salt must be hex-encoded STRING before passing to scryptAsync
 * Parameters: N=16384, r=16, p=1, dkLen=64, maxmem=128*N*r*2
 */
async function hashPassword(password: string): Promise<string> {
  // Generate 16 random bytes and hex-encode to string (32 chars)
  const salt = bytesToHex(randomBytes(16))

  // Normalize password to NFKC form (Unicode normalization)
  const normalizedPassword = password.normalize('NFKC')

  // Pass hex string as salt (scryptAsync will convert to UTF-8 bytes)
  const derivedKey = await scryptAsync(normalizedPassword, salt, {
    N: 16384,
    r: 16,
    p: 1,
    dkLen: 64,
    maxmem: 128 * 16384 * 16 * 2,
  })

  return `${salt}:${bytesToHex(derivedKey)}`
}

async function main() {
  console.log('🌱 Seeding development database...\n')

  const defaultPassword = 'password123'
  const hashedPassword = await hashPassword(defaultPassword)

  // Seed users
  console.log('👥 Seeding users...')
  const devUsers = [
    {
      id: 'user_demo',
      email: 'demo@stackit.dev',
      name: 'Demo User',
      emailVerified: true,
      image: null,
    },
    {
      id: 'user_admin',
      email: 'admin@stackit.dev',
      name: 'Admin User',
      emailVerified: true,
      image: null,
    },
  ]

  for (const userData of devUsers) {
    await db
      .insert(users)
      .values(userData)
      .onConflictDoNothing({ target: users.email })
    console.log(`  ✓ Created user: ${userData.email}`)
  }

  // Seed accounts with passwords
  console.log('\n🔑 Seeding accounts with passwords...')
  const devAccounts = [
    {
      id: 'account_demo',
      accountId: 'user_demo', // Same as userId for credential provider
      providerId: 'credential',
      userId: 'user_demo',
      password: hashedPassword,
      scope: null,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    },
    {
      id: 'account_admin',
      accountId: 'user_admin',
      providerId: 'credential',
      userId: 'user_admin',
      password: hashedPassword,
      scope: null,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
    },
  ]

  for (const accountData of devAccounts) {
    await db
      .insert(accounts)
      .values(accountData)
      .onConflictDoNothing({ target: [accounts.providerId, accounts.accountId] })
    console.log(`  ✓ Created account: ${accountData.accountId}`)
  }

  console.log(`\n  ℹ️  Default password for all dev accounts: ${defaultPassword}`)
  console.log('\n✅ Database seeding completed!\n')
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
```

### Password Hashing Details

**Algorithm:** scrypt (matches better-auth exactly)

**Parameters:**
- `N`: 16384 (CPU/memory cost)
- `r`: 16 (block size)
- `p`: 1 (parallelization)
- `dkLen`: 64 (derived key length)
- `maxmem`: 128 * 16384 * 16 * 2

**Format:** `{salt}:{hash}` where both are hex-encoded

**Why @noble/hashes?**
- Same library better-auth uses internally
- No native dependencies (pure JS)
- Audited and maintained
- Smaller than bcrypt

### Seed Data

**Users:**
- `demo@stackit.dev` / `password123`
- `admin@stackit.dev` / `password123`

**Why two users?**
- Demonstrate different roles (future RBAC ready)
- Test multi-user scenarios
- Common dev pattern

### Why This Matters

- **Actually usable** - can log in with seeded users
- **Matches production** - same password hashing as production
- **Development speed** - instant test accounts
- **No security compromise** - proper hashing even in dev

---

## 5. Implementation Plan (Approach A: Bottom-Up)

### Step 1: Add Turbo

**Tasks:**
1. Create `turbo.json` at project root
2. Update root `package.json`:
   - Add `"turbo": "^2.3.3"` to devDependencies
   - Update all scripts to use `turbo run`
3. Run `pnpm install`
4. Verify: `pnpm dev`, `pnpm build`, `pnpm type-check` all work

**Success criteria:**
- ✅ Turbo installed and configured
- ✅ All commands work as before
- ✅ Parallel execution visible in terminal output

### Step 2: Consolidate Packages → `shared`

**Tasks:**
1. Create `packages/shared/` with new structure:
   ```
   shared/
   ├── src/
   │   ├── constants/
   │   ├── enums/
   │   ├── errors/
   │   ├── guards/
   │   ├── schemas/      # from validations
   │   ├── types/        # from types
   │   ├── utils/        # from helpers
   │   └── index.ts
   ├── package.json
   └── tsconfig.json
   ```
2. Move `packages/validations/src/**` → `packages/shared/src/schemas/`
3. Move `packages/types/src/**` → `packages/shared/src/types/`
4. Move `packages/helpers/src/**` → `packages/shared/src/utils/`
5. Create empty directories: `constants/`, `enums/`, `errors/`, `guards/`
6. Create barrel exports in `packages/shared/src/index.ts`
7. Update `packages/shared/package.json`:
   ```json
   {
     "name": "@stackit/shared",
     "exports": {
       ".": "./src/index.ts",
       "./schemas": "./src/schemas/index.ts",
       "./schemas/*": "./src/schemas/*/index.ts",
       "./types": "./src/types/index.ts",
       "./utils": "./src/utils/index.ts",
       "./constants": "./src/constants/index.ts",
       "./enums": "./src/enums/index.ts",
       "./errors": "./src/errors/index.ts",
       "./guards": "./src/guards/index.ts"
     }
   }
   ```
8. Update all imports across the codebase:
   - Search: `@stackit/validations` → Replace: `@stackit/shared/schemas`
   - Search: `@stackit/types` → Replace: `@stackit/shared/types`
   - Search: `@stackit/helpers` → Replace: `@stackit/shared/utils`
9. Update `pnpm-workspace.yaml` if needed
10. Delete old packages: `packages/helpers/`, `packages/validations/`, `packages/types/`
11. Run `pnpm install` to update lockfile
12. Verify: `pnpm type-check` passes

**Success criteria:**
- ✅ No more `@stackit/helpers`, `@stackit/validations`, `@stackit/types` imports
- ✅ All imports use `@stackit/shared/*`
- ✅ Type checking passes
- ✅ Old packages deleted

### Step 3: Restructure API → `modules/`

**Tasks:**
1. Create `apps/api/src/modules/users/` directory
2. Create `users.repository.ts`:
   - Move from `apps/api/src/repositories/users.ts`
   - Add transaction support (`tx?: DatabaseClient` param)
   - Export `createUsersRepository` factory
   - Export `UsersRepository` type
3. Create `users.service.ts` (NEW):
   - Implement business logic layer
   - Take repository + db as dependencies
   - Export `createUsersService` factory
   - Export `UsersService` type
4. Create `users.handlers.ts`:
   - Move from `apps/api/src/handlers/users.ts`
   - Update to use service instead of repository
   - Focus on HTTP concerns (status codes, response format)
5. Create `users.routes.ts`:
   - Move from `apps/api/src/routes/users.ts`
   - Wire up repository → service → handlers
   - Keep Zod validation
   - Export `autoPrefix = '/users'`
6. Update `apps/api/src/server.ts`:
   - Change autoload to scan `modules/*/*.routes.{ts,js}`
   - Update path from `routes/` to `modules/`
7. Remove `apps/api/src/plugins/app/repositories.ts` (no longer needed)
8. Delete old directories: `handlers/`, `repositories/`, `routes/`
9. Update imports in any files that referenced old structure
10. Verify: API starts without errors

**Success criteria:**
- ✅ No more flat `handlers/`, `repositories/`, `routes/` directories
- ✅ All code in `modules/users/`
- ✅ Service layer exists and works
- ✅ API server starts successfully
- ✅ `/api/users` routes respond correctly

### Step 4: Update Seed Files

**Tasks:**
1. Add `@noble/hashes` to `packages/db/package.json`:
   ```json
   {
     "dependencies": {
       "@noble/hashes": "^1.6.2"
     }
   }
   ```
2. Run `pnpm install`
3. Update `packages/db/scripts/seed.ts`:
   - Import scrypt functions from `@noble/hashes`
   - Implement `hashPassword` function (exact better-auth algorithm)
   - Import `accounts` table from schema
   - Seed users array (demo + admin)
   - Seed accounts array with hashed passwords
   - Add proper console output
4. Verify schema has `accounts` table (should exist from better-auth setup)
5. Run: `pnpm db:push` (ensure schema is up to date)
6. Run: `pnpm db:seed`
7. Test login with `demo@stackit.dev` / `password123`

**Success criteria:**
- ✅ `@noble/hashes` installed
- ✅ Seed creates users + accounts
- ✅ Can log in with `demo@stackit.dev` / `password123`
- ✅ Can log in with `admin@stackit.dev` / `password123`

### Step 5: Update Documentation

**Tasks:**
1. Update `.claude/CLAUDE.md`:
   - Document new `@stackit/shared` package
   - Update API structure examples (modules pattern)
   - Update service layer in backend patterns
   - Update seed file section
2. Update `.claude/docs/architecture.md`:
   - Add Turbo to tooling section
   - Update package diagram (remove helpers/validations/types, add shared)
   - Update API structure diagram (modules pattern)
   - Document service layer
3. Update `.claude/docs/style-guide.md`:
   - Add module structure conventions
   - Add service layer patterns
   - Update import examples
4. Review `.claude/agents/*.md`:
   - Update `drizzle-expert.md` - repository patterns with transactions
   - Update `fastify-expert.md` - module structure, service layer
   - Update `javascript-expert.md` - if mentions package structure

**Success criteria:**
- ✅ All docs reflect new structure
- ✅ Examples use correct import paths
- ✅ Service layer documented
- ✅ Agents aware of new patterns

---

## 6. Testing & Verification

### After Each Step

Run these commands after completing each step:

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Build (if applicable)
pnpm build

# Tests (if any exist)
pnpm test
```

### Final Verification Checklist

**Infrastructure:**
- [ ] Turbo configuration exists and works
- [ ] `pnpm dev` starts all services in parallel
- [ ] `pnpm build` builds all apps successfully
- [ ] No old package references remain

**Package Structure:**
- [ ] `@stackit/shared` package exists
- [ ] No `@stackit/helpers`, `@stackit/validations`, `@stackit/types` imports
- [ ] Type checking passes
- [ ] Build succeeds

**API Structure:**
- [ ] `apps/api/src/modules/users/` exists with all files
- [ ] No flat `handlers/`, `repositories/`, `routes/` directories
- [ ] Service layer implemented
- [ ] API starts without errors
- [ ] All routes respond correctly

**Seed Files:**
- [ ] `@noble/hashes` installed
- [ ] Seed creates users + accounts
- [ ] Password hashing works correctly
- [ ] Can log in with seeded users

**End-to-End Test:**

```bash
# Start infrastructure
docker compose up -d postgres redis

# Push schema
pnpm db:push

# Run seed
pnpm db:seed

# Start dev server
pnpm dev

# Test API
curl http://localhost:3000/api/users

# Test Web
open http://localhost:5173

# Test login
# Use demo@stackit.dev / password123 or admin@stackit.dev / password123
```

**Success criteria:**
- ✅ All services start
- ✅ No errors in console
- ✅ API responds correctly
- ✅ Web app loads
- ✅ Can log in with seeded users
- ✅ No broken imports or types

---

## 7. Rollback Plan

If issues arise during implementation, rollback is straightforward since this is a single PR:

1. **Revert the PR/commit** - all changes in one place
2. **No database schema changes** - no migrations to rollback
3. **No runtime behavior changes** - only internal structure affected

If partial rollback needed:
- Turbo can be removed by deleting `turbo.json` and reverting `package.json` scripts
- Package consolidation can be reverted by restoring old packages from git history
- API restructure can be reverted by moving files back to flat structure
- Seed changes can be reverted by restoring old seed file

---

## 8. Future Considerations

### After This Refactor

**Module expansion:**
- Add new domains following the same pattern (projects, teams, etc.)
- Each module self-contained with handlers/service/repository/routes

**Service layer enhancements:**
- Add transaction support examples
- Add cross-domain orchestration examples
- Add event-driven patterns

**Shared package growth:**
- Add domain events to `shared/events/`
- Add common errors to `shared/errors/`
- Add guards to `shared/guards/`

**Turbo optimizations:**
- Enable remote caching for team
- Add more granular tasks
- Optimize cache outputs

### Not Included (Out of Scope)

- RBAC system (permissions, roles, workspace members)
- New features or behavior
- Database schema changes (beyond what better-auth already has)
- Performance optimizations
- Additional testing infrastructure

---

## Summary

This design modernizes stackit's internal structure without changing runtime behavior:

1. **Turbo** - Better build orchestration and caching
2. **`shared` package** - Cleaner imports, single package for cross-cutting concerns
3. **Module structure** - Domain-based organization with service layer
4. **Enhanced seeding** - Proper better-auth account seeding with password hashing

**Implementation order:** Bottom-up (infrastructure first)  
**Delivery:** Single PR with all changes  
**Risk:** Low - internal structure only, no behavior changes  

**Key benefits:**
- Scales better as codebase grows
- Easier to onboard new developers
- Clearer separation of concerns
- Industry-standard patterns
