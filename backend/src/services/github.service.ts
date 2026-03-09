import { createAppAuth } from "@octokit/auth-app"
import { Octokit } from "@octokit/rest"
import { createHmac, timingSafeEqual } from "crypto"
import { config } from "../config/app.config"

const appId = config.GITHUB_APP_ID
const privateKey = config.GITHUB_PRIVATE_KEY
    ? config.GITHUB_PRIVATE_KEY.replace(/\\n/g, "\n")
    : ""

const auth = appId && privateKey
    ? createAppAuth({ appId, privateKey })
    : null

/**
 * Generate a JWT for the GitHub App (used to request installation tokens).
 */
export async function generateAppJWT(): Promise<string> {
    if (!auth) throw new Error("GitHub App not configured (GITHUB_APP_ID, GITHUB_PRIVATE_KEY)")
    const { token } = await auth({ type: "app" })
    return token
}

/**
 * Get a short-lived installation access token. Never store this token.
 */
export async function getInstallationToken(installationId: number): Promise<string> {
    if (!auth) throw new Error("GitHub App not configured")
    const { token } = await auth({
        type: "installation",
        installationId
    })
    return token
}

/**
 * List repositories the installation can access.
 */
export async function getInstallationRepositories(installationId: number) {
    const token = await getInstallationToken(installationId)
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.apps.listReposAccessibleToInstallation()
    return data.repositories
}

/**
 * Get installation metadata (account) from GitHub. Use for install callback.
 */
export async function getInstallationDetails(installationId: number): Promise<{
    accountLogin: string
    accountId: number
}> {
    const token = await generateAppJWT()
    const octokit = new Octokit({ auth: token })
    const { data } = await octokit.apps.getInstallation({ installation_id: installationId })
    const account = data.account as { login?: string; id?: number } | null
    return {
        accountLogin: account?.login ?? "unknown",
        accountId: account?.id ?? 0
    }
}

/**
 * Verify GitHub webhook signature (X-Hub-Signature-256).
 */
export function verifyWebhookSignature(
    payload: Buffer | string,
    signature: string | undefined
): boolean {
    const secret = config.GITHUB_WEBHOOK_SECRET
    if (!secret || !signature) return false
    const payloadBuffer = typeof payload === "string" ? Buffer.from(payload, "utf8") : payload
    const expected = "sha256=" + createHmac("sha256", secret).update(payloadBuffer).digest("hex")
    if (expected.length !== signature.length) return false
    try {
        return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    } catch {
        return false
    }
}
