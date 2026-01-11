const axios = require('axios');

async function testUserCases() {
  try {
    console.log('🧪 Testing user cases endpoint...');
    
    // Login as the test user
    console.log('🔐 Logging in as test user...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testuser@fraudlens.com',
      password: 'user123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Login successful!');
    const token = loginResponse.data.token;
    
    // Test user cases endpoint
    console.log('\n📄 Testing user cases endpoint...');
    const userCasesResponse = await axios.get('http://localhost:5000/api/user/my-cases', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ User cases endpoint working');
    console.log('📊 Response status:', userCasesResponse.status);
    console.log('📊 Response data:', JSON.stringify(userCasesResponse.data, null, 2));
    
    if (userCasesResponse.data.success) {
      const cases = userCasesResponse.data.cases || [];
      console.log('📄 User cases found:', cases.length);
      
      if (cases.length > 0) {
        const firstCase = cases[0];
        console.log('\n📋 First case details:');
        console.log('   Case ID:', firstCase.caseId);
        console.log('   Status:', firstCase.status);
        console.log('   Description:', firstCase.description?.substring(0, 50) + '...');
        console.log('   Created:', firstCase.createdAt);
      } else {
        console.log('📝 No cases found for this user (this is normal for a new user)');
      }
    } else {
      console.log('❌ User cases request failed:', userCasesResponse.data.message);
    }
    
    // Test case details endpoint
    console.log('\n🔍 Testing case details endpoint...');
    try {
      const caseDetailsResponse = await axios.get(`http://localhost:5000/api/user/case/68d2ea9afad0c357fc2cfd82`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Case details endpoint working');
      console.log('📊 Case details response:', caseDetailsResponse.data.success ? 'Success' : 'Failed');
      
      if (caseDetailsResponse.data.success) {
        const caseData = caseDetailsResponse.data.data;
        console.log('📋 Case details:');
        console.log('   Case ID:', caseData.caseId);
        console.log('   Status:', caseData.status);
        console.log('   Description:', caseData.description?.substring(0, 50) + '...');
      }
    } catch (error) {
      console.log('❌ Case details endpoint failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 User authentication and case loading test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUserCases();
