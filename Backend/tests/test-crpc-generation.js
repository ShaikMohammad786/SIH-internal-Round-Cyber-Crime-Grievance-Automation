const axios = require('axios');

async function testCRPCGeneration() {
  try {
    console.log('🧪 Testing CRPC generation...');
    
    // Login as admin
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@fraudlens.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Admin logged in');
    
    // Get a case ID
    const casesResponse = await axios.get('http://localhost:5000/api/admin/cases', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (casesResponse.data.data.cases.length > 0) {
      const caseId = casesResponse.data.data.cases[0]._id;
      console.log('📄 Found case:', caseId);
      
      // Generate CRPC
      const crpcResponse = await axios.post(`http://localhost:5000/api/crpc/generate/${caseId}`, {
        scammerId: 'test-scammer-id'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ CRPC generation response:', crpcResponse.data);
    } else {
      console.log('❌ No cases found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testCRPCGeneration();
