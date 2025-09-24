const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('📧 FraudLens SMTP Configuration Setup');
console.log('=====================================\n');

console.log('This script will help you configure SMTP for email sending.\n');

console.log('📋 SMTP Provider Options:');
console.log('1. Gmail (Recommended)');
console.log('2. Outlook/Hotmail');
console.log('3. Yahoo Mail');
console.log('4. Custom SMTP Server\n');

rl.question('Select SMTP provider (1-4): ', (provider) => {
  let smtpConfig = {};
  
  switch(provider) {
    case '1':
      smtpConfig = {
        host: 'smtp.gmail.com',
        port: '587',
        secure: 'false'
      };
      console.log('\n📧 Gmail Configuration');
      console.log('Note: You need to enable 2-Factor Authentication and generate an App Password');
      console.log('Guide: https://support.google.com/accounts/answer/185833\n');
      break;
    case '2':
      smtpConfig = {
        host: 'smtp-mail.outlook.com',
        port: '587',
        secure: 'false'
      };
      console.log('\n📧 Outlook Configuration');
      break;
    case '3':
      smtpConfig = {
        host: 'smtp.mail.yahoo.com',
        port: '587',
        secure: 'false'
      };
      console.log('\n📧 Yahoo Configuration');
      break;
    case '4':
      rl.question('Enter SMTP Host: ', (host) => {
        rl.question('Enter SMTP Port: ', (port) => {
          smtpConfig = { host, port, secure: 'false' };
          continueSetup();
        });
      });
      return;
    default:
      console.log('Invalid selection. Please run the script again.');
      rl.close();
      return;
  }
  
  continueSetup();
  
  function continueSetup() {
    rl.question(`\nEnter your email address: `, (email) => {
      rl.question(`Enter your email password (or App Password for Gmail): `, (password) => {
        rl.question(`\nEnter Telecom Authority email (default: telecom@fraud.gov.in): `, (telecomEmail) => {
          rl.question(`Enter Banking Authority email (default: banking@fraud.gov.in): `, (bankingEmail) => {
            rl.question(`Enter Nodal Officer email (default: nodal@fraud.gov.in): `, (nodalEmail) => {
              
              // Create .env content
              const envContent = `# Database Configuration
MONGODB_URI=mongodb://localhost:27017

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here-make-it-very-long-and-secure

# SMTP Configuration
SMTP_HOST=${smtpConfig.host}
SMTP_PORT=${smtpConfig.port}
SMTP_USER=${email}
SMTP_PASS=${password}

# Email Recipients
TELECOM_EMAIL=${telecomEmail || 'telecom@fraud.gov.in'}
BANKING_EMAIL=${bankingEmail || 'banking@fraud.gov.in'}
NODAL_EMAIL=${nodalEmail || 'nodal@fraud.gov.in'}

# Server Configuration
PORT=5000
NODE_ENV=development`;

              // Write .env file
              fs.writeFileSync('.env', envContent);
              
              console.log('\n✅ Configuration saved to .env file!');
              console.log('\n🧪 Testing SMTP configuration...');
              
              // Test the configuration
              const nodemailer = require('nodemailer');
              require('dotenv').config();
              
              const transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT),
                secure: false,
                auth: {
                  user: process.env.SMTP_USER,
                  pass: process.env.SMTP_PASS
                },
                tls: {
                  rejectUnauthorized: false
                }
              });
              
              transporter.verify()
                .then(() => {
                  console.log('✅ SMTP configuration is working!');
                  console.log('\n🎉 Setup complete! You can now send emails from the FraudLens system.');
                  console.log('\n📋 Next steps:');
                  console.log('1. Restart your server: npm start');
                  console.log('2. Test the complete system: node test-form-submission.js');
                  console.log('3. Check the admin dashboard for email functionality');
                })
                .catch((error) => {
                  console.log('❌ SMTP test failed:');
                  console.log('Error:', error.message);
                  console.log('\n💡 Please check your credentials and try again.');
                  console.log('For Gmail users: Make sure you\'re using an App Password, not your regular password.');
                })
                .finally(() => {
                  rl.close();
                });
            });
          });
        });
      });
    });
  }
});
