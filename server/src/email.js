const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

async function sendReachoutEmail(toEmail, subject, body, jobId) {
    try {
        const trackingPixelUrl = `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/track/${jobId}`;
        const htmlBody = `<p>${body.replace(/\n/g, '<br/>')}</p><img src="${trackingPixelUrl}" width="1" height="1" alt="" />`;

        if (process.env.RESEND_API_KEY) {
            const { data, error } = await resend.emails.send({
                from: fromEmail,
                to: [toEmail],
                subject: subject,
                text: body,
                html: htmlBody,
            });

            if (error) {
                console.error('Resend error:', error);
                throw error;
            }
            return data;
        } else {
            console.log('No RESEND_API_KEY found, simulating email send.');
            console.log('To:', toEmail);
            console.log('Subject:', subject);
            console.log('HTML:', htmlBody);
            return { id: 'mock-email-id' };
        }
    } catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}

module.exports = { sendReachoutEmail };
