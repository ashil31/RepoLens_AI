import "dotenv/config"

export const config = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || "development",
    BASE_PATH: "/api",
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "*",
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_secret",
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "30d",
    DATABASE_URL: process.env.DATABASE_URL || ""
}
