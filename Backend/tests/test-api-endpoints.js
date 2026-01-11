const axios = require('axios');

async function testAPIEndpoints() {
  try {
    console.log('🧪 Testing API endpoints...');
    
    // Test basic server response
    console.log('\n1. Testing basic server response...');
    const basicResponse = await axios.get('http://localhost:5000/');
    console.log('✅ Basic server response:', basicResponse.data.message);
    
    // Test admin login
    console.log('\n2. Testing admin login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@fraudlens.com',
      password: 'admin123'
    });
    console.log('✅ Admin login successful');
    
    const token = loginResponse.data.token;
    console.log('🔑 Token received:', token ? 'Yes' : 'No');
    
    // Test admin cases endpoint
    console.log('\n3. Testing admin cases endpoint...');
    const casesResponse = await axios.get('http://localhost:5000/api/admin/cases', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Admin cases endpoint working');
    console.log('📄 Cases found:', casesResponse.data.data.cases.length);
    
    if (casesResponse.data.data.cases.length > 0) {
      const firstCase = casesResponse.data.data.cases[0];
      console.log('📋 First case details:');
      console.log('   Case ID:', firstCase.caseId);
      console.log('   Status:', firstCase.status);
      console.log('   User:', firstCase.user?.name || 'Unknown');
    }
    
    // Test user login
    console.log('\n4. Testing user login...');
    const userLoginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'user@fraudlens.com',
      password: 'user123'
    });
    console.log('✅ User login successful');
    
    const userToken = userLoginResponse.data.token;
    
    // Test user cases endpoint
    console.log('\n5. Testing user cases endpoint...');
    const userCasesResponse = await axios.get('http://localhost:5000/api/user/cases', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ User cases endpoint working');
    console.log('📄 User cases found:', userCasesResponse.data.data.cases.length);
    
    console.log('\n🎉 All API endpoints are working correctly!');
    
  } catch (error) {
    console.error('❌ API Test Failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testAPIEndpoints();
