import { Resend } from "resend";
import { config } from "../config/app.config";

/**
 * Diagnostic tool for testing Resend SDK connectivity from VPS.
 * Run this directly: npx ts-node src/scripts/test-mail.ts
 */
async function testMail() {
    console.log("--- Resend SDK Diagnostic Start ---");
    console.log(`API Key: ${config.RESEND_API_KEY ? "MATCHED (Masked)" : "MISSING"}`);
    console.log(`From: ${config.SMTP_FROM}`);
    
    const resend = new Resend(config.RESEND_API_KEY);

    console.log("\nSending test email via REST API (Port 443)...");
    try {
        const { data, error } = await resend.emails.send({
            from: `RepoLens Test <${config.SMTP_FROM}>`,
            to: [config.SMTP_FROM], // Send to self for testing
            subject: "Resend SDK Test from RepoLens",
            text: "If you see this, your Resend SDK configuration is working correctly over HTTPS!",
            html: "<b>If you see this, your Resend SDK configuration is working correctly over HTTPS!</b>",
        });

        if (error) {
            console.error("\n❌ Resend API Error:", error);
        } else {
            console.log(`✅ Test email sent successfully! ID: ${data?.id}`);
        }
    } catch (error: any) {
        console.error("\n❌ Unexpected Error:");
        console.error(error);
    }
    console.log("\n--- Resend SDK Diagnostic End ---");
}

testMail().catch(console.error);
