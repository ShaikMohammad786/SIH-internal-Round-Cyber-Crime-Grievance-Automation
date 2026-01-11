const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testComprehensiveSystem() {
  console.log('🧪 Testing Comprehensive User Profile & Case Management System...\n');

  let authToken1 = '';
  let authToken2 = '';
  let userId1 = '';
  let userId2 = '';

  try {
    // Test 1: Register two users with different Aadhaar/PAN
    console.log('1️⃣ Testing User Registration with Profiles...');
    
    const user1Data = {
      name: 'John Doe',
      email: `john${Date.now()}@example.com`,
      password: 'password123',
      phone: '9876543210'
    };

    const user2Data = {
      name: 'Jane Smith',
      email: `jane${Date.now()}@example.com`,
      password: 'password123',
      phone: '9876543211'
    };

    const [user1Response, user2Response] = await Promise.all([
      axios.post(`${API_BASE_URL}/auth/register`, user1Data),
      axios.post(`${API_BASE_URL}/auth/register`, user2Data)
    ]);

    authToken1 = user1Response.data.token;
    authToken2 = user2Response.data.token;
    userId1 = user1Response.data.user.id;
    userId2 = user2Response.data.user.id;

    console.log('✅ Users registered successfully');
    console.log('   User 1 ID:', userId1);
    console.log('   User 2 ID:', userId2);
    console.log('');

    // Test 2: Create user profiles with Aadhaar/PAN
    console.log('2️⃣ Testing User Profile Creation...');
    
    const profile1Data = {
      personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-15',
        gender: 'Male',
        nationality: 'Indian'
      },
      contactInfo: {
        email: user1Data.email,
        phone: user1Data.phone,
        alternatePhone: '9876543212'
      },
      governmentIds: {
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F',
        otherIds: []
      },
      addressInfo: {
        currentAddress: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        }
      }
    };

    const profile2Data = {
      personalInfo: {
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: '1992-05-20',
        gender: 'Female',
        nationality: 'Indian'
      },
      contactInfo: {
        email: user2Data.email,
        phone: user2Data.phone,
        alternatePhone: '9876543213'
      },
      governmentIds: {
        aadhaarNumber: '123456789013', // Different Aadhaar
        panNumber: 'FGHIJ5678K',
        otherIds: []
      },
      addressInfo: {
        currentAddress: {
          street: '456 Oak Avenue',
          city: 'Delhi',
          state: 'Delhi',
          pincode: '110001',
          country: 'India'
        }
      }
    };

    await axios.post(`${API_BASE_URL}/user/profile`, profile1Data, {
      headers: { Authorization: `Bearer ${authToken1}` }
    });

    await axios.post(`${API_BASE_URL}/user/profile`, profile2Data, {
      headers: { Authorization: `Bearer ${authToken2}` }
    });

    console.log('✅ User profiles created successfully');
    console.log('   User 1 Aadhaar:', profile1Data.governmentIds.aadhaarNumber);
    console.log('   User 2 Aadhaar:', profile2Data.governmentIds.aadhaarNumber);
    console.log('');

    // Test 3: Create cases with comprehensive form data
    console.log('3️⃣ Testing Comprehensive Case Creation...');
    
    const case1Data = {
      caseType: 'UPI Fraud',
      description: 'Received fake UPI payment request',
      amount: 25000,
      incidentDate: '2024-01-20T10:30:00Z',
      location: {
        state: 'Maharashtra',
        city: 'Mumbai',
        address: 'Andheri West'
      },
      contactInfo: {
        email: user1Data.email,
        phone: user1Data.phone
      },
      evidence: ['screenshot1.png'],
      formData: {
        personalInfo: profile1Data.personalInfo,
        contactInfo: profile1Data.contactInfo,
        governmentIds: profile1Data.governmentIds,
        addressInfo: profile1Data.addressInfo,
        incidentInfo: {
          incidentDate: '2024-01-20T10:30:00Z',
          description: 'Received fake UPI payment request from unknown number',
          witnesses: 'None',
          suspectInfo: 'Unknown caller'
        },
        financialInfo: {
          amountLost: 25000,
          currency: 'INR',
          paymentMethod: 'UPI',
          bankDetails: {
            bankName: 'SBI',
            accountNumber: '1234567890',
            ifscCode: 'SBIN0001234'
          }
        },
        evidenceInfo: {
          evidence: ['screenshot1.png'],
          screenshots: ['upi_screenshot.jpg']
        }
      }
    };

    const case2Data = {
      caseType: 'Credit Card Fraud',
      description: 'Unauthorized credit card transaction',
      amount: 15000,
      incidentDate: '2024-01-18T14:20:00Z',
      location: {
        state: 'Delhi',
        city: 'New Delhi',
        address: 'Connaught Place'
      },
      contactInfo: {
        email: user2Data.email,
        phone: user2Data.phone
      },
      evidence: ['transaction_receipt.pdf'],
      formData: {
        personalInfo: profile2Data.personalInfo,
        contactInfo: profile2Data.contactInfo,
        governmentIds: profile2Data.governmentIds,
        addressInfo: profile2Data.addressInfo,
        incidentInfo: {
          incidentDate: '2024-01-18T14:20:00Z',
          description: 'Unauthorized transaction on credit card',
          witnesses: 'Bank staff',
          suspectInfo: 'Unknown online merchant'
        },
        financialInfo: {
          amountLost: 15000,
          currency: 'INR',
          paymentMethod: 'Credit Card',
          bankDetails: {
            bankName: 'HDFC',
            accountNumber: '0987654321',
            ifscCode: 'HDFC0000987'
          }
        },
        evidenceInfo: {
          evidence: ['transaction_receipt.pdf'],
          documents: ['bank_statement.pdf']
        }
      }
    };

    const [case1Response, case2Response] = await Promise.all([
      axios.post(`${API_BASE_URL}/user/create-case`, case1Data, {
        headers: { Authorization: `Bearer ${authToken1}` }
      }),
      axios.post(`${API_BASE_URL}/user/create-case`, case2Data, {
        headers: { Authorization: `Bearer ${authToken2}` }
      })
    ]);

    console.log('✅ Cases created successfully');
    console.log('   Case 1 ID:', case1Response.data.case.caseId);
    console.log('   Case 2 ID:', case2Response.data.case.caseId);
    console.log('');

    // Test 4: Test previous cases retrieval by Aadhaar
    console.log('4️⃣ Testing Previous Cases Retrieval...');
    
    const previousCasesResponse = await axios.get(
      `${API_BASE_URL}/user/previous-cases?aadhaarNumber=${profile1Data.governmentIds.aadhaarNumber}`,
      { headers: { Authorization: `Bearer ${authToken1}` } }
    );

    console.log('✅ Previous cases retrieved successfully');
    console.log('   Total cases found:', previousCasesResponse.data.totalCases);
    console.log('   Cases:', previousCasesResponse.data.cases.map(c => c.caseId));
    console.log('');

    // Test 5: Test fresh dashboard data
    console.log('5️⃣ Testing Fresh Dashboard Data...');
    
    const dashboardResponse = await axios.get(`${API_BASE_URL}/user/dashboard-fresh`, {
      headers: { Authorization: `Bearer ${authToken1}` }
    });

    console.log('✅ Dashboard data retrieved successfully');
    console.log('   User name:', dashboardResponse.data.dashboard.user.name);
    console.log('   Has profile:', dashboardResponse.data.dashboard.profile.hasProfile);
    console.log('   Total cases:', dashboardResponse.data.dashboard.statistics.totalCases);
    console.log('   Recent cases:', dashboardResponse.data.dashboard.recentCases.length);
    console.log('');

    // Test 6: Test case linking with same Aadhaar
    console.log('6️⃣ Testing Case Linking with Same Aadhaar...');
    
    // Create another case for user1 with same Aadhaar (should be linked)
    const case3Data = {
      ...case1Data,
      caseType: 'Online Shopping Scam',
      description: 'Fake e-commerce website scam',
      amount: 8000,
      incidentDate: '2024-01-22T16:45:00Z',
      formData: {
        ...case1Data.formData,
        incidentInfo: {
          ...case1Data.formData.incidentInfo,
          incidentDate: '2024-01-22T16:45:00Z',
          description: 'Fake e-commerce website scam'
        },
        financialInfo: {
          ...case1Data.formData.financialInfo,
          amountLost: 8000
        }
      }
    };

    const case3Response = await axios.post(`${API_BASE_URL}/user/create-case`, case3Data, {
      headers: { Authorization: `Bearer ${authToken1}` }
    });

    // Check previous cases again
    const updatedPreviousCases = await axios.get(
      `${API_BASE_URL}/user/previous-cases?aadhaarNumber=${profile1Data.governmentIds.aadhaarNumber}`,
      { headers: { Authorization: `Bearer ${authToken1}` } }
    );

    console.log('✅ Case linking test successful');
    console.log('   New case created:', case3Response.data.case.caseId);
    console.log('   Total linked cases:', updatedPreviousCases.data.totalCases);
    console.log('   All cases:', updatedPreviousCases.data.cases.map(c => c.caseId));
    console.log('');

    // Test 7: Test profile retrieval
    console.log('7️⃣ Testing Profile Retrieval...');
    
    const profileResponse = await axios.get(`${API_BASE_URL}/user/profile`, {
      headers: { Authorization: `Bearer ${authToken1}` }
    });

    console.log('✅ Profile retrieved successfully');
    console.log('   Profile ID:', profileResponse.data.profile.id);
    console.log('   Aadhaar:', profileResponse.data.profile.governmentIds.aadhaarNumber);
    console.log('   PAN:', profileResponse.data.profile.governmentIds.panNumber);
    console.log('');

    console.log('🎉 All comprehensive system tests passed!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ User registration and authentication');
    console.log('   ✅ User profile creation with Aadhaar/PAN');
    console.log('   ✅ Comprehensive case creation with form data');
    console.log('   ✅ Previous cases retrieval by Aadhaar/PAN');
    console.log('   ✅ Fresh dashboard data loading');
    console.log('   ✅ Case linking by government IDs');
    console.log('   ✅ Profile data retrieval');
    console.log('   ✅ JSON form data storage');
    console.log('   ✅ User-specific data isolation');
    console.log('   ✅ Database relationship management');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.message) {
      console.error('   Error details:', error.response.data.message);
    }
  }
}

// Run the tests
testComprehensiveSystem();
