const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function testPassword() {
  let client;
  
  try {
    console.log('🔐 Testing Password Verification...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    
    // Get admin user
    const adminUser = await db.collection('users').findOne({ email: 'admin@fraudlens.com' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('Name:', adminUser.name);
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role);
    console.log('Password Hash:', adminUser.password.substring(0, 20) + '...');
    
    // Test password verification
    const testPassword = 'admin123';
    const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
    
    console.log(`\n🔑 Testing password '${testPassword}':`);
    console.log('Password Valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('\n🔄 Recreating admin user with correct password...');
      
      // Delete existing admin
      await db.collection('users').deleteOne({ email: 'admin@fraudlens.com' });
      
      // Create new admin with correct password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = {
        name: 'System Administrator',
        email: 'admin@fraudlens.com',
        password: hashedPassword,
        phone: '+91 99999 99999',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await db.collection('users').insertOne(newAdmin);
      console.log('✅ New admin user created with ID:', result.insertedId);
      
      // Test the new password
      const newPasswordValid = await bcrypt.compare('admin123', newAdmin.password);
      console.log('New Password Valid:', newPasswordValid);
    }
    
  } catch (error) {
    console.error('❌ Error testing password:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

testPassword();

