const nodemailer = require('nodemailer');
require('dotenv').config();


const sendEmail = async (to, subject, text, html) => {
    try {
        // Create reusable transporter object using the default SMTP transport
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // Send mail with defined transport object
        const info = await transporter.sendMail({
            from: `"${process.env.FROM_NAME || 'Smart Water'}" <${process.env.FROM_EMAIL}>`,
            to,
            subject,
            text,
            html: html || text,
        });

        console.log("Message sent: %s", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error: error.message };
    }
};

module.exports = sendEmail;
