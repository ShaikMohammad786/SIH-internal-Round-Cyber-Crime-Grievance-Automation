const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// Connect to 91crpc database
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/91crpc';

async function addAdminTo91crpc() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB (91crpc database)');
    
    const db = client.db();
    
    // Check if admins collection exists
    const collections = await db.listCollections().toArray();
    const adminsCollectionExists = collections.some(col => col.name === 'admins');
    
    if (!adminsCollectionExists) {
      console.log('Creating admins collection in 91crpc database...');
      await db.createCollection('admins');
    }
    
    // Admin credentials
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';
    
    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin already exists in 91crpc database with email:', adminEmail);
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
      isActive: true
    };
    
    // Insert admin into database
    const result = await db.collection('admins').insertOne(adminDoc);
    
    console.log('✅ Admin added to 91crpc database!');
    console.log('Admin ID:', result.insertedId);
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Name:', adminName);
    
  } catch (error) {
    console.error('❌ Error adding admin to 91crpc:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
addAdminTo91crpc();
