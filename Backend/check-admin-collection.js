const { MongoClient } = require('mongodb');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function checkAdminCollection() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // List all collections
    console.log('\n📋 All collections in database:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => {
      console.log(`- ${col.name}`);
    });
    
    // Check if admins collection exists
    const adminsCollectionExists = collections.some(col => col.name === 'admins');
    
    if (!adminsCollectionExists) {
      console.log('\n❌ admins collection does not exist!');
      console.log('Creating admins collection...');
      await db.createCollection('admins');
      console.log('✅ admins collection created');
    } else {
      console.log('\n✅ admins collection exists');
    }
    
    // Count documents in admins collection
    const adminCount = await db.collection('admins').countDocuments();
    console.log(`\n📊 Number of admins: ${adminCount}`);
    
    // Show all admin documents
    if (adminCount > 0) {
      console.log('\n👥 Admin documents:');
      const admins = await db.collection('admins').find({}).toArray();
      admins.forEach((admin, index) => {
        console.log(`\nAdmin ${index + 1}:`);
        console.log(`- ID: ${admin._id}`);
        console.log(`- Email: ${admin.email}`);
        console.log(`- Name: ${admin.name || 'Not set'}`);
        console.log(`- Role: ${admin.role || 'Not set'}`);
        console.log(`- Created: ${admin.createdAt || 'Not set'}`);
      });
    } else {
      console.log('\n❌ No admin documents found in admins collection');
    }
    
    // Check users collection for admin users
    console.log('\n👤 Checking users collection for admin users:');
    const adminUsers = await db.collection('users').find({ role: 'admin' }).toArray();
    console.log(`Found ${adminUsers.length} admin users in users collection`);
    
    if (adminUsers.length > 0) {
      adminUsers.forEach((user, index) => {
        console.log(`\nAdmin User ${index + 1}:`);
        console.log(`- ID: ${user._id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Name: ${user.name || 'Not set'}`);
        console.log(`- Role: ${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking admin collection:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the function
checkAdminCollection();