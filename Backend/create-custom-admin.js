const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB connection string - replace with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';

async function createCustomAdmin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Get admin details from command line arguments or use defaults
    const args = process.argv.slice(2);
    const adminEmail = args[0] || 'admin@fraudlens.com';
    const adminPassword = args[1] || 'admin123';
    const adminName = args[2] || 'System Administrator';
    
    console.log('Creating admin with:');
    console.log('Email:', adminEmail);
    console.log('Name:', adminName);
    console.log('Password:', adminPassword);
    
    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('❌ Admin already exists with email:', adminEmail);
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
    
    console.log('✅ Admin created successfully!');
    console.log('Admin ID:', result.insertedId);
    console.log('Email:', adminEmail);
    console.log('Name:', adminName);
    console.log('\n🔐 You can now login with these credentials to access the admin portal.');
    console.log('⚠️  Please change the password after first login for security.');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the function
createCustomAdmin();
