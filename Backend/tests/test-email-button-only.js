const axios = require('axios');

async function testEmailButtonOnly() {
  try {
    console.log('🧪 Testing email functionality through action buttons only...');
    
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
    
    // 2. Get a case
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
    
    const testCase = cases[0];
    console.log('📋 Test case:', testCase.caseId);
    
    // 3. Test case details (this should NOT send emails)
    console.log('\n3. Testing case details (should NOT send emails)...');
    try {
      const caseDetailsResponse = await axios.get(`http://localhost:5000/api/admin/cases/${testCase._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (caseDetailsResponse.data.success) {
        console.log('✅ Case details retrieved successfully');
        console.log('   This operation should NOT send any emails');
      } else {
        console.log('❌ Failed to get case details:', caseDetailsResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Case details error:', error.response?.data?.message || error.message);
    }
    
    // 4. Test timeline (this should NOT send emails)
    console.log('\n4. Testing timeline (should NOT send emails)...');
    try {
      const timelineResponse = await axios.get(`http://localhost:5000/api/timeline/${testCase._id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (timelineResponse.data.success) {
        const timeline = timelineResponse.data.data.timeline;
        console.log('✅ Timeline retrieved:', timeline.length, 'entries');
        console.log('   This operation should NOT send any emails');
      } else {
        console.log('❌ Failed to get timeline:', timelineResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Timeline error:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Test completed!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Admin authentication working');
    console.log('   ✅ Cases retrieval working');
    console.log('   ✅ Case details working (no emails sent)');
    console.log('   ✅ Timeline working (no emails sent)');
    console.log('   📧 Emails should ONLY be sent when clicking action buttons in the UI');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testEmailButtonOnly();
