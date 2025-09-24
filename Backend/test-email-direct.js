const nodemailer = require('nodemailer');

async function testEmailDirect() {
  console.log('🧪 Testing Email with Direct Credentials...');
  
  // Your actual credentials
  const emailConfig = {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'skmohammad378@gmail.com',
      pass: 'ulnaqrmqcxoekstx'
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  console.log('📧 Using credentials:');
  console.log('User:', emailConfig.auth.user);
  console.log('Pass: ***configured***');
  console.log('Host:', emailConfig.host);
  console.log('Port:', emailConfig.port);

  const transporter = nodemailer.createTransport(emailConfig);

  try {
    console.log('\n🔌 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');
    
    console.log('\n📤 Sending test email...');
    const testEmail = {
      from: `"FraudLens System" <${emailConfig.auth.user}>`,
      to: 'skbabaads2019@gmail.com, skmohammad786v@gmail.com, nodal@fraud.gov.in', // Send to actual authority emails
      subject: '🧪 FraudLens SMTP Test - SUCCESS!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d3748;">🎉 FraudLens SMTP Test Successful!</h2>
          <p>This is a test email from the FraudLens system.</p>
          
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #4a5568; margin-top: 0;">📧 Test Details</h3>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>SMTP Host:</strong> ${emailConfig.host}</p>
            <p><strong>SMTP Port:</strong> ${emailConfig.port}</p>
            <p><strong>From:</strong> ${emailConfig.auth.user}</p>
          </div>
          
          <div style="background: #e6fffa; padding: 15px; border-radius: 8px; border-left: 4px solid #38b2ac;">
            <p style="margin: 0; color: #234e52;"><strong>✅ Success!</strong> Your SMTP configuration is working correctly!</p>
          </div>
          
          <p style="color: #718096; font-size: 14px; margin-top: 30px;">
            This email was sent automatically by the FraudLens system to verify email functionality.
          </p>
        </div>
      `
    };
    
    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${result.messageId}`);
    console.log(`📬 Email sent to: ${testEmail.to}`);
    
    console.log('\n🎉 SMTP Configuration is working perfectly!');
    console.log('You can now use the FraudLens system to send emails to authorities.');
    
  } catch (error) {
    console.error('❌ SMTP Test Failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n💡 Authentication Error - Please check:');
      console.log('1. Gmail App Password is correct');
      console.log('2. 2-Factor Authentication is enabled on Gmail account');
      console.log('3. App Password is generated for "Mail" application');
      console.log('4. Try generating a new App Password');
    } else if (error.code === 'ECONNECTION') {
      console.log('\n💡 Connection Error - Please check:');
      console.log('1. Internet connection is working');
      console.log('2. SMTP host and port are correct');
      console.log('3. Firewall is not blocking the connection');
    }
  }
}

testEmailDirect();
