const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  name: 'Test User',
  email: 'testuser@example.com',
  password: 'password123',
  phone: '9876543210'
};

const TEST_ADMIN = {
  email: 'admin@fraudlens.com',
  password: 'admin123'
};

// Test utilities
let userToken = '';
let adminToken = '';
let testCaseId = '';

const log = (message, data = null) => {
  console.log(`\n✓ ${message}`);
  if (data) {
    console.log(`  Data:`, JSON.stringify(data, null, 2));
  }
};

const error = (message, err = null) => {
  console.log(`\n✗ ${message}`);
  if (err) {
    console.log(`  Error:`, err.response?.data || err.message);
  }
};

// API helpers
const api = {
  post: (url, data, headers = {}) => axios.post(`${BASE_URL}${url}`, data, { headers }),
  get: (url, headers = {}) => axios.get(`${BASE_URL}${url}`, { headers }),
  put: (url, data, headers = {}) => axios.put(`${BASE_URL}${url}`, data, { headers })
};

const authHeaders = (token) => ({ 'Authorization': `Bearer ${token}` });

// Test functions
async function testUserRegistration() {
  try {
    const response = await api.post('/auth/register', TEST_USER);
    if (response.data.success) {
      userToken = response.data.token;
      log('User registration successful', { 
        userId: response.data.user.id,
        email: response.data.user.email 
      });
      return true;
    }
  } catch (err) {
    // User might already exist, try login instead
    try {
      const loginResponse = await api.post('/auth/login', {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      if (loginResponse.data.success) {
        userToken = loginResponse.data.token;
        log('User login successful (user already exists)', { 
          userId: loginResponse.data.user.id,
          email: loginResponse.data.user.email 
        });
        return true;
      }
    } catch (loginErr) {
      error('User registration/login failed', loginErr);
      return false;
    }
  }
  return false;
}

async function testAdminLogin() {
  try {
    const response = await api.post('/auth/login', TEST_ADMIN);
    if (response.data.success && response.data.user.role === 'admin') {
      adminToken = response.data.token;
      log('Admin login successful', { 
        adminId: response.data.user.id,
        email: response.data.user.email 
      });
      return true;
    }
  } catch (err) {
    error('Admin login failed', err);
    return false;
  }
  return false;
}

async function testUserProfileCreation() {
  try {
    const profileData = {
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        dateOfBirth: '1990-01-01',
        gender: 'Other'
      },
      contactInfo: {
        email: TEST_USER.email,
        phone: TEST_USER.phone
      },
      governmentIds: {
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F'
      },
      addressInfo: {
        currentAddress: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        }
      }
    };

    const response = await api.post('/user/profile', profileData, authHeaders(userToken));
    if (response.data.success) {
      log('User profile creation successful');
      return true;
    }
  } catch (err) {
    error('User profile creation failed', err);
    return false;
  }
  return false;
}

async function testCaseRegistration() {
  try {
    const caseData = {
      personalInfo: {
        firstName: 'Test',
        lastName: 'User',
        email: TEST_USER.email,
        phone: TEST_USER.phone,
        aadhaarNumber: '123456789012',
        panNumber: 'ABCDE1234F'
      },
      incidentInfo: {
        caseType: 'financial_fraud',
        incidentDate: '2024-01-15',
        description: 'Test fraud case for system testing',
        financialLoss: '50000',
        reportedBefore: false
      },
      scammerInfo: {
        phoneNumber: '9999999999',
        name: 'Test Scammer',
        communicationMethod: 'phone_call',
        additionalInfo: 'Test scammer details'
      }
    };

    const response = await api.post('/user/register-case', caseData, authHeaders(userToken));
    if (response.data.success) {
      testCaseId = response.data.caseId;
      log('Case registration successful', { caseId: testCaseId });
      return true;
    }
  } catch (err) {
    error('Case registration failed', err);
    return false;
  }
  return false;
}

async function testUserDashboard() {
  try {
    const response = await api.get('/user/dashboard', authHeaders(userToken));
    if (response.data.success) {
      log('User dashboard access successful', {
        totalCases: response.data.data.totalCases,
        recentCases: response.data.data.recentCases?.length || 0
      });
      return true;
    }
  } catch (err) {
    error('User dashboard access failed', err);
    return false;
  }
  return false;
}

async function testCaseDetails() {
  if (!testCaseId) {
    error('No test case ID available');
    return false;
  }

  try {
    const response = await api.get(`/cases/${testCaseId}`, authHeaders(userToken));
    if (response.data.success) {
      log('Case details access successful', {
        caseId: response.data.data.caseId,
        status: response.data.data.status
      });
      return true;
    }
  } catch (err) {
    error('Case details access failed', err);
    return false;
  }
  return false;
}

async function testAdminDashboard() {
  try {
    const response = await api.get('/admin/dashboard-stats', authHeaders(adminToken));
    if (response.data.success) {
      log('Admin dashboard access successful', {
        totalUsers: response.data.data.totalUsers,
        totalCases: response.data.data.totalCases,
        activeCases: response.data.data.activeCases
      });
      return true;
    }
  } catch (err) {
    error('Admin dashboard access failed', err);
    return false;
  }
  return false;
}

async function testAdminCaseManagement() {
  if (!testCaseId) {
    error('No test case ID available');
    return false;
  }

  try {
    // Test admin viewing case details
    const caseResponse = await api.get(`/cases/${testCaseId}`, authHeaders(adminToken));
    if (!caseResponse.data.success) {
      error('Admin case details access failed');
      return false;
    }

    // Test admin updating case status
    const statusResponse = await api.put(`/cases/${testCaseId}/status`, 
      { status: 'under_review' }, 
      authHeaders(adminToken)
    );
    if (!statusResponse.data.success) {
      error('Admin case status update failed');
      return false;
    }

    // Test admin adding comment
    const commentResponse = await api.post(`/cases/${testCaseId}/comment`, 
      { comment: 'Test admin comment for system testing' }, 
      authHeaders(adminToken)
    );
    if (!commentResponse.data.success) {
      error('Admin comment addition failed');
      return false;
    }

    log('Admin case management successful', {
      caseId: testCaseId,
      newStatus: 'under_review'
    });
    return true;
  } catch (err) {
    error('Admin case management failed', err);
    return false;
  }
}

async function testUserCaseHistory() {
  try {
    const response = await api.get('/user/cases', authHeaders(userToken));
    if (response.data.success) {
      log('User case history access successful', {
        totalCases: response.data.data.length
      });
      return true;
    }
  } catch (err) {
    error('User case history access failed', err);
    return false;
  }
  return false;
}

// Main test execution
async function runCompleteSystemTest() {
  console.log('🚀 Starting Complete System Test');
  console.log('=====================================');

  const tests = [
    { name: 'User Registration/Login', fn: testUserRegistration },
    { name: 'Admin Login', fn: testAdminLogin },
    { name: 'User Profile Creation', fn: testUserProfileCreation },
    { name: 'Case Registration', fn: testCaseRegistration },
    { name: 'User Dashboard', fn: testUserDashboard },
    { name: 'Case Details Access', fn: testCaseDetails },
    { name: 'User Case History', fn: testUserCaseHistory },
    { name: 'Admin Dashboard', fn: testAdminDashboard },
    { name: 'Admin Case Management', fn: testAdminCaseManagement }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n🔍 Testing: ${test.name}`);
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      error(`Test "${test.name}" threw an exception`, err);
      failed++;
    }
  }

  console.log('\n=====================================');
  console.log('📊 Test Results Summary');
  console.log('=====================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! System is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Handle errors and run tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Check if server is running before starting tests
async function checkServerStatus() {
  try {
    await axios.get('http://localhost:5000/');
    log('Server is running and accessible');
    return true;
  } catch (err) {
    error('Server is not running or not accessible. Please start the server first.');
    console.log('Run: cd Backend && npm start');
    return false;
  }
}

// Main execution
(async () => {
  const serverRunning = await checkServerStatus();
  if (serverRunning) {
    await runCompleteSystemTest();
  } else {
    process.exit(1);
  }
})();
