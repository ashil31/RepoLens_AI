import nodemailer from "nodemailer"
import { config } from "../config/app.config"

/** 
 * Mail Service using Nodemailer
 */
export class MailService {
    private static transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465, // true for 465, false for other ports
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
        },
    })

    /**
     * Send verification email with OTP code.
     */
    static async sendVerificationEmail(to: string, code: string) {
        const mailOptions = {
            from: `"RepoLens" <${config.SMTP_FROM}>`,
            to,
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
        }

        try {
            const info = await this.transporter.sendMail(mailOptions)
            console.log(`[MailService] Verification email sent to ${to}: ${info.messageId}`)
            return info
        } catch (error) {
            console.error(`[MailService] Error sending verification email to ${to}:`, error)
            throw error
        }
    }
}
