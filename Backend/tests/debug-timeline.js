const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function debugTimeline() {
  try {
    // First, login as user
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testuser@example.com',
      password: 'password123'
    });
    
    const userToken = loginResponse.data.token;
    console.log('✅ User logged in');
    
    // Get user's cases
    const casesResponse = await axios.get(`${BASE_URL}/user/my-cases`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    
    console.log('📋 User cases:', casesResponse.data);
    
    if (casesResponse.data.success && casesResponse.data.cases.length > 0) {
      const caseId = casesResponse.data.cases[0].id;
      console.log('🔍 Testing timeline for case:', caseId);
      
      // Test timeline API
      const timelineResponse = await axios.get(`${BASE_URL}/timeline/${caseId}`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      
      console.log('📅 Timeline response:', timelineResponse.data);
    } else {
      console.log('❌ No cases found for user');
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.response?.data || error.message);
  }
}

debugTimeline();
