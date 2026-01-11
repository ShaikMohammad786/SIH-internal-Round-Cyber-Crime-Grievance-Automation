const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function fixAdminMongoDB() {
  let client;
  
  try {
    console.log('🔧 Fixing Admin Credentials in MongoDB...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    console.log('✅ Connected to MongoDB');
    
    // Check current admin collection
    const existingAdmins = await db.collection('admins').find({}).toArray();
    console.log(`📊 Found ${existingAdmins.length} admin users in collection`);
    
    // Clear and recreate admin collection
    await db.collection('admins').drop().catch(() => console.log('Collection did not exist'));
    console.log('🗑️ Cleared admin collection');
    
    // Create new admin collection
    await db.createCollection('admins');
    console.log('✅ Created new admin collection');
    
    // Create admin user with proper structure
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = {
      username: 'admin',
      email: 'admin@fraudlens.com',
      password: hashedPassword,
      role: 'admin',
      name: 'System Administrator',
      phone: '+91 99999 99999',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('admins').insertOne(adminUser);
    
    console.log('✅ Admin user created successfully!');
    console.log('📊 Admin User Details:');
    console.log('   ID:', result.insertedId);
    console.log('   Username:', adminUser.username);
    console.log('   Email:', adminUser.email);
    console.log('   Name:', adminUser.name);
    console.log('   Role:', adminUser.role);
    console.log('   Password Hash:', adminUser.password.substring(0, 20) + '...');
    
    // Verify the user was created and can be found
    const verifyAdmin = await db.collection('admins').findOne({ email: 'admin@fraudlens.com' });
    
    if (verifyAdmin) {
      console.log('\n✅ Verification successful!');
      
      // Test password verification
      const isPasswordValid = await bcrypt.compare('admin123', verifyAdmin.password);
      console.log('🔑 Password verification test:', isPasswordValid ? 'PASSED' : 'FAILED');
      
      console.log('\n🔐 ADMIN LOGIN CREDENTIALS:');
      console.log('==========================');
      console.log('📧 Email: admin@fraudlens.com');
      console.log('🔑 Password: admin123');
      console.log('👤 Role: admin');
      
    } else {
      console.log('❌ Failed to verify admin user creation');
    }
    
    // Also add to users collection as backup
    console.log('\n🔄 Adding admin to users collection as backup...');
    const userAdmin = {
      _id: new require('mongodb').ObjectId(),
      name: 'System Administrator',
      email: 'admin@fraudlens.com',
      password: hashedPassword,
      phone: '+91 99999 99999',
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('users').insertOne(userAdmin);
    console.log('✅ Admin also added to users collection');
    
  } catch (error) {
    console.error('❌ Error fixing admin MongoDB:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

fixAdminMongoDB();

