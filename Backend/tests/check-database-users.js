const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function checkDatabaseUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB (fraudlens database)');
    
    const db = client.db();
    
    // Check users collection
    const usersCount = await db.collection('users').countDocuments();
    console.log(`\n📊 Users in fraudlens database: ${usersCount}`);
    
    if (usersCount > 0) {
      console.log('\n👥 User documents:');
      const users = await db.collection('users').find({}).limit(5).toArray();
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`);
        console.log(`- ID: ${user._id}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Role: ${user.role}`);
        console.log(`- Created: ${user.createdAt}\n`);
      });
    } else {
      console.log('❌ No users found in fraudlens database');
    }
    
    // Check cases collection
    const casesCount = await db.collection('cases').countDocuments();
    console.log(`\n📋 Cases in fraudlens database: ${casesCount}`);
    
    // Check admins collection
    const adminsCount = await db.collection('admins').countDocuments();
    console.log(`\n👑 Admins in fraudlens database: ${adminsCount}`);
    
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
    
    // Check if we should copy users from 91crpc database
    console.log('\n🔍 Checking 91crpc database for users...');
    const client91crpc = new MongoClient('mongodb://localhost:27017/91crpc');
    await client91crpc.connect();
    const db91crpc = client91crpc.db();
    
    const users91crpcCount = await db91crpc.collection('users').countDocuments();
    console.log(`Users in 91crpc database: ${users91crpcCount}`);
    
    if (users91crpcCount > 0 && usersCount === 0) {
      console.log('\n⚠️  No users in fraudlens database, but users exist in 91crpc database');
      console.log('💡 You may need to either:');
      console.log('1. Copy users from 91crpc to fraudlens database');
      console.log('2. Change server.js back to use 91crpc database');
      console.log('3. Create new users in fraudlens database');
    }
    
    await client91crpc.close();
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

checkDatabaseUsers();
