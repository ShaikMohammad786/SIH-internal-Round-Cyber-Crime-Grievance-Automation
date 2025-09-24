const path = require('path');

// Load .env file from the correct path
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Debugging Email Configuration...');
console.log('=====================================');

console.log('\n📁 .env file path:', path.join(__dirname, '.env'));
const fs = require('fs');
console.log('📄 File exists:', fs.existsSync(path.join(__dirname, '.env')));

console.log('\n🔧 Environment Variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***configured***' : 'NOT SET');

console.log('\n📧 Email Recipients:');
console.log('TELECOM_EMAIL:', process.env.TELECOM_EMAIL);
console.log('BANKING_EMAIL:', process.env.BANKING_EMAIL);
console.log('NODAL_EMAIL:', process.env.NODAL_EMAIL);

console.log('\n📋 All SMTP related env vars:');
for (const key in process.env) {
  if (key.startsWith('SMTP_')) {
    console.log(`${key}: ${key === 'SMTP_PASS' ? '***configured***' : process.env[key]}`);
  }
}

console.log('\n📋 All TELECOM related env vars:');
for (const key in process.env) {
  if (key.startsWith('TELECOM_')) {
    console.log(`${key}: ${process.env[key]}`);
  }
}
