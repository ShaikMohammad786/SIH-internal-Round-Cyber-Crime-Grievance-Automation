const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('🔐 Testing Admin Login from Admin Collection...');
    
    // Test admin login
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@fraudlens.com',
      password: 'admin123'
    });
    
    console.log('✅ Admin Login Response:');
    console.log('Success:', response.data.success);
    console.log('User Role:', response.data.user?.role);
    console.log('User Name:', response.data.user?.name || response.data.user?.username);
    console.log('User Email:', response.data.user?.email);
    console.log('Token Present:', !!response.data.token);
    
    if (response.data.success && response.data.user?.role === 'admin') {
      console.log('\n🎉 ADMIN LOGIN WORKING PERFECTLY!');
      console.log('✅ Admin will be redirected to admin dashboard');
      console.log('📊 Admin Dashboard URL: http://localhost:3000/admin-dashboard');
    } else {
      console.log('❌ Admin login not working properly');
    }
    
  } catch (error) {
    console.error('❌ Error testing admin login:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Server is not running. Make sure to start it with: node server.js');
    }
  }
}

// Wait a moment for server to start
setTimeout(() => {
  testAdminLogin();
}, 2000);

