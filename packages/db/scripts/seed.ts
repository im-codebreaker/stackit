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
