import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined
    prismaShutdownRegistered?: boolean | undefined
}

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
    throw new Error("DATABASE_URL is not set")
}

const wantsSsl =
    process.env.DATABASE_SSL === "true" ||
    /[?&]sslmode=require/i.test(connectionString) ||
    /[?&]ssl=true/i.test(connectionString)

export const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ...(wantsSsl ? { ssl: { rejectUnauthorized: false } } : {}),
})
// Some environments can end up with slightly different `pg` Pool types (e.g. due to type resolution),
// but the runtime object is compatible with Prisma's adapter.
type PrismaPgPool = ConstructorParameters<typeof PrismaPg>[0]
const adapter = new PrismaPg(pool as unknown as PrismaPgPool)

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"]
    })

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma
}

// Graceful shutdown (important on production platforms)
if (!globalForPrisma.prismaShutdownRegistered) {
    globalForPrisma.prismaShutdownRegistered = true
    const shutdown = async () => {
        try {
            await prisma.$disconnect()
        } finally {
            await pool.end().catch(() => undefined)
        }
    }
    process.once("SIGTERM", () => void shutdown())
    process.once("SIGINT", () => void shutdown())
}
