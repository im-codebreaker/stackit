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
