import type { users } from '../schemas/index.js'
import type { z } from 'zod'

export type User = z.infer<typeof users.UserSchema>
