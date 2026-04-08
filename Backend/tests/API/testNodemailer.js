const sendEmail = require('../../services/emailService');

const test = async () => {
    console.log('Testing Nodemailer Service...');
    const result = await sendEmail(
        'test@example.com', // Replace with a real email for a real test
        'Test Nodemailer',
        'This is a test email sent from the Smart Water system.',
        '<h1>Test Email</h1><p>This is a test email sent from the <strong>Smart Water system</strong>.</p>'
    );

    if (result.success) {
        console.log('Test Passed: Email sending logic executed successfully.');
        console.log('Message ID:', result.messageId);
    } else {
        console.log('Test Failed:', result.error);
        console.log('Note: Ensure SMTP credentials in .env are correct.');
    }
};

test();
