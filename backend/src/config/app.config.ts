import "dotenv/config"

/** Parse expiry string (e.g. "15m", "30d") to milliseconds for cookie/DB. */
function parseExpiryToMs(expiry: string): number {
    const match = expiry.trim().match(/^(\d+)(d|h|m|s)$/i)
    if (!match) return 30 * 24 * 60 * 60 * 1000 // default 30 days
    const value = parseInt(match[1], 10)
    const unit = match[2].toLowerCase()
    if (unit === "d") return value * 24 * 60 * 60 * 1000
    if (unit === "h") return value * 60 * 60 * 1000
    if (unit === "m") return value * 60 * 1000
    return value * 1000
}

const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m"
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d"

export const config = {
    PORT: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || "development",
    BASE_PATH: "/api",
    FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:3000", // must be a specific origin when using credentials (cookies)
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret",
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_secret",
    JWT_ACCESS_EXPIRES_IN: accessExpiresIn,
    JWT_REFRESH_EXPIRES_IN: refreshExpiresIn,
    /** Refresh token expiry in milliseconds (for cookie maxAge and DB expiresAt). */
    JWT_REFRESH_EXPIRES_MS: parseExpiryToMs(refreshExpiresIn),
    DATABASE_URL: process.env.DATABASE_URL || "",

    // GitHub App (Module 4)
    GITHUB_APP_ID: process.env.GITHUB_APP_ID || "",
    GITHUB_PRIVATE_KEY: process.env.GITHUB_PRIVATE_KEY || "",
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET || "",
    GITHUB_APP_INSTALL_URL: process.env.GITHUB_APP_INSTALL_URL || "https://github.com/apps/repolens-dev/installations/new",
    GITHUB_APP_CALLBACK_URL: process.env.GITHUB_APP_CALLBACK_URL || "http://localhost:3000/github/callback",
    REPO_CLONE_DIR: process.env.REPO_CLONE_DIR || "",
    REPO_CLONE_TIMEOUT_MS: process.env.REPO_CLONE_TIMEOUT ? parseInt(process.env.REPO_CLONE_TIMEOUT, 10) : 120_000
}
