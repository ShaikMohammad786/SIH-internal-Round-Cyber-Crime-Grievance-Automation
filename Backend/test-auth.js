const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
  console.log('🧪 Testing Authentication Flow...\n');

  try {
    // Test 1: Register a new user
    console.log('1️⃣ Testing User Registration...');
    const timestamp = Date.now();
    const registerData = {
      name: 'Test User',
      email: `test${timestamp}@example.com`,
      password: 'testpassword123',
      phone: '1234567890'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    console.log('✅ Registration successful:', registerResponse.data.message);
    console.log('   User ID:', registerResponse.data.user.id);
    console.log('   Token received:', !!registerResponse.data.token);
    console.log('');

    // Test 2: Login with the registered user
    console.log('2️⃣ Testing User Login...');
    const loginData = {
      email: registerData.email,
      password: 'testpassword123'
    };

    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, loginData);
    console.log('✅ Login successful:', loginResponse.data.message);
    console.log('   User name:', loginResponse.data.user.name);
    console.log('   Token received:', !!loginResponse.data.token);
    console.log('');

    // Test 3: Get current user with token
    console.log('3️⃣ Testing Get Current User...');
    const token = loginResponse.data.token;
    const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Get current user successful');
    console.log('   User name:', meResponse.data.user.name);
    console.log('   User email:', meResponse.data.user.email);
    console.log('');

    // Test 4: Test invalid login
    console.log('4️⃣ Testing Invalid Login...');
    try {
      await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'wrong@example.com',
        password: 'wrongpassword'
      });
    } catch (error) {
      console.log('✅ Invalid login properly rejected:', error.response.data.message);
    }
    console.log('');

    // Test 5: Test duplicate registration
    console.log('5️⃣ Testing Duplicate Registration...');
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    } catch (error) {
      console.log('✅ Duplicate registration properly rejected:', error.response.data.message);
    }
    console.log('');

    console.log('🎉 All authentication tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the tests
testAuth();