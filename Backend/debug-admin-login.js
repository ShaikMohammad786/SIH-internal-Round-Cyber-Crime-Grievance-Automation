const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fraudlens';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function debugAdminLogin() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Test admin login
    const email = 'admin@gmail.com';
    const password = 'admin123';
    
    console.log('\n🔍 Testing admin login...');
    console.log('Email:', email);
    console.log('Password:', password);
    
    // Find user in both collections
    let user = await db.collection('users').findOne({ email });
    let isAdmin = false;
    
    if (!user) {
      console.log('❌ User not found in users collection');
      user = await db.collection('admins').findOne({ email });
      if (user) {
        console.log('✅ User found in admins collection');
        isAdmin = true;
      } else {
        console.log('❌ User not found in admins collection either');
        return;
      }
    } else {
      console.log('✅ User found in users collection');
    }
    
    console.log('\n👤 User details:');
    console.log('- ID:', user._id);
    console.log('- Email:', user.email);
    console.log('- Name:', user.name);
    console.log('- Role:', user.role);
    console.log('- Is Admin Collection:', isAdmin);
    
    // Check password
    console.log('\n🔐 Checking password...');
    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Invalid password');
      return;
    }
    
    // Set role based on collection
    if (isAdmin) {
      user.role = 'admin';
      console.log('✅ Role set to admin');
    }
    
    // Generate JWT token
    console.log('\n🎫 Generating JWT token...');
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('Token generated:', token.substring(0, 50) + '...');
    
    // Decode token to verify
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('\n🔍 Decoded token:');
    console.log('- User ID:', decoded.userId);
    console.log('- Email:', decoded.email);
    console.log('- Role:', decoded.role);
    console.log('- Expires:', new Date(decoded.exp * 1000));
    
    // Test API endpoint
    console.log('\n🌐 Testing API endpoint...');
    const axios = require('axios');
    
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: email,
        password: password
      });
      
      console.log('✅ API Response:');
      console.log('- Success:', response.data.success);
      console.log('- Message:', response.data.message);
      console.log('- User Role:', response.data.user?.role);
      console.log('- Token Length:', response.data.token?.length);
      
    } catch (apiError) {
      console.log('❌ API Error:', apiError.response?.data || apiError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the function
debugAdminLogin();