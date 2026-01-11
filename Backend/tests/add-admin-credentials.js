const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function addAdminCredentials() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Check if admins collection exists
    const collections = await db.listCollections().toArray();
    const adminsCollectionExists = collections.some(col => col.name === 'admins');
    
    if (!adminsCollectionExists) {
      console.log('Creating admins collection...');
      await db.createCollection('admins');
    }
    
    // Admin credentials
    const adminEmail = 'admin@fraudlens.com';
    const adminPassword = 'admin123'; // Change this to a secure password
    const adminName = 'System Administrator';
    
    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin already exists with email:', adminEmail);
      console.log('Admin ID:', existingAdmin._id);
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Create admin document
    const adminDoc = {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      permissions: [
        'view_dashboard',
        'manage_users',
        'manage_cases',
        'view_analytics',
        'manage_process_flow',
        'assign_cases',
        'update_case_status'
      ]
    };
    
    // Insert admin into database
    const result = await db.collection('admins').insertOne(adminDoc);
    
    console.log('✅ Admin credentials added successfully!');
    console.log('Admin ID:', result.insertedId);
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Name:', adminName);
    console.log('\n🔐 You can now login with these credentials to access the admin portal.');
    console.log('⚠️  Please change the password after first login for security.');
    
  } catch (error) {
    console.error('❌ Error adding admin credentials:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
addAdminCredentials();