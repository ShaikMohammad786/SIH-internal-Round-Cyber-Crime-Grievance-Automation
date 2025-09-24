const axios = require('axios');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function testCompleteAdmin() {
  let client;
  
  try {
    console.log('🔧 Complete Admin Test...');
    
    // First, check database
    console.log('\n📊 Checking Database...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    const adminUser = await db.collection('users').findOne({ email: 'admin@fraudlens.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found in database');
      return;
    }
    
    console.log('✅ Admin user found in database');
    console.log('   Name:', adminUser.name);
    console.log('   Email:', adminUser.email);
    console.log('   Role:', adminUser.role);
    
    // Test password verification
    const isPasswordValid = await bcrypt.compare('admin123', adminUser.password);
    console.log('   Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password verification failed');
      return;
    }
    
    await client.close();
    
    // Test API login
    console.log('\n🌐 Testing API Login...');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: 'admin@fraudlens.com',
        password: 'admin123'
      });
      
      console.log('✅ API Login Response:');
      console.log('   Success:', response.data.success);
      console.log('   User Role:', response.data.user?.role);
      console.log('   User Name:', response.data.user?.name);
      console.log('   Token Present:', !!response.data.token);
      
      if (response.data.success && response.data.user?.role === 'admin') {
        console.log('\n🎉 ADMIN LOGIN WORKING PERFECTLY!');
        console.log('📧 Email: admin@fraudlens.com');
        console.log('🔑 Password: admin123');
        console.log('🌐 Login at: http://localhost:3000/login');
        console.log('📊 Admin Dashboard: http://localhost:3000/admin-dashboard');
      } else {
        console.log('❌ Admin login not working properly');
      }
      
    } catch (apiError) {
      console.log('❌ API Error:', apiError.response?.data || apiError.message);
      
      if (apiError.code === 'ECONNREFUSED') {
        console.log('💡 Server is not running. Start it with: node server.js');
      }
    }
    
  } catch (error) {
    console.error('❌ Error in complete test:', error);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

testCompleteAdmin();

