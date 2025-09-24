const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function checkPoliceUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('91crpc');
    
    console.log('Connected to MongoDB - 91crpc database');
    
    // Check police users
    const policeUsers = await db.collection('users').find({ role: 'police' }).toArray();
    
    console.log(`\n👮 Police users found: ${policeUsers.length}`);
    console.log('================================');
    
    if (policeUsers.length > 0) {
      policeUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Badge: ${user.badgeNumber}`);
        console.log(`   Rank: ${user.rank}`);
        console.log(`   Department: ${user.department}`);
        console.log(`   Active: ${user.isActive}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No police users found in database');
    }
    
    // Check all users
    const allUsers = await db.collection('users').find({}).toArray();
    console.log(`\n📊 Total users in database: ${allUsers.length}`);
    
    const userRoles = {};
    allUsers.forEach(user => {
      userRoles[user.role] = (userRoles[user.role] || 0) + 1;
    });
    
    console.log('User roles distribution:');
    Object.entries(userRoles).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });
    
  } catch (error) {
    console.error('Error checking police users:', error);
  } finally {
    await client.close();
  }
}

checkPoliceUsers();
