import { Resend } from "resend"
import { config } from "../config/app.config"

/** 
 * Mail Service using Resend SDK (REST API)
 * This avoids SMTP port blocking issues on VPS.
 */
export class MailService {
    private static resend = new Resend(config.RESEND_API_KEY)

    /**
     * Send verification email with OTP code.
     */
    static async sendVerificationEmail(to: string, code: string) {
        try {
            const { data, error } = await this.resend.emails.send({
                from: `RepoLens <${config.SMTP_FROM}>`,
                to: [to],
                subject: "Verify your email address",
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e4e8; border-radius: 8px;">
                        <h2 style="color: #0366d6;">Welcome to RepoLens!</h2>
                        <p>To finish setting up your account, please use the following verification code:</p>
                        <div style="background-color: #f6f8fa; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0;">
                            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #24292e;">${code}</span>
                        </div>
                        <p>This code will expire in 10 minutes.</p>
                        <p style="color: #586069; font-size: 12px; margin-top: 40px;">
                            If you didn't request this email, you can safely ignore it.
                        </p>
                    </div>
                `,
            })

            if (error) {
                console.error(`[MailService] Resend API error sending email to ${to}:`, error)
                throw error
            }

            console.log(`[MailService] Verification email sent to ${to}: ${data?.id}`)
            return data
        } catch (error) {
            console.error(`[MailService] Unexpected error sending verification email to ${to}:`, error)
            throw error
        }
    }
}
