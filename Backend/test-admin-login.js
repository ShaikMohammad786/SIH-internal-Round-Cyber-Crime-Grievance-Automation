const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('🧪 Testing Admin Login...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@fraudlens.com',
      password: 'admin123'
    });
    
    console.log('✅ Login Response:');
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('   User Role:', response.data.user?.role);
    console.log('   User Name:', response.data.user?.name);
    console.log('   User Email:', response.data.user?.email);
    console.log('   Token Present:', !!response.data.token);
    
    if (response.data.user?.role === 'admin') {
      console.log('\n🎉 Admin login successful! User will be redirected to admin dashboard.');
    } else {
      console.log('\n❌ Admin login failed - user role is not admin');
    }
    
  } catch (error) {
    console.error('❌ Admin login test failed:', error.response?.data || error.message);
  }
}

testAdminLogin();