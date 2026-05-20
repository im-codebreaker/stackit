import type { FastifyReply, FastifyRequest } from 'fastify'
import type { UsersService } from './users.service.js'

export function createUsersHandlers(service: UsersService) {
  return {
    async listUsers(request: FastifyRequest, reply: FastifyReply) {
      const users = await service.listUsers()
      return reply.send(users)
    },

    async getUser(
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply,
    ) {
      try {
        const { id } = request.params
        const user = await service.getUserById(id)
        return reply.send(user)
      }
      catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
          return reply.status(404).send({ error: error.message })
        }
        throw error
      }
    },

    async createUser(
      request: FastifyRequest<{
        Body: { email: string, name: string, emailVerified?: boolean }
      }>,
      reply: FastifyReply,
    ) {
      try {
        const user = await service.createUser(request.body)
        return reply.status(201).send(user)
      }
      catch (error) {
        if (
          error instanceof Error
          && error.message.includes('already exists')
        ) {
          return reply.status(409).send({ error: error.message })
        }
        throw error
      }
    },

    async updateUser(
      request: FastifyRequest<{
        Params: { id: string }
        Body: { name?: string, email?: string }
      }>,
      reply: FastifyReply,
    ) {
      try {
        const { id } = request.params
        const user = await service.updateUser(id, request.body)
        return reply.send(user)
      }
      catch (error) {
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
      reply: FastifyReply,
    ) {
      try {
        const { id } = request.params
        await service.deleteUser(id)
        return reply.status(204).send()
      }
      catch (error) {
        if (error instanceof Error && error.message === 'User not found') {
          return reply.status(404).send({ error: error.message })
        }
        throw error
      }
    },
  }
}
