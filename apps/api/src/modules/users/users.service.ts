import type { DatabaseClient } from '@stackit/db'
import type { UsersRepository } from './users.repository.js'

export function createUsersService(
  repository: UsersRepository,
  _db: DatabaseClient,
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

    async createUser(data: { email: string, name: string, emailVerified?: boolean }) {
      // Business logic: check for duplicates
      const existing = await repository.findByEmail(data.email)
      if (existing) {
        throw new Error('User with this email already exists')
      }

      return repository.create(data)
    },

    async updateUser(id: string, data: { name?: string, email?: string }) {
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
