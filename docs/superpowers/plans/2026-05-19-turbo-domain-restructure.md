# Turbo + Domain Restructure + Better-Auth Seeding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize stackit's internal structure with Turborepo, consolidated packages, domain-based modules with service layer, and proper better-auth seeding.

**Architecture:** Bottom-up approach - infrastructure first (Turbo), then package consolidation, then API restructure, then seed enhancement. Single PR with all changes. No runtime behavior changes, only internal structure improvements.

**Tech Stack:** Turborepo 2.3.3, Drizzle ORM, Fastify 5, Vue 3, Zod v4, @noble/hashes for password hashing

---

## Phase 1: Turbo Configuration

### Task 1: Add Turbo Configuration File

**Files:**
- Create: `turbo.json`

- [ ] **Step 1: Create turbo.json with task definitions**

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

- [ ] **Step 2: Commit turbo.json**

```bash
git add turbo.json
git commit -m "build: add Turborepo configuration"
```

---

### Task 2: Update Root Package.json for Turbo

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add turbo devDependency**

In `package.json`, add to `devDependencies`:

```json
{
  "devDependencies": {
    "@clack/prompts": "^0.11.0",
    "@types/node": "^24.12.2",
    "tsx": "^4.20.6",
    "turbo": "^2.3.3",
    "typescript": "^5.9.3",
    "yaml": "^2.7.0"
  }
}
```

- [ ] **Step 2: Update scripts to use turbo**

Replace the `scripts` section in `package.json`:

```json
{
  "scripts": {
    "setup": "tsx scripts/init.ts",
    "dev": "turbo run dev --parallel",
    "dev:api": "turbo run dev --filter=@stackit/api",
    "dev:web": "turbo run dev --filter=@stackit/web",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint:fix",
    "test": "turbo run test",
    "type-check": "turbo run type-check",
    "db:generate": "turbo run db:generate --filter=@stackit/db",
    "db:migrate": "turbo run db:migrate --filter=@stackit/db",
    "db:push": "turbo run db:push --filter=@stackit/db",
    "db:reset": "turbo run db:reset --filter=@stackit/db",
    "db:seed": "turbo run db:seed --filter=@stackit/db",
    "db:studio": "turbo run db:studio --filter=@stackit/db"
  }
}
```

- [ ] **Step 3: Install dependencies**

```bash
pnpm install
```

Expected: turbo installed, lockfile updated

- [ ] **Step 4: Verify turbo works**

```bash
pnpm type-check
```

Expected: Turbo runs type-check across workspace, no errors

- [ ] **Step 5: Commit package.json changes**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: integrate Turborepo for task orchestration"
```

---

## Phase 2: Package Consolidation (shared)

### Task 3: Create Shared Package Structure

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/schemas/index.ts`
- Create: `packages/shared/src/types/index.ts`
- Create: `packages/shared/src/utils/index.ts`
- Create: `packages/shared/src/constants/index.ts`
- Create: `packages/shared/src/enums/index.ts`
- Create: `packages/shared/src/errors/index.ts`
- Create: `packages/shared/src/guards/index.ts`

- [ ] **Step 1: Create shared package directory**

```bash
mkdir -p packages/shared/src/{schemas,types,utils,constants,enums,errors,guards}
```

- [ ] **Step 2: Create package.json**

Create `packages/shared/package.json`:

```json
{
  "name": "@stackit/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
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
  },
  "dependencies": {
    "zod": "^4.1.0"
  },
  "devDependencies": {
    "@stackit/eslint-config": "workspace:*",
    "@stackit/tsconfig": "workspace:*",
    "typescript": "^5.9.3"
  }
}
```

- [ ] **Step 3: Create tsconfig.json**

Create `packages/shared/tsconfig.json`:

```json
{
  "extends": "@stackit/tsconfig/base.json",
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create placeholder barrel exports**

Create `packages/shared/src/index.ts`:

```typescript
export * from './schemas/index.js'
export * from './types/index.js'
export * from './utils/index.js'
export * from './constants/index.js'
export * from './enums/index.js'
export * from './errors/index.js'
export * from './guards/index.js'
```

Create `packages/shared/src/schemas/index.ts`:

```typescript
// Will be populated from validations package
```

Create `packages/shared/src/types/index.ts`:

```typescript
// Will be populated from types package
```

Create `packages/shared/src/utils/index.ts`:

```typescript
// Will be populated from helpers package
```

Create `packages/shared/src/constants/index.ts`:

```typescript
// Placeholder for future constants
```

Create `packages/shared/src/enums/index.ts`:

```typescript
// Placeholder for future enums
```

Create `packages/shared/src/errors/index.ts`:

```typescript
// Placeholder for future error classes
```

Create `packages/shared/src/guards/index.ts`:

```typescript
// Placeholder for future type guards
```

- [ ] **Step 5: Install dependencies**

```bash
pnpm install
```

Expected: Shared package added to workspace

- [ ] **Step 6: Commit shared package structure**

```bash
git add packages/shared/
git commit -m "feat(shared): create shared package structure"
```

---

### Task 4: Migrate Validations to Shared

**Files:**
- Move: `packages/validations/src/**/*` → `packages/shared/src/schemas/`
- Modify: `packages/shared/src/schemas/index.ts`

- [ ] **Step 1: Copy validations content to shared/schemas**

```bash
cp -r packages/validations/src/* packages/shared/src/schemas/
```

- [ ] **Step 2: Update internal imports in schemas**

In all files under `packages/shared/src/schemas/`, update any relative imports that reference other schema files to use correct paths (should already be relative, so likely no changes needed).

- [ ] **Step 3: Verify schemas structure**

```bash
ls -la packages/shared/src/schemas/
```

Expected: `env/`, `shared/`, `users/`, `index.ts` directories/files present

- [ ] **Step 4: Commit migrated schemas**

```bash
git add packages/shared/src/schemas/
git commit -m "refactor(shared): migrate validations to shared/schemas"
```

---

### Task 5: Migrate Types to Shared

**Files:**
- Move: `packages/types/src/**/*` → `packages/shared/src/types/`
- Modify: `packages/shared/src/types/index.ts`

- [ ] **Step 1: Copy types content to shared/types**

```bash
cp -r packages/types/src/* packages/shared/src/types/
```

- [ ] **Step 2: Verify types structure**

```bash
ls -la packages/shared/src/types/
```

Expected: `api.ts`, `index.ts` files present

- [ ] **Step 3: Commit migrated types**

```bash
git add packages/shared/src/types/
git commit -m "refactor(shared): migrate types to shared/types"
```

---

### Task 6: Migrate Helpers to Shared

**Files:**
- Move: `packages/helpers/src/**/*` → `packages/shared/src/utils/`
- Modify: `packages/shared/src/utils/index.ts`

- [ ] **Step 1: Copy helpers content to shared/utils**

```bash
cp -r packages/helpers/src/* packages/shared/src/utils/
```

- [ ] **Step 2: Verify utils structure**

```bash
ls -la packages/shared/src/utils/
```

Expected: utility files and `index.ts` present

- [ ] **Step 3: Commit migrated utils**

```bash
git add packages/shared/src/utils/
git commit -m "refactor(shared): migrate helpers to shared/utils"
```

---

### Task 7: Update Imports in API Package

**Files:**
- Modify: All files in `apps/api/src/` that import from old packages

- [ ] **Step 1: Update validations imports to shared/schemas**

```bash
# Find and replace across API
find apps/api/src -type f -name "*.ts" -exec sed -i '' 's/@stackit\/validations/@stackit\/shared\/schemas/g' {} +
```

- [ ] **Step 2: Update types imports to shared/types**

```bash
find apps/api/src -type f -name "*.ts" -exec sed -i '' 's/@stackit\/types/@stackit\/shared\/types/g' {} +
```

- [ ] **Step 3: Update helpers imports to shared/utils**

```bash
find apps/api/src -type f -name "*.ts" -exec sed -i '' 's/@stackit\/helpers/@stackit\/shared\/utils/g' {} +
```

- [ ] **Step 4: Update API package.json dependencies**

In `apps/api/package.json`, remove old dependencies and add shared:

```json
{
  "dependencies": {
    "@stackit/auth": "workspace:*",
    "@stackit/cache": "workspace:*",
    "@stackit/db": "workspace:*",
    "@stackit/shared": "workspace:*"
  }
}
```

(Remove: `@stackit/validations`, `@stackit/types`, `@stackit/helpers`)

- [ ] **Step 5: Run pnpm install**

```bash
pnpm install
```

- [ ] **Step 6: Verify type-check passes**

```bash
pnpm --filter @stackit/api run type-check
```

Expected: No type errors

- [ ] **Step 7: Commit API import updates**

```bash
git add apps/api/
git commit -m "refactor(api): update imports to use @stackit/shared"
```

---

### Task 8: Update Imports in Web Package

**Files:**
- Modify: All files in `apps/web/src/` that import from old packages

- [ ] **Step 1: Update validations imports to shared/schemas**

```bash
find apps/web/src -type f \( -name "*.ts" -o -name "*.vue" \) -exec sed -i '' 's/@stackit\/validations/@stackit\/shared\/schemas/g' {} +
```

- [ ] **Step 2: Update types imports to shared/types**

```bash
find apps/web/src -type f \( -name "*.ts" -o -name "*.vue" \) -exec sed -i '' 's/@stackit\/types/@stackit\/shared\/types/g' {} +
```

- [ ] **Step 3: Update helpers imports to shared/utils**

```bash
find apps/web/src -type f \( -name "*.ts" -o -name "*.vue" \) -exec sed -i '' 's/@stackit\/helpers/@stackit\/shared\/utils/g' {} +
```

- [ ] **Step 4: Update Web package.json dependencies**

In `apps/web/package.json`, remove old dependencies and add shared:

```json
{
  "dependencies": {
    "@stackit/auth": "workspace:*",
    "@stackit/shared": "workspace:*"
  }
}
```

(Remove: `@stackit/validations`, `@stackit/types`, `@stackit/helpers`)

- [ ] **Step 5: Run pnpm install**

```bash
pnpm install
```

- [ ] **Step 6: Verify type-check passes**

```bash
pnpm --filter @stackit/web run type-check
```

Expected: No type errors

- [ ] **Step 7: Commit Web import updates**

```bash
git add apps/web/
git commit -m "refactor(web): update imports to use @stackit/shared"
```

---

### Task 9: Update Imports in DB Package

**Files:**
- Modify: Files in `packages/db/src/` and `packages/db/scripts/` that import from old packages

- [ ] **Step 1: Check for old package imports**

```bash
grep -r "@stackit/validations\|@stackit/types\|@stackit/helpers" packages/db/src/ packages/db/scripts/ || echo "No imports to update"
```

- [ ] **Step 2: Update any found imports**

If any imports found, update them:
- `@stackit/validations` → `@stackit/shared/schemas`
- `@stackit/types` → `@stackit/shared/types`
- `@stackit/helpers` → `@stackit/shared/utils`

- [ ] **Step 3: Update DB package.json if needed**

Check `packages/db/package.json` and update dependencies if old packages were referenced.

- [ ] **Step 4: Commit if changes made**

```bash
git add packages/db/
git commit -m "refactor(db): update imports to use @stackit/shared" || echo "No changes needed"
```

---

### Task 10: Update Imports in Auth Package

**Files:**
- Modify: Files in `packages/auth/src/` that import from old packages

- [ ] **Step 1: Check for old package imports**

```bash
grep -r "@stackit/validations\|@stackit/types\|@stackit/helpers" packages/auth/src/ || echo "No imports to update"
```

- [ ] **Step 2: Update any found imports**

If any imports found, update them:
- `@stackit/validations` → `@stackit/shared/schemas`
- `@stackit/types` → `@stackit/shared/types`
- `@stackit/helpers` → `@stackit/shared/utils`

- [ ] **Step 3: Update Auth package.json if needed**

Check `packages/auth/package.json` and update dependencies if old packages were referenced.

- [ ] **Step 4: Commit if changes made**

```bash
git add packages/auth/
git commit -m "refactor(auth): update imports to use @stackit/shared" || echo "No changes needed"
```

---

### Task 11: Update Imports in Cache Package

**Files:**
- Modify: Files in `packages/cache/src/` that import from old packages

- [ ] **Step 1: Check for old package imports**

```bash
grep -r "@stackit/validations\|@stackit/types\|@stackit/helpers" packages/cache/src/ || echo "No imports to update"
```

- [ ] **Step 2: Update any found imports**

If any imports found, update them:
- `@stackit/validations` → `@stackit/shared/schemas`
- `@stackit/types` → `@stackit/shared/types`
- `@stackit/helpers` → `@stackit/shared/utils`

- [ ] **Step 3: Update Cache package.json if needed**

Check `packages/cache/package.json` and update dependencies if old packages were referenced.

- [ ] **Step 4: Commit if changes made**

```bash
git add packages/cache/
git commit -m "refactor(cache): update imports to use @stackit/shared" || echo "No changes needed"
```

---

### Task 12: Delete Old Packages

**Files:**
- Delete: `packages/helpers/`
- Delete: `packages/validations/`
- Delete: `packages/types/`

- [ ] **Step 1: Verify no remaining imports of old packages**

```bash
grep -r "@stackit/validations\|@stackit/types\|@stackit/helpers" apps/ packages/ --exclude-dir=node_modules || echo "All imports updated"
```

Expected: No matches found

- [ ] **Step 2: Delete old package directories**

```bash
rm -rf packages/helpers packages/validations packages/types
```

- [ ] **Step 3: Run pnpm install to clean workspace**

```bash
pnpm install
```

- [ ] **Step 4: Verify workspace type-check**

```bash
pnpm type-check
```

Expected: No errors, all packages type-check successfully

- [ ] **Step 5: Commit deletion**

```bash
git add packages/
git commit -m "refactor: remove old packages (helpers, validations, types)"
```

---

## Phase 3: API Module Restructure

### Task 13: Create Users Module Directory

**Files:**
- Create: `apps/api/src/modules/users/`

- [ ] **Step 1: Create module directory**

```bash
mkdir -p apps/api/src/modules/users
```

- [ ] **Step 2: Commit directory structure**

```bash
git add apps/api/src/modules/
git commit -m "feat(api): create modules directory structure"
```

---

### Task 14: Create Users Repository

**Files:**
- Create: `apps/api/src/modules/users/users.repository.ts`
- Modify (reference): `apps/api/src/repositories/users.ts` (will be moved)

- [ ] **Step 1: Create users.repository.ts with transaction support**

Create `apps/api/src/modules/users/users.repository.ts`:

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

    async list(tx?: DatabaseClient) {
      const client = tx ?? db
      return client.query.users.findMany()
    },

    async create(data: typeof users.$inferInsert, tx?: DatabaseClient) {
      const client = tx ?? db
      const [user] = await client.insert(users).values(data).returning()
      return user
    },

    async update(
      id: string,
      data: Partial<typeof users.$inferInsert>,
      tx?: DatabaseClient
    ) {
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

- [ ] **Step 2: Commit users repository**

```bash
git add apps/api/src/modules/users/users.repository.ts
git commit -m "feat(api): add users repository with transaction support"
```

---

### Task 15: Create Users Service (NEW)

**Files:**
- Create: `apps/api/src/modules/users/users.service.ts`

- [ ] **Step 1: Create users.service.ts with business logic**

Create `apps/api/src/modules/users/users.service.ts`:

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

    async listUsers() {
      return repository.list()
    },

    async createUser(data: { email: string; name: string; emailVerified?: boolean }) {
      // Business logic: check for duplicates
      const existing = await repository.findByEmail(data.email)
      if (existing) {
        throw new Error('User with this email already exists')
      }

      return repository.create(data)
    },

    async updateUser(id: string, data: { name?: string; email?: string }) {
      // Business logic: validate user exists
      const existing = await repository.findById(id)
      if (!existing) {
        throw new Error('User not found')
      }

      // If email is being updated, check for duplicates
      if (data.email && data.email !== existing.email) {
        const emailTaken = await repository.findByEmail(data.email)
        if (emailTaken) {
          throw new Error('Email already in use')
        }
      }

      return repository.update(id, data)
    },

    async deleteUser(id: string) {
      // Business logic: validate user exists
      const existing = await repository.findById(id)
      if (!existing) {
        throw new Error('User not found')
      }

      await repository.delete(id)
    },
  }
}

export type UsersService = ReturnType<typeof createUsersService>
```

- [ ] **Step 2: Commit users service**

```bash
git add apps/api/src/modules/users/users.service.ts
git commit -m "feat(api): add users service layer with business logic"
```

---

### Task 16: Create Users Handlers

**Files:**
- Create: `apps/api/src/modules/users/users.handlers.ts`
- Modify (reference): `apps/api/src/handlers/users.ts` (will be replaced)

- [ ] **Step 1: Create users.handlers.ts using service**

Create `apps/api/src/modules/users/users.handlers.ts`:

```typescript
import type { FastifyRequest, FastifyReply } from 'fastify'
import type { UsersService } from './users.service.js'

export function createUsersHandlers(service: UsersService) {
  return {
    async listUsers(request: FastifyRequest, reply: FastifyReply) {
      try {
        const users = await service.listUsers()
        return reply.send(users)
      } catch (error) {
        throw error
      }
    },

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
      request: FastifyRequest<{
        Body: { email: string; name: string; emailVerified?: boolean }
      }>,
      reply: FastifyReply
    ) {
      try {
        const user = await service.createUser(request.body)
        return reply.status(201).send(user)
      } catch (error) {
        if (
          error instanceof Error &&
          error.message.includes('already exists')
        ) {
          return reply.status(409).send({ error: error.message })
        }
        throw error
      }
    },

    async updateUser(
      request: FastifyRequest<{
        Params: { id: string }
        Body: { name?: string; email?: string }
      }>,
      reply: FastifyReply
    ) {
      try {
        const { id } = request.params
        const user = await service.updateUser(id, request.body)
        return reply.send(user)
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'User not found') {
            return reply.status(404).send({ error: error.message })
          }
          if (error.message === 'Email already in use') {
            return reply.status(409).send({ error: error.message })
          }
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

- [ ] **Step 2: Commit users handlers**

```bash
git add apps/api/src/modules/users/users.handlers.ts
git commit -m "feat(api): add users handlers with HTTP concern handling"
```

---

### Task 17: Create Users Routes

**Files:**
- Create: `apps/api/src/modules/users/users.routes.ts`
- Modify (reference): `apps/api/src/routes/users.ts` (will be replaced)

- [ ] **Step 1: Create users.routes.ts wiring all layers**

Create `apps/api/src/modules/users/users.routes.ts`:

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
import { z } from 'zod'

const usersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  // Initialize layers
  const repository = createUsersRepository(fastify.db)
  const service = createUsersService(repository, fastify.db)
  const handlers = createUsersHandlers(service)

  // List users
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: z.array(userResponseSchema),
        },
      },
    },
    handlers.listUsers
  )

  // Get user by ID
  fastify.get(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          200: userResponseSchema,
        },
      },
    },
    handlers.getUser
  )

  // Create user
  fastify.post(
    '/',
    {
      schema: {
        body: userCreateSchema,
        response: {
          201: userResponseSchema,
        },
      },
    },
    handlers.createUser
  )

  // Update user
  fastify.patch(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        body: userUpdateSchema,
        response: {
          200: userResponseSchema,
        },
      },
    },
    handlers.updateUser
  )

  // Delete user
  fastify.delete(
    '/:id',
    {
      schema: {
        params: z.object({ id: z.string() }),
        response: {
          204: z.null(),
        },
      },
    },
    handlers.deleteUser
  )
}

export default usersRoutes
export const autoPrefix = '/users'
```

- [ ] **Step 2: Commit users routes**

```bash
git add apps/api/src/modules/users/users.routes.ts
git commit -m "feat(api): add users routes with Zod validation"
```

---

### Task 18: Update Fastify Autoload Configuration

**Files:**
- Modify: `apps/api/src/server.ts`

- [ ] **Step 1: Read current server.ts autoload configuration**

```bash
grep -A 5 "AutoLoad" apps/api/src/server.ts
```

- [ ] **Step 2: Update autoload to scan modules directory**

In `apps/api/src/server.ts`, find the autoload registration for routes and update it:

**Before:**
```typescript
await app.register(AutoLoad, {
  dir: join(__dirname, 'routes'),
  options: { prefix: '/api' },
})
```

**After:**
```typescript
await app.register(AutoLoad, {
  dir: join(__dirname, 'modules'),
  dirNameRoutePrefix: false,
  matchFilter: (path) =>
    path.endsWith('.routes.js') || path.endsWith('.routes.ts'),
  options: { prefix: '/api' },
})
```

- [ ] **Step 3: Commit server.ts changes**

```bash
git add apps/api/src/server.ts
git commit -m "refactor(api): update autoload to scan modules directory"
```

---

### Task 19: Remove Old API Structure

**Files:**
- Delete: `apps/api/src/handlers/`
- Delete: `apps/api/src/repositories/`
- Delete: `apps/api/src/routes/`
- Delete: `apps/api/src/plugins/app/repositories.ts`

- [ ] **Step 1: Delete old handlers directory**

```bash
rm -rf apps/api/src/handlers
```

- [ ] **Step 2: Delete old repositories directory**

```bash
rm -rf apps/api/src/repositories
```

- [ ] **Step 3: Delete old routes directory**

```bash
rm -rf apps/api/src/routes
```

- [ ] **Step 4: Delete repositories plugin**

```bash
rm -f apps/api/src/plugins/app/repositories.ts
```

- [ ] **Step 5: Update API type declarations**

Check `apps/api/src/types/fastify.d.ts` and remove any repository decorators (e.g., `usersRepository`). Repository instances are now created in modules, not globally decorated.

Example - **Remove** lines like:
```typescript
usersRepository: UsersRepository
```

- [ ] **Step 6: Verify API type-check**

```bash
pnpm --filter @stackit/api run type-check
```

Expected: No errors

- [ ] **Step 7: Commit removal of old structure**

```bash
git add apps/api/src/
git commit -m "refactor(api): remove old flat structure (handlers, repositories, routes)"
```

---

### Task 20: Verify API Works

**Files:**
- Test: API server startup and routes

- [ ] **Step 1: Build API**

```bash
pnpm --filter @stackit/api run build
```

Expected: Build succeeds without errors

- [ ] **Step 2: Start infrastructure**

```bash
docker compose up -d postgres redis
```

Expected: Postgres and Redis containers running

- [ ] **Step 3: Push database schema**

```bash
pnpm db:push
```

Expected: Schema pushed successfully

- [ ] **Step 4: Start API in dev mode**

```bash
pnpm dev:api
```

Expected: API starts on port 3000 without errors

- [ ] **Step 5: Test users list endpoint**

In another terminal:
```bash
curl http://localhost:3000/api/users
```

Expected: HTTP 200 with empty array `[]` or existing users

- [ ] **Step 6: Stop API**

Press Ctrl+C to stop the dev server

- [ ] **Step 7: Commit verification note**

```bash
git commit --allow-empty -m "test(api): verify module structure works correctly"
```

---

## Phase 4: Seed File Enhancement

### Task 21: Add Password Hashing Dependency

**Files:**
- Modify: `packages/db/package.json`

- [ ] **Step 1: Add @noble/hashes dependency**

In `packages/db/package.json`, add to `dependencies`:

```json
{
  "dependencies": {
    "@noble/hashes": "^1.6.2",
    "drizzle-orm": "^0.46.0",
    "postgres": "^3.4.7"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
pnpm install
```

Expected: @noble/hashes installed

- [ ] **Step 3: Commit package.json update**

```bash
git add packages/db/package.json pnpm-lock.yaml
git commit -m "feat(db): add @noble/hashes for password hashing"
```

---

### Task 22: Update Seed File with Better-Auth Support

**Files:**
- Modify: `packages/db/scripts/seed.ts`

- [ ] **Step 1: Replace seed.ts content**

Replace entire `packages/db/scripts/seed.ts` with:

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

- [ ] **Step 2: Commit updated seed file**

```bash
git add packages/db/scripts/seed.ts
git commit -m "feat(db): add better-auth account seeding with scrypt password hashing"
```

---

### Task 23: Test Seed File

**Files:**
- Test: Run seed and verify accounts created

- [ ] **Step 1: Reset database**

```bash
pnpm db:reset
```

Expected: Database reset and schema pushed

- [ ] **Step 2: Run seed**

```bash
pnpm db:seed
```

Expected output:
```
🌱 Seeding development database...

👥 Seeding users...
  ✓ Created user: demo@stackit.dev
  ✓ Created user: admin@stackit.dev

🔑 Seeding accounts with passwords...
  ✓ Created account: user_demo
  ✓ Created account: user_admin

  ℹ️  Default password for all dev accounts: password123

✅ Database seeding completed!
```

- [ ] **Step 3: Verify users in database**

```bash
pnpm db:studio
```

Open Drizzle Studio, check:
- `users` table has 2 records
- `accounts` table has 2 records with hashed passwords

- [ ] **Step 4: Commit verification note**

```bash
git commit --allow-empty -m "test(db): verify seed creates users and accounts correctly"
```

---

## Phase 5: Documentation Updates

### Task 24: Update README with Git Remote Instructions

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update Quickstart section**

In `README.md`, find the Quickstart section and update it:

**Before:**
```markdown
```bash
git clone git@github.com:im-codebreaker/stackit.git my-app
cd my-app
pnpm install
pnpm setup
```

**After:**
```markdown
```bash
git clone git@github.com:im-codebreaker/stackit.git my-app
cd my-app

# Update git remote to your own repo (optional)
git remote set-url origin git@github.com:your-username/my-app.git
# OR remove the origin entirely and add your own later
# git remote remove origin

pnpm install
pnpm setup                              # interactive — pick optional modules + project name
```

- [ ] **Step 2: Update Structure section for shared package**

In `README.md`, find the Structure section and update packages:

**Before:**
```markdown
├── packages/
│   ├── validations/            @stackit/validations — Zod schemas (source of truth)
│   ├── types/                  @stackit/types       — pure TS types & API envelopes
│   ├── db/                     @stackit/db          — Drizzle client + schema
│   ├── cache/                  @stackit/cache       — Redis client (optional)
│   ├── auth/                   @stackit/auth        — better-auth wrapper (optional)
│   ├── helpers/                @stackit/helpers     — shared utilities
```

**After:**
```markdown
├── packages/
│   ├── shared/                 @stackit/shared      — Zod schemas, types, utilities
│   ├── db/                     @stackit/db          — Drizzle client + schema
│   ├── cache/                  @stackit/cache       — Redis client (optional)
│   ├── auth/                   @stackit/auth        — better-auth wrapper (optional)
```

- [ ] **Step 3: Update Validation flow section**

In `README.md`, update the validation flow example:

**Before:**
```typescript
// packages/validations/src/users/requests.ts
export const CreateUserSchema = z.object({ email: z.email(), name: z.string().min(1) })

// apps/api/src/routes/users.ts
fastify.post('/', { schema: users.routes.createUserRoute }, handlers.create)

// apps/web/src/views/UsersView.vue
const { form, errors, validate } = useZodForm(users.requests.CreateUserSchema, { email: '', name: '' })
```

**After:**
```typescript
// packages/shared/src/schemas/users/requests.ts
export const CreateUserSchema = z.object({ email: z.email(), name: z.string().min(1) })

// apps/api/src/modules/users/users.routes.ts
fastify.post('/', { schema: { body: userCreateSchema } }, handlers.createUser)

// apps/web/src/views/UsersView.vue
const { form, errors, validate } = useZodForm(userCreateSchema, { email: '', name: '' })
```

- [ ] **Step 4: Update Tooling line in Stack table**

In the Stack table at the top, update Tooling:

**Before:**
```markdown
| Tooling      | TypeScript, ESLint (antfu), Vitest, Docker, Traefik          |
```

**After:**
```markdown
| Tooling      | Turborepo, TypeScript, ESLint (antfu), Vitest, Docker, Traefik |
```

- [ ] **Step 5: Update Architecture choices section**

Add a bullet about the module structure:

**Add:**
```markdown
- **Module-based API** — domains live in `apps/api/src/modules/{domain}/` with handlers, services, repositories, and routes. Service layer contains business logic, repositories handle data access with optional transaction support.
```

Update the repository pattern bullet:

**Before:**
```markdown
- **Repository pattern** — handlers receive repositories via DI, repositories take an optional `tx` for Drizzle transactions.
```

**After:**
```markdown
- **Service + Repository layers** — handlers call services for business logic, services call repositories for data access. All repository methods accept optional `tx` parameter for Drizzle transactions.
```

- [ ] **Step 6: Commit README updates**

```bash
git add README.md
git commit -m "docs: update README for Turbo, shared package, and module structure"
```

---

### Task 25: Update CLAUDE.md

**Files:**
- Modify: `.claude/CLAUDE.md`

- [ ] **Step 1: Update Tech Stack table**

In `.claude/CLAUDE.md`, find the Tech Stack table and update:

**Before:**
```markdown
| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| Tooling      | TypeScript, ESLint (antfu), Vitest, Docker                   |
```

**After:**
```markdown
| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| Tooling      | Turborepo, TypeScript, ESLint (antfu), Vitest, Docker        |
```

- [ ] **Step 2: Update Monorepo Structure**

Find the monorepo structure section and update packages:

**Before:**
```markdown
├── packages/
│   ├── validations/            # @stackit/validations - Zod schemas (SOURCE OF TRUTH)
│   ├── types/                  # @stackit/types - pure TS types & API envelopes
│   ├── db/                     # @stackit/db - Drizzle client + schema
│   ├── cache/                  # @stackit/cache - Redis client (optional)
│   ├── auth/                   # @stackit/auth - better-auth wrapper (optional)
│   ├── helpers/                # @stackit/helpers - shared utilities
```

**After:**
```markdown
├── packages/
│   ├── shared/                 # @stackit/shared - Zod schemas, types, utilities, errors, guards
│   ├── db/                     # @stackit/db - Drizzle client + schema
│   ├── cache/                  # @stackit/cache - Redis client (optional)
│   ├── auth/                   # @stackit/auth - better-auth wrapper (optional)
```

- [ ] **Step 3: Update Development Commands**

Add Turbo-specific commands explanation:

**Add after the commands list:**
```markdown
All commands use Turborepo for task orchestration. Turbo provides:
- Parallel execution with dependency tracking
- Incremental builds (only rebuild what changed)
- Task caching for faster feedback
- Filtered execution (e.g., `--filter @stackit/api`)
```

- [ ] **Step 4: Update Backend Patterns section**

Add a new subsection for the module structure:

**Add:**
```markdown
### Module Structure

API follows a domain-based module pattern. Each domain lives in `apps/api/src/modules/{domain}/`:

```
modules/
└── users/
    ├── users.handlers.ts      # HTTP handlers
    ├── users.service.ts       # Business logic
    ├── users.repository.ts    # Data access
    └── users.routes.ts        # Route definitions
```

**Layer responsibilities:**
- **Routes** — Wire up handlers/services/repositories, define Zod validation schemas
- **Handlers** — HTTP concerns (parse request, format response, status codes, error mapping)
- **Services** — Business logic (validation, orchestration, side effects, transactions)
- **Repositories** — Data access (Drizzle queries, accept optional `tx` for transactions)

**Pattern:**
```typescript
// Repository
export function createUsersRepository(db: DatabaseClient) {
  return {
    async findById(id: string, tx?: DatabaseClient) {
      const client = tx ?? db
      return client.query.users.findFirst({ where: eq(users.id, id) })
    }
  }
}

// Service
export function createUsersService(repository: UsersRepository, db: DatabaseClient) {
  return {
    async getUserById(id: string) {
      const user = await repository.findById(id)
      if (!user) throw new Error('User not found')
      return user
    }
  }
}

// Handler
export function createUsersHandlers(service: UsersService) {
  return {
    async getUser(request, reply) {
      try {
        const { id } = request.params
        const user = await service.getUserById(id)
        return reply.send(user)
      } catch (error) {
        if (error.message === 'User not found') {
          return reply.status(404).send({ error: error.message })
        }
        throw error
      }
    }
  }
}

// Routes
const usersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const repository = createUsersRepository(fastify.db)
  const service = createUsersService(repository, fastify.db)
  const handlers = createUsersHandlers(service)
  
  fastify.get('/:id', { schema: { ... } }, handlers.getUser)
}

export default usersRoutes
export const autoPrefix = '/users'
```
```

- [ ] **Step 5: Update Routes & Handlers & Repositories section**

**Replace the entire section with:**
```markdown
### Module Pattern

See "Module Structure" section above. Each domain is self-contained in `apps/api/src/modules/{domain}/` with all files colocated.

**Removing a domain:** Delete the module directory.

**Adding a new domain:** Copy an existing module (e.g., `users/`) and adapt the files.
```

- [ ] **Step 6: Update Validation section imports**

Update import examples:

**Before:**
```markdown
- Zod schemas live in `packages/validations/src/<feature>/` and are imported by both api and web.
```

**After:**
```markdown
- Zod schemas live in `packages/shared/src/schemas/<feature>/` and are imported by both api and web.
```

- [ ] **Step 7: Commit CLAUDE.md updates**

```bash
git add .claude/CLAUDE.md
git commit -m "docs: update CLAUDE.md for Turbo and module structure"
```

---

### Task 26: Update Architecture Documentation

**Files:**
- Modify: `.claude/docs/architecture.md` (if exists)

- [ ] **Step 1: Check if architecture.md exists**

```bash
ls .claude/docs/architecture.md
```

- [ ] **Step 2: If exists, update package structure and API structure**

Update any references to:
- Old packages (validations, types, helpers) → shared
- Old API structure (flat handlers/routes/repositories) → modules
- Add Turbo to tooling section

- [ ] **Step 3: Commit if changes made**

```bash
git add .claude/docs/architecture.md
git commit -m "docs: update architecture.md for new structure" || echo "No architecture.md to update"
```

---

### Task 27: Update Style Guide

**Files:**
- Modify: `.claude/docs/style-guide.md` (if exists)

- [ ] **Step 1: Check if style-guide.md exists**

```bash
ls .claude/docs/style-guide.md
```

- [ ] **Step 2: If exists, update import examples and API patterns**

Update any code examples that reference:
- `@stackit/validations` → `@stackit/shared/schemas`
- `@stackit/types` → `@stackit/shared/types`
- `@stackit/helpers` → `@stackit/shared/utils`
- Old API structure → module structure

- [ ] **Step 3: Commit if changes made**

```bash
git add .claude/docs/style-guide.md
git commit -m "docs: update style-guide.md import examples" || echo "No style-guide.md to update"
```

---

### Task 28: Update Specialized Agents

**Files:**
- Modify: `.claude/agents/drizzle-expert.md`
- Modify: `.claude/agents/fastify-expert.md`
- Modify: `.claude/agents/javascript-expert.md` (if mentions packages)

- [ ] **Step 1: Update drizzle-expert.md**

Update repository patterns to mention:
- Transaction support with optional `tx` parameter
- Repository creation in modules (not global decorators)

```bash
# Check if file exists and needs updates
grep -l "repository\|Repository" .claude/agents/drizzle-expert.md || echo "No updates needed"
```

If updates needed, add a note about transaction support pattern.

- [ ] **Step 2: Update fastify-expert.md**

Update to mention:
- Module structure (modules/{domain}/*.ts)
- Service layer pattern
- Autoload configuration for modules

```bash
# Check if file mentions old structure
grep -l "handlers\|routes" .claude/agents/fastify-expert.md || echo "No updates needed"
```

If updates needed, document the module pattern.

- [ ] **Step 3: Update javascript-expert.md if needed**

Check if it mentions package structure:

```bash
grep -l "@stackit/validations\|@stackit/types\|@stackit/helpers" .claude/agents/javascript-expert.md || echo "No updates needed"
```

If found, update to use `@stackit/shared/*`.

- [ ] **Step 4: Commit agent updates**

```bash
git add .claude/agents/
git commit -m "docs: update agent documentation for new structure" || echo "No agent updates needed"
```

---

## Phase 6: Final Verification

### Task 29: Verify Full Build

**Files:**
- Test: Full workspace build

- [ ] **Step 1: Clean any build artifacts**

```bash
pnpm -r exec rm -rf dist .turbo node_modules/.cache
```

- [ ] **Step 2: Run full workspace type-check**

```bash
pnpm type-check
```

Expected: All packages type-check successfully with no errors

- [ ] **Step 3: Run full workspace build**

```bash
pnpm build
```

Expected: All apps build successfully

- [ ] **Step 4: Run lint**

```bash
pnpm lint
```

Expected: No lint errors

- [ ] **Step 5: Commit verification note**

```bash
git commit --allow-empty -m "test: verify full workspace build passes"
```

---

### Task 30: End-to-End Integration Test

**Files:**
- Test: Complete stack with seed data and authentication

- [ ] **Step 1: Stop any running services**

```bash
docker compose down
```

- [ ] **Step 2: Start infrastructure**

```bash
docker compose up -d postgres redis
```

Expected: Postgres and Redis running

- [ ] **Step 3: Push database schema**

```bash
pnpm db:push
```

Expected: Schema pushed successfully

- [ ] **Step 4: Run seed**

```bash
pnpm db:seed
```

Expected: Users and accounts created with passwords

- [ ] **Step 5: Start dev servers**

```bash
pnpm dev
```

Expected: API on :3000, Web on :5173, both start without errors

- [ ] **Step 6: Test API users endpoint**

In another terminal:
```bash
curl http://localhost:3000/api/users
```

Expected: HTTP 200 with array of 2 users

- [ ] **Step 7: Test Web app loads**

Open browser to `http://localhost:5173`

Expected: Web app loads without console errors

- [ ] **Step 8: Test login with seeded account**

Navigate to login page and test:
- Email: `demo@stackit.dev`
- Password: `password123`

Expected: Login succeeds

- [ ] **Step 9: Stop services**

```bash
# Stop dev servers (Ctrl+C)
docker compose down
```

- [ ] **Step 10: Commit final verification**

```bash
git commit --allow-empty -m "test: verify end-to-end integration passes"
```

---

## Completion

All tasks complete! The modernization includes:

✅ **Turbo** - Build orchestration with caching  
✅ **Shared package** - Consolidated schemas, types, utilities  
✅ **Module structure** - Domain-based API with service layer  
✅ **Better-auth seeding** - Proper password hashing with scrypt  
✅ **Documentation** - Updated README, CLAUDE.md, and agent docs

**Test accounts:**
- `demo@stackit.dev` / `password123`
- `admin@stackit.dev` / `password123`

**Next steps:**
- Create PR with all commits
- Review changes
- Merge to main
