const axios = require('axios');

async function testUserLogin() {
  try {
    console.log('🧪 Testing user login with correct credentials...');
    
    // Test with actual user credentials from database
    const userCredentials = [
      { email: 'skmohammad@gmail.com', password: 'user123' },
      { email: 'puppala@gmail.com', password: 'user123' },
      { email: 'testuser@example.com', password: 'user123' }
    ];
    
    for (const creds of userCredentials) {
      try {
        console.log(`\n🔐 Testing login for: ${creds.email}`);
        const loginResponse = await axios.post('http://localhost:5000/api/auth/login', creds);
        console.log('✅ Login successful');
        
        const token = loginResponse.data.token;
        console.log('🔑 Token received:', token ? 'Yes' : 'No');
        
        // Test user cases endpoint
        console.log('📄 Testing user cases endpoint...');
        const userCasesResponse = await axios.get('http://localhost:5000/api/user/cases', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ User cases endpoint working');
        console.log('📊 User cases found:', userCasesResponse.data.data.cases.length);
        
        if (userCasesResponse.data.data.cases.length > 0) {
          const firstCase = userCasesResponse.data.data.cases[0];
          console.log('📋 First case details:');
          console.log('   Case ID:', firstCase.caseId);
          console.log('   Status:', firstCase.status);
          console.log('   Description:', firstCase.description?.substring(0, 50) + '...');
        }
        
        console.log('🎉 User login and case loading working correctly!');
        return; // Exit after first successful login
        
      } catch (error) {
        console.log(`❌ Login failed for ${creds.email}:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n💡 All user logins failed. This might indicate:');
    console.log('1. Password is not "user123" for these users');
    console.log('2. Users were created with different passwords');
    console.log('3. There might be an authentication issue');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testUserLogin();
