const axios = require('axios');
const { MongoClient, ObjectId } = require('mongodb');

async function testEmailWorkflow() {
  try {
    console.log('🧪 Testing complete email workflow...');
    
    // 1. Admin login
    console.log('\n1. Admin login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@fraudlens.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Admin login failed:', loginResponse.data.message);
      return;
    }
    
    const adminToken = loginResponse.data.token;
    console.log('✅ Admin login successful');
    
    // 2. Get a case with scammer details
    console.log('\n2. Getting cases...');
    const casesResponse = await axios.get('http://localhost:5000/api/admin/cases', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (!casesResponse.data.success) {
      console.log('❌ Failed to get cases:', casesResponse.data.message);
      return;
    }
    
    const cases = casesResponse.data.data.cases;
    console.log('✅ Cases retrieved:', cases.length);
    
    if (cases.length === 0) {
      console.log('❌ No cases found to test with');
      return;
    }
    
    // Find a case with scammer details
    let testCase = null;
    for (const caseItem of cases) {
      if (caseItem.scammerDetails) {
        testCase = caseItem;
        break;
      }
    }
    
    if (!testCase) {
      console.log('❌ No case with scammer details found');
      return;
    }
    
    console.log('📋 Test case found:', testCase.caseId);
    console.log('   Scammer details:', testCase.scammerDetails ? 'Available' : 'Not available');
    
    // 3. Generate 91 CrPC
    console.log('\n3. Generating 91 CrPC...');
    try {
      const generateResponse = await axios.post(`http://localhost:5000/api/crpc/generate/${testCase._id}`, {
        scammerId: testCase.scammerDetails._id
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (generateResponse.data.success) {
        console.log('✅ 91 CrPC generated successfully');
        console.log('   Document ID:', generateResponse.data.data.documentId);
      } else {
        console.log('❌ Failed to generate 91 CrPC:', generateResponse.data.message);
        return;
      }
    } catch (error) {
      console.log('❌ 91 CrPC generation error:', error.response?.data?.message || error.message);
      return;
    }
    
    // 4. Send emails
    console.log('\n4. Sending emails to authorities...');
    try {
      const sendResponse = await axios.post(`http://localhost:5000/api/crpc/send/${testCase._id}`, {
        recipients: {
          telecom: true,
          banking: true,
          nodal: true
        }
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (sendResponse.data.success) {
        console.log('✅ Emails sent successfully');
        console.log('   Recipients:', sendResponse.data.data.recipients);
        console.log('   Email results:', JSON.stringify(sendResponse.data.data.emailResults, null, 2));
      } else {
        console.log('❌ Failed to send emails:', sendResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Email sending error:', error.response?.data?.message || error.message);
    }
    
    // 5. Check timeline
    console.log('\n5. Checking timeline...');
    try {
      const timelineResponse = await axios.get(`http://localhost:5000/api/timeline/${testCase._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (timelineResponse.data.success) {
        const timeline = timelineResponse.data.data;
        console.log('✅ Timeline retrieved:', timeline.length, 'entries');
        
        timeline.forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.stageName} - ${entry.status || 'pending'}`);
        });
      } else {
        console.log('❌ Failed to get timeline:', timelineResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Timeline error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Email workflow test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEmailWorkflow();
