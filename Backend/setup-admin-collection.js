const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function setupAdminCollection() {
  let client;
  
  try {
    console.log('🔧 Setting up Admin Collection...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    
    // Check if admin collection exists
    const adminUsers = await db.collection('admins').find({}).toArray();
    
    if (adminUsers.length > 0) {
      console.log(`📊 Found ${adminUsers.length} admin users in collection`);
      
      // Hash passwords for existing admin users
      for (const admin of adminUsers) {
        if (admin.password && !admin.password.startsWith('$2b$')) {
          console.log(`🔐 Hashing password for admin: ${admin.email || admin.username}`);
          
          const hashedPassword = await bcrypt.hash(admin.password, 10);
          
          await db.collection('admins').updateOne(
            { _id: admin._id },
            { 
              $set: { 
                password: hashedPassword,
                updatedAt: new Date()
              }
            }
          );
          
          console.log(`✅ Password hashed for ${admin.email || admin.username}`);
        } else {
          console.log(`✅ Password already hashed for ${admin.email || admin.username}`);
        }
      }
    } else {
      console.log('📝 No admin users found, creating sample admin...');
      
      // Create sample admin with hashed password
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const sampleAdmin = {
        username: 'admin',
        email: 'admin@fraudlens.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('admins').insertOne(sampleAdmin);
      console.log('✅ Sample admin created with hashed password');
    }
    
    // Display all admin users
    console.log('\n👥 Admin Users in Database:');
    const allAdmins = await db.collection('admins').find({}).toArray();
    
    allAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Admin:`);
      console.log(`   ID: ${admin._id}`);
      console.log(`   Username: ${admin.username || 'N/A'}`);
      console.log(`   Email: ${admin.email || 'N/A'}`);
      console.log(`   Role: ${admin.role || 'N/A'}`);
      console.log(`   Password Hashed: ${admin.password?.startsWith('$2b$') ? 'Yes' : 'No'}`);
    });
    
    console.log('\n🔐 ADMIN LOGIN CREDENTIALS:');
    console.log('==========================');
    console.log('📧 Email: admin@fraudlens.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('');
    console.log('🌐 Login at: http://localhost:3000/login');
    console.log('📊 Admin Dashboard: http://localhost:3000/admin-dashboard');
    
  } catch (error) {
    console.error('❌ Error setting up admin collection:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

setupAdminCollection();

