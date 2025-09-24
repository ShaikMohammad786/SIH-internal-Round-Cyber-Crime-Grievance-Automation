const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function createSuperAdmin() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    console.log('✅ Connected to database');
    
    // Create super admin user
    console.log('👤 Creating super admin user...');
    
    const hashedPassword = await bcrypt.hash('superadmin2024', 10);
    
    const superAdmin = {
      name: 'Super Administrator',
      email: 'superadmin@fraudlens.com',
      password: hashedPassword,
      phone: '+91 88888 88888',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Check if super admin already exists
    const existingSuperAdmin = await db.collection('users').findOne({ email: 'superadmin@fraudlens.com' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super admin user already exists!');
      console.log('📧 Email: superadmin@fraudlens.com');
      console.log('🔑 Password: superadmin2024');
      console.log('👤 Role: admin');
      return;
    }
    
    const result = await db.collection('users').insertOne(superAdmin);
    
    console.log('✅ Super admin user created successfully!');
    console.log('');
    console.log('🔐 SUPER ADMIN LOGIN DETAILS:');
    console.log('=============================');
    console.log('📧 Email: superadmin@fraudlens.com');
    console.log('🔑 Password: superadmin2024');
    console.log('👤 Role: admin');
    console.log('🆔 User ID:', result.insertedId);
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3000/login');
    console.log('📊 Admin Dashboard: http://localhost:3000/admin-dashboard');
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
createSuperAdmin();

