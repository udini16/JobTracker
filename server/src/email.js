const nodemailer = require('nodemailer');

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_APP_PASSWORD;

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: gmailUser,
        pass: gmailPass
    }
});

async function sendReachoutEmail(toEmail, subject, body, jobId, attachments = []) {
    try {
        const trackingPixelUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/track/${jobId}`;
        const htmlBody = `<p>${body.replace(/\n/g, '<br/>')}</p><img src="${trackingPixelUrl}" width="1" height="1" alt="" />`;

        if (gmailUser && gmailPass) {
            const mailOptions = {
                from: gmailUser,
                to: toEmail,
                subject: subject,
                text: body,
                html: htmlBody,
                attachments: attachments.map(att => ({
                    filename: att.filename,
                    content: att.content
                }))
            };

            const info = await transporter.sendMail(mailOptions);
            return info;
        } else {
            console.log('No GMAIL_USER or GMAIL_APP_PASSWORD found, simulating email send.');
            console.log('To:', toEmail);
            console.log('Subject:', subject);
            console.log('HTML:', htmlBody);
            return { id: 'mock-email-id' };
        }
    } catch (error) {
        console.error('Failed to send email with Nodemailer:', error);
        throw error;
    }
}

module.exports = { sendReachoutEmail };
