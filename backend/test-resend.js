require('dotenv').config();
const { Resend } = require('resend');

async function testResend() {
    console.log('Testing Resend API...');

    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY is missing in .env');
        process.exit(1);
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev', // Default test domain
            to: 'delivered@resend.dev', // Default test address that always succeeds
            subject: 'Test Email from HopeRxPharma',
            html: '<p>If you see this, Resend is working! 🚀</p>'
        });

        if (error) {
            console.error('❌ Resend Error:', error);
            process.exit(1);
        }

        console.log('✅ Email sent successfully!');
        console.log('ID:', data.id);
    } catch (err) {
        console.error('❌ Failed:', err);
    }
}

testResend();
