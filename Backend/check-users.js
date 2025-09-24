const { MongoClient } = require('mongodb');

async function checkUsers() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('91crpc');
    
    console.log('👥 Checking users in database...');
    const users = await db.collection('users').find({}).toArray();
    console.log('📊 Total users found:', users.length);
    
    if (users.length === 0) {
      console.log('❌ No users found in database!');
      console.log('💡 You need to create users first.');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('   ---');
    });
    
    // Check admins
    const admins = await db.collection('admins').find({}).toArray();
    console.log('\n👑 Admins found:', admins.length);
    admins.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}`);
      console.log(`   Name: ${admin.name}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkUsers();