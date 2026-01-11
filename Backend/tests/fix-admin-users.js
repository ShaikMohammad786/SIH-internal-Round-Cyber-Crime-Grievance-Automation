const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function fixAdminUsers() {
  let client;
  
  try {
    console.log('🔧 Fixing Admin Users...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    console.log('✅ Connected to database');
    
    // Delete existing admin users
    console.log('🗑️ Removing existing admin users...');
    await db.collection('users').deleteMany({ 
      email: { $in: ['admin@fraudlens.com', 'superadmin@fraudlens.com'] }
    });
    
    // Create new admin users with proper password hashing
    console.log('👤 Creating new admin users...');
    
    const adminUsers = [
      {
        name: 'System Administrator',
        email: 'admin@fraudlens.com',
        password: await bcrypt.hash('admin123', 10),
        phone: '+91 99999 99999',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Super Administrator',
        email: 'superadmin@fraudlens.com',
        password: await bcrypt.hash('superadmin2024', 10),
        phone: '+91 88888 88888',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    const result = await db.collection('users').insertMany(adminUsers);
    
    console.log('✅ Admin users created successfully!');
    console.log(`📊 Inserted ${result.insertedCount} admin users`);
    
    // Verify the users were created correctly
    console.log('\n🔍 Verifying admin users...');
    const createdUsers = await db.collection('users').find({ 
      email: { $in: ['admin@fraudlens.com', 'superadmin@fraudlens.com'] }
    }).toArray();
    
    for (const user of createdUsers) {
      console.log(`\n👤 User: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   ID: ${user._id}`);
      
      // Test password verification
      const testPassword = user.email === 'admin@fraudlens.com' ? 'admin123' : 'superadmin2024';
      const isPasswordValid = await bcrypt.compare(testPassword, user.password);
      console.log(`   Password '${testPassword}' valid: ${isPasswordValid}`);
    }
    
    console.log('\n🔐 ADMIN LOGIN DETAILS:');
    console.log('========================');
    console.log('📧 Email: admin@fraudlens.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('');
    console.log('📧 Email: superadmin@fraudlens.com');
    console.log('🔑 Password: superadmin2024');
    console.log('👤 Role: admin');
    console.log('');
    console.log('🌐 Login at: http://localhost:3000/login');
    console.log('📊 Admin Dashboard: http://localhost:3000/admin-dashboard');
    
  } catch (error) {
    console.error('❌ Error fixing admin users:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

fixAdminUsers();

