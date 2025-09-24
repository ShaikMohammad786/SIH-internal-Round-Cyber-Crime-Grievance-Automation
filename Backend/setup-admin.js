const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function setupAdmin() {
  let client;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    console.log('✅ Connected to database');
    
    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ email: 'admin@fraudlens.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin@fraudlens.com');
      console.log('🔑 Password: admin123');
      console.log('👤 Role: admin');
      return;
    }
    
    // Create admin user
    console.log('👤 Creating admin user...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      name: 'System Administrator',
      email: 'admin@fraudlens.com',
      password: hashedPassword,
      phone: '+91 99999 99999',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('🔐 ADMIN LOGIN DETAILS:');
    console.log('========================');
    console.log('📧 Email: admin@fraudlens.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('🆔 User ID:', result.insertedId);
    console.log('');
    console.log('🌐 You can now login at: http://localhost:3000/login');
    console.log('📊 Admin Dashboard: http://localhost:3000/admin-dashboard');
    
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the setup
setupAdmin();

