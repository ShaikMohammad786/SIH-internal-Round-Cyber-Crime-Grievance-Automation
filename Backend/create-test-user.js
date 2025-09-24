const axios = require('axios');

async function createTestUser() {
  try {
    console.log('👤 Creating a new test user...');
    
    const userData = {
      name: 'Test User',
      email: 'testuser@fraudlens.com',
      password: 'user123',
      phone: '+91 98765 43210',
      role: 'user'
    };
    
    console.log('📝 User data:', {
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      role: userData.role
    });
    
    const response = await axios.post('http://localhost:5000/api/auth/register', userData);
    
    if (response.data.success) {
      console.log('✅ User created successfully!');
      console.log('📧 Email:', userData.email);
      console.log('🔑 Password:', userData.password);
      
      // Test login with new user
      console.log('\n🔐 Testing login with new user...');
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login successful!');
        console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');
        
        // Test user cases endpoint
        console.log('\n📄 Testing user cases endpoint...');
        const userCasesResponse = await axios.get('http://localhost:5000/api/user/cases', {
          headers: { Authorization: `Bearer ${loginResponse.data.token}` }
        });
        console.log('✅ User cases endpoint working');
        console.log('📊 User cases found:', userCasesResponse.data.data.cases.length);
        
        console.log('\n🎉 User creation and authentication working correctly!');
        console.log('\n📋 You can now use these credentials to test:');
        console.log('Email: testuser@fraudlens.com');
        console.log('Password: user123');
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
      
    } else {
      console.log('❌ User creation failed:', response.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Error:', error.response.data.message);
      if (error.response.data.message.includes('already exists')) {
        console.log('💡 User already exists. Trying to login instead...');
        
        // Try to login with existing user
        try {
          const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'testuser@fraudlens.com',
            password: 'user123'
          });
          
          if (loginResponse.data.success) {
            console.log('✅ Login with existing user successful!');
            console.log('🔑 Token received:', loginResponse.data.token ? 'Yes' : 'No');
          } else {
            console.log('❌ Login failed:', loginResponse.data.message);
          }
        } catch (loginError) {
          console.log('❌ Login error:', loginError.response?.data?.message || loginError.message);
        }
      }
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

createTestUser();
