const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/91crpc';

async function createAdminUser() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db("91crpc");
    
    console.log('🔍 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ 
      email: 'admin@fraudlens.com' 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      return;
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      name: 'System Administrator',
      email: 'admin@fraudlens.com',
      password: hashedPassword,
      phone: '0000000000',
      role: 'admin',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@fraudlens.com');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', result.insertedId);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

createAdminUser().catch(console.error);
