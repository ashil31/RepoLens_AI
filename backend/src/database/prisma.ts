import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const globalForPrisma = global as unknown as {
    prisma: PrismaClient | undefined
}

const connectionString = `${process.env.DATABASE_URL}`
export const pool = new pg.Pool({ 
    connectionString,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
})
const adapter = new PrismaPg(pool)

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
