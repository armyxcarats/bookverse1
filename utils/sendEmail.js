const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    const host = process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io';
    const port = Number(process.env.SMTP_PORT || 2525);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: process.env.SMTP_EMAIL || process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS
        },
        tls: {
            rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
        }
    });

    const recipient = options.email;
    if (!recipient) {
        throw new Error('Missing recipient email address');
    }

    const message = {
        from: options.from || `${process.env.SMTP_FROM_NAME || 'Bookverse'} <${process.env.SMTP_FROM_EMAIL || 'no-reply@bookverse.local'}>`,
        to: recipient,
        subject: options.subject,
        html: options.html || `<p>${options.message}</p>`,
        attachments: options.attachments || []
    };

    console.log(`Mail helper: connecting to SMTP ${host}:${port} secure=${secure}`);
    await transporter.verify();
    console.log(`Mail helper: sending email to ${recipient} with subject '${message.subject}'`);

    await transporter.sendMail(message);
};

module.exports = sendEmail;
