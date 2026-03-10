import { ConnectionOptions } from "bullmq"
import dotenv from "dotenv"

dotenv.config()

export const redisConfig: ConnectionOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD || undefined,
}

if (process.env.REDIS_URL) {
    const url = new URL(process.env.REDIS_URL)
    redisConfig.host = url.hostname
    redisConfig.port = parseInt(url.port)
    redisConfig.password = url.password || undefined
}
