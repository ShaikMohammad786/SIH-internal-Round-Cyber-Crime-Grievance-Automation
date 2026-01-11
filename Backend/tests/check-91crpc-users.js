const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/91crpc';

async function check91crpcUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB (91crpc database)');
    
    const db = client.db();
    
    // Check users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log(`\n📊 Users in 91crpc database: ${usersCount}`);
    
    if (usersCount > 0) {
      console.log('\n👥 User documents:');
      const users = await db.collection('users').find({}).limit(10).toArray();
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`- ID: ${user._id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- Created: ${user.createdAt}\n`);
      });
    }
    
    // Check cases collection
    const casesCount = await db.collection('cases').countDocuments();
    console.log(`\n📋 Cases in 91crpc database: ${casesCount}`);
    
    // Check admins collection
    const adminsCount = await db.collection('admins').countDocuments();
    console.log(`\n👑 Admins in 91crpc database: ${adminsCount}`);
    
    if (adminsCount > 0) {
      console.log('\n🔐 Admin documents:');
      const admins = await db.collection('admins').find({}).toArray();
      admins.forEach((admin, index) => {
        console.log(`Admin ${index + 1}:`);
        console.log(`- ID: ${admin._id}`);
        console.log(`- Email: ${admin.email}`);
        console.log(`- Name: ${admin.name}`);
        console.log(`- Role: ${admin.role}\n`);
      });
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

check91crpcUsers();
