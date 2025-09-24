const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function createPoliceUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('91crpc');
    
    console.log('Connected to MongoDB');
    
    // Police users data
    const policeUsers = [
      {
        name: 'Inspector Rajesh Kumar',
        email: 'rajesh.kumar@police.gov.in',
        username: 'inspector_rajesh',
        password: 'police123',
        role: 'police',
        badgeNumber: 'POL001',
        department: 'Cyber Crime Division',
        rank: 'Inspector',
        phone: '+91-9876543210',
        station: 'Cyber Crime Police Station',
        jurisdiction: 'Delhi',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      },
      {
        name: 'Sub Inspector Priya Sharma',
        email: 'priya.sharma@police.gov.in',
        username: 'si_priya',
        password: 'police123',
        role: 'police',
        badgeNumber: 'POL002',
        department: 'Cyber Crime Division',
        rank: 'Sub Inspector',
        phone: '+91-9876543211',
        station: 'Cyber Crime Police Station',
        jurisdiction: 'Delhi',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      },
      {
        name: 'Assistant Sub Inspector Amit Singh',
        email: 'amit.singh@police.gov.in',
        username: 'asi_amit',
        password: 'police123',
        role: 'police',
        badgeNumber: 'POL003',
        department: 'Cyber Crime Division',
        rank: 'Assistant Sub Inspector',
        phone: '+91-9876543212',
        station: 'Cyber Crime Police Station',
        jurisdiction: 'Delhi',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      },
      {
        name: 'Head Constable Sunita Devi',
        email: 'sunita.devi@police.gov.in',
        username: 'hc_sunita',
        password: 'police123',
        role: 'police',
        badgeNumber: 'POL004',
        department: 'Cyber Crime Division',
        rank: 'Head Constable',
        phone: '+91-9876543213',
        station: 'Cyber Crime Police Station',
        jurisdiction: 'Delhi',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      },
      {
        name: 'Constable Vikram Patel',
        email: 'vikram.patel@police.gov.in',
        username: 'const_vikram',
        password: 'police123',
        role: 'police',
        badgeNumber: 'POL005',
        department: 'Cyber Crime Division',
        rank: 'Constable',
        phone: '+91-9876543214',
        station: 'Cyber Crime Police Station',
        jurisdiction: 'Delhi',
        isActive: true,
        createdAt: new Date(),
        lastLogin: null
      }
    ];
    
    // Hash passwords and insert users
    for (const user of policeUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const userData = {
        ...user,
        password: hashedPassword
      };
      
      // Check if user already exists
      const existingUser = await db.collection('users').findOne({
        $or: [
          { email: user.email },
          { username: user.username },
          { badgeNumber: user.badgeNumber }
        ]
      });
      
      if (!existingUser) {
        await db.collection('users').insertOne(userData);
        console.log(`✅ Created police user: ${user.name} (${user.badgeNumber})`);
      } else {
        console.log(`⚠️  User already exists: ${user.name} (${user.badgeNumber})`);
      }
    }
    
    console.log('\n🎉 Police users creation completed!');
    console.log('\n📋 Police Login Credentials:');
    console.log('================================');
    policeUsers.forEach(user => {
      console.log(`👮 ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Badge: ${user.badgeNumber}`);
      console.log(`   Rank: ${user.rank}`);
      console.log('   ---');
    });
    
    console.log('\n🌐 Police Portal URL: http://localhost:5173/police-portal');
    
  } catch (error) {
    console.error('Error creating police users:', error);
  } finally {
    await client.close();
  }
}

// Run the script
createPoliceUsers();
