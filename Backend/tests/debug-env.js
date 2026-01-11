const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Debugging Environment Variables...');
console.log('=====================================');

console.log('\n📁 .env file path:', path.join(__dirname, '.env'));
console.log('📄 File exists:', require('fs').existsSync(path.join(__dirname, '.env')));

console.log('\n🔧 Environment Variables:');
console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET');

console.log('\n📋 All SMTP related env vars:');
Object.keys(process.env).filter(key => key.includes('SMTP')).forEach(key => {
  console.log(`${key}: ${process.env[key]}`);
});

console.log('\n📋 All TELECOM related env vars:');
Object.keys(process.env).filter(key => key.includes('TELECOM')).forEach(key => {
  console.log(`${key}: ${process.env[key]}`);
});
