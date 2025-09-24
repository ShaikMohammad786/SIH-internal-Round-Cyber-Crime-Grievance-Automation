const nodemailer = require('nodemailer');
const path = require('path');

// Load .env file from the correct path
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function testSMTPConfiguration() {
  console.log('🧪 Testing SMTP Configuration...');
  
  // Display current configuration
  console.log('\n📧 Current SMTP Configuration:');
  console.log(`Host: ${process.env.SMTP_HOST || 'smtp.gmail.com'}`);
  console.log(`Port: ${process.env.SMTP_PORT || '587'}`);
  console.log(`User: ${process.env.SMTP_USER || 'fraudlens.system@gmail.com'}`);
  console.log(`Pass: ${process.env.SMTP_PASS ? '***configured***' : 'NOT SET'}`);
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'fraudlens.system@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password'
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    // Test connection
    console.log('\n🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    // Send test email
    console.log('\n📤 Sending test email...');
    const testEmail = {
      from: `"FraudLens System" <${process.env.SMTP_USER || 'fraudlens.system@gmail.com'}>`,
      to: process.env.SMTP_USER || 'fraudlens.system@gmail.com', // Send to self for testing
      subject: 'FraudLens SMTP Test Email',
      html: `
        <h2>🧪 SMTP Configuration Test</h2>
        <p>This is a test email from the FraudLens system.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST || 'smtp.gmail.com'}</p>
        <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT || '587'}</p>
        <p>If you receive this email, your SMTP configuration is working correctly!</p>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    
  } catch (error) {
    console.error('❌ SMTP Test Failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication Error - Please check:');
      console.log('1. Gmail App Password is correctly set in .env file');
      console.log('2. 2-Factor Authentication is enabled on Gmail account');
      console.log('3. App Password is generated for "Mail" application');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection Error - Please check:');
      console.log('1. Internet connection is working');
      console.log('2. SMTP host and port are correct');
      console.log('3. Firewall is not blocking the connection');
    }
  }
}

testSMTPConfiguration();
