import process from 'node:process'
import { scryptAsync } from '@noble/hashes/scrypt'
import { bytesToHex, randomBytes } from '@noble/hashes/utils'
import { eq } from 'drizzle-orm'
import { createDatabaseClient } from '../src/client.js'
import { accounts } from '../src/schema/auth.js'
import { users } from '../src/schema/users.js'

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
  const devUsersData = [
    {
      email: 'demo@stackit.dev',
      name: 'Demo User',
    },
    {
      email: 'admin@stackit.dev',
      name: 'Admin User',
    },
  ]

  const createdUsers = []
  for (const userData of devUsersData) {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoNothing({ target: users.email })
      .returning()

    if (user) {
      console.log(`  ✓ Created user: ${userData.email}`)
      createdUsers.push(user)
    }
    else {
      // User already exists, fetch it
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
      if (existingUser) {
        console.log(`  ℹ️  User already exists: ${userData.email}`)
        createdUsers.push(existingUser)
      }
    }
  }

  // Seed accounts with passwords
  console.log('\n🔑 Seeding accounts with passwords...')
  for (const user of createdUsers) {
    const accountData = {
      id: `account_${user.email.split('@')[0]}`,
      accountId: user.email, // Use email as accountId for credential provider
      providerId: 'credential',
      userId: user.id,
      password: hashedPassword,
      scope: null,
      accessToken: null,
      refreshToken: null,
      idToken: null,
      accessTokenExpiresAt: null,
      refreshTokenExpiresAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db
      .insert(accounts)
      .values(accountData)
      .onConflictDoNothing({ target: accounts.id })
    console.log(`  ✓ Created account: ${user.email}`)
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
