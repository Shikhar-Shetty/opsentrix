import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER_MAIL,
        pass: process.env.USER_PASS
    }
})

export async function sendAlertEmail(to: string, text: string, agentName: string) {
    try {
        const info = await transport.sendMail({
            from: `"Opsentrix Agent Alert: ${agentName}" <${process.env.USER_MAIL}>`,
            to,
            subject: "⚠️ Opsentrix Alert",
            text,
        })
        console.log("Message:",to);
        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      } catch (err) {
        console.error("Email failed:", err);
    }
}
