const axios = require('axios');

async function testTokenValidation() {
  try {
    console.log('🧪 Testing token validation...');
    
    // Test with invalid token
    console.log('\n1. Testing with invalid token...');
    try {
      const invalidResponse = await axios.get('http://localhost:5000/api/admin/cases', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      console.log('❌ Should have failed with invalid token');
    } catch (error) {
      console.log('✅ Correctly rejected invalid token');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
    }
    
    // Test with no token
    console.log('\n2. Testing with no token...');
    try {
      const noTokenResponse = await axios.get('http://localhost:5000/api/admin/cases');
      console.log('❌ Should have failed with no token');
    } catch (error) {
      console.log('✅ Correctly rejected no token');
      console.log('   Status:', error.response?.status);
      console.log('   Message:', error.response?.data?.message);
    }
    
    // Test with valid token
    console.log('\n3. Testing with valid token...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@fraudlens.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful');
      console.log('🔑 Token received:', token ? 'Yes' : 'No');
      
      // Test with valid token
      const validResponse = await axios.get('http://localhost:5000/api/admin/cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Valid token accepted');
      console.log('📊 Cases found:', validResponse.data.data.cases.length);
      
      // Test token expiration (if any)
      console.log('\n4. Testing token format...');
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log('✅ Token format is valid JWT');
          console.log('📅 Token issued at:', new Date(payload.iat * 1000));
          console.log('📅 Token expires at:', payload.exp ? new Date(payload.exp * 1000) : 'No expiration');
          console.log('👤 User ID:', payload.userId);
          console.log('🔑 Role:', payload.role);
        } catch (error) {
          console.log('❌ Token payload is invalid:', error.message);
        }
      } else {
        console.log('❌ Token format is invalid (not JWT)');
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTokenValidation();
