import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'

const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: z.object({ status: z.literal('ok') }),
        },
      },
    },
    async (request, reply) => {
      return reply.send({ status: 'ok' })
    }
  )
}

export default healthRoutes
export const autoPrefix = '/health'
