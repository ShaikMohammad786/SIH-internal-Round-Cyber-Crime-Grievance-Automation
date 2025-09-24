const { sendEmailsToAuthorities } = require('./services/emailService');

async function testEmailRecipients() {
  try {
    console.log('🧪 Testing email recipients...');
    
    // Mock case data
    const caseData = {
      caseId: 'FRD-082073-NY49',
      user: { name: 'Test User', email: 'test@example.com' },
      amount: 50000,
      incidentDate: new Date(),
      caseType: 'Investment Scam'
    };
    
    const scammerData = {
      phoneNumber: '+91 98765 43210',
      bankAccount: '1234567890',
      upiId: 'scammer@upi'
    };
    
    const recipients = {
      telecom: true,
      banking: true,
      nodal: true
    };
    
    console.log('\n📧 Sending emails to authorities...');
    console.log('Recipients:', recipients);
    
    const results = await sendEmailsToAuthorities(caseData, scammerData, recipients);
    
    console.log('\n📊 Email Results:');
    for (const [authority, result] of Object.entries(results)) {
      console.log(`${authority.toUpperCase()}:`);
      console.log(`  Success: ${result.success}`);
      console.log(`  Email: ${result.to}`);
      console.log(`  Message ID: ${result.messageId || 'N/A'}`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailRecipients();
