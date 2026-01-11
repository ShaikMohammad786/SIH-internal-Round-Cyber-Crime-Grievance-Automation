const { sendEmailsToAuthorities } = require('./services/emailService');

async function testEmailFix() {
  try {
    console.log('🧪 Testing Email Fix with Correct Parameters...');
    
    // Test with the same parameters the frontend would send
    const testCaseData = {
      caseId: 'FRD-216366-ODLG',
      user: { name: 'skmohammad', email: 'skmohammad@gmail.com' },
      amount: 10000,
      incidentDate: '2025-09-16',
      caseType: 'upi-fraud',
      formData: {
        personalInfo: { firstName: 'sk', lastName: 'mohammaad' },
        contactInfo: { email: 'shaik_mohammhd@srmap.edu.in', phone: '+91 9391970347' },
        addressInfo: { currentAddress: { street: 'india, vijayawada,521225', city: 'Mangalagiri', state: 'Andhra Pradesh' } },
        governmentIds: { aadhaarNumber: '8734 3575 1916', panNumber: 'AMNPB6048G' }
      }
    };
    
    const testScammerData = {
      name: 'gsgsz',
      phoneNumber: '9391970347',
      email: 'skmohammad@gmail.com',
      bankAccount: 'sadfdf',
      website: 'www.abc.com'
    };
    
    // Test with the corrected parameter names
    const recipients = {
      telecom: true,
      banking: true,  // Changed from 'bank' to 'banking'
      nodal: true
    };
    
    console.log('📧 Testing with recipients:', recipients);
    
    const results = await sendEmailsToAuthorities(testCaseData, testScammerData, recipients);
    
    console.log('📊 Email Results:');
    console.log(JSON.stringify(results, null, 2));
    
    // Count successful sends
    const successCount = Object.values(results).filter(result => result.success).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n✅ Emails sent successfully: ${successCount}/${totalCount} authorities notified`);
    
    if (successCount === totalCount) {
      console.log('🎉 All emails sent successfully!');
      console.log('✅ The frontend should now show the correct count');
    } else {
      console.log('⚠️ Some emails failed to send');
    }
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  }
}

testEmailFix();
