require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('Testing SMTP Connection...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false, // true for 465
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        }
    });

    try {
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified!');

        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: process.env.SMTP_USER, // Send to self
            subject: 'Test Email from HopeRxPharma Debugger',
            text: 'If you receive this, SMTP is working correctly!'
        });

        console.log('✅ Email sent:', info.messageId);
    } catch (error) {
        console.error('❌ Failed:', error);
    }
}

testEmail();
