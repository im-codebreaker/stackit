import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { createUsersRepository } from './users.repository.js'
import { createUsersService } from './users.service.js'
import { createUsersHandlers } from './users.handlers.js'
import { UserSchema, requests } from '@stackit/shared/schemas/users'
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
          200: z.array(UserSchema),
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
          200: UserSchema,
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
        body: requests.CreateUserSchema,
        response: {
          201: UserSchema,
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
        body: requests.UpdateUserSchema,
        response: {
          200: UserSchema,
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
