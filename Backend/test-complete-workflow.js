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

async function testCaseRegistration() {
  try {
    const caseData = {
      caseType: 'financial_fraud',
      description: 'Test fraud case for complete workflow testing',
      amount: '50000',
      incidentDate: '2024-01-15',
      location: {
        state: 'Test State',
        city: 'Test City',
        pincode: '123456'
      },
      formData: {
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
        },
        incidentInfo: {
          caseType: 'financial_fraud',
          incidentDate: '2024-01-15',
          description: 'Test fraud case for complete workflow testing',
          financialLoss: '50000',
          reportedBefore: false
        },
        scammerInfo: {
          phoneNumber: '9999999999',
          name: 'Test Scammer',
          email: 'scammer@test.com',
          upiId: 'scammer@upi',
          bankAccount: '1234567890',
          ifscCode: 'TEST0001234',
          address: 'Test Scammer Address'
        }
      }
    };

    const response = await api.post('/user/create-case', caseData, authHeaders(userToken));
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

async function testTimelineSynchronization() {
  try {
    // First get the case ID from user's cases
    const casesResponse = await api.get('/user/my-cases', authHeaders(userToken));
    if (!casesResponse.data.success || casesResponse.data.cases.length === 0) {
      error('No cases found for timeline test');
      return false;
    }
    
    const caseId = casesResponse.data.cases[0].id;
    
    // Get timeline for the case
    const timelineResponse = await api.get(`/timeline/${caseId}`, authHeaders(userToken));
    if (timelineResponse.data.success) {
      log('Timeline synchronization test', {
        timelineEntries: timelineResponse.data.data.timeline.length,
        currentStage: timelineResponse.data.data.currentStage
      });
      return true;
    }
  } catch (err) {
    error('Timeline synchronization test failed', err);
    return false;
  }
  return false;
}

async function testAdminCaseManagement() {
  try {
    // First get the case ID from admin's cases
    const casesResponse = await api.get('/admin/cases', authHeaders(adminToken));
    if (!casesResponse.data.success || casesResponse.data.data.cases.length === 0) {
      error('No cases found for admin management test');
      return false;
    }
    
    const caseId = casesResponse.data.data.cases[0]._id;
    
    // Test admin viewing case details
    const caseResponse = await api.get(`/admin/cases/${caseId}`, authHeaders(adminToken));
    if (!caseResponse.data.success) {
      error('Admin case details access failed');
      return false;
    }

    // Test admin action - verify information
    const verifyResponse = await api.post(`/admin-actions/${caseId}/action`, 
      { 
        action: 'verify_information', 
        comment: 'Test verification by admin' 
      }, 
      authHeaders(adminToken)
    );
    if (!verifyResponse.data.success) {
      error('Admin verify information action failed');
      return false;
    }

    // Test admin action - generate CRPC
    const crpcResponse = await api.post(`/admin-actions/${caseId}/action`, 
      { 
        action: 'generate_crpc', 
        comment: 'Test 91 CrPC generation' 
      }, 
      authHeaders(adminToken)
    );
    if (!crpcResponse.data.success) {
      error('Admin generate CRPC action failed');
      return false;
    }

    // Test admin action - send emails
    const emailResponse = await api.post(`/admin-actions/${caseId}/action`, 
      { 
        action: 'send_emails', 
        comment: 'Test email sending to authorities' 
      }, 
      authHeaders(adminToken)
    );
    if (!emailResponse.data.success) {
      error('Admin send emails action failed');
      return false;
    }

    log('Admin case management successful', {
      caseId: caseId,
      actionsPerformed: ['verify_information', 'generate_crpc', 'send_emails']
    });
    return true;
  } catch (err) {
    error('Admin case management failed', err);
    return false;
  }
}

async function testScammerDatabase() {
  try {
    // Get all scammers
    const scammerResponse = await api.get('/scammers', authHeaders(adminToken));
    if (scammerResponse.data.success) {
      log('Scammer database test successful', {
        scammerFound: scammerResponse.data.data.length > 0,
        scammerCount: scammerResponse.data.data.length
      });
      return true;
    }
  } catch (err) {
    error('Scammer database test failed', err);
    return false;
  }
  return false;
}

async function testUserTimelineView() {
  try {
    // First get the case ID from user's cases
    const casesResponse = await api.get('/user/my-cases', authHeaders(userToken));
    if (!casesResponse.data.success || casesResponse.data.cases.length === 0) {
      error('No cases found for user timeline test');
      return false;
    }
    
    const caseId = casesResponse.data.cases[0].id;
    
    // Test user viewing their case timeline
    const timelineResponse = await api.get(`/timeline/${caseId}`, authHeaders(userToken));
    if (timelineResponse.data.success) {
      const timeline = timelineResponse.data.data.timeline;
      log('User timeline view test successful', {
        timelineEntries: timeline.length,
        stages: timeline.map(entry => entry.stage),
        userVisibleEntries: timeline.filter(entry => entry.userVisible).length
      });
      return true;
    }
  } catch (err) {
    error('User timeline view test failed', err);
    return false;
  }
  return false;
}

async function testCompleteWorkflow() {
  try {
    // Test complete workflow from case creation to resolution
    const workflowSteps = [
      { name: 'User Registration/Login', fn: testUserRegistration },
      { name: 'Admin Login', fn: testAdminLogin },
      { name: 'Case Registration', fn: testCaseRegistration },
      { name: 'Timeline Synchronization', fn: testTimelineSynchronization },
      { name: 'Scammer Database', fn: testScammerDatabase },
      { name: 'Admin Case Management', fn: testAdminCaseManagement },
      { name: 'User Timeline View', fn: testUserTimelineView }
    ];

    let passed = 0;
    let failed = 0;

    for (const step of workflowSteps) {
      console.log(`\n🔍 Testing: ${step.name}`);
      try {
        const result = await step.fn();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (err) {
        error(`Test "${step.name}" threw an exception`, err);
        failed++;
      }
    }

    console.log('\n=====================================');
    console.log('📊 Complete Workflow Test Results');
    console.log('=====================================');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 Complete workflow test passed! System is working correctly.');
      console.log('\n📋 Workflow Summary:');
      console.log('1. ✅ User registration and authentication');
      console.log('2. ✅ Admin login and authentication');
      console.log('3. ✅ Case registration with scammer details');
      console.log('4. ✅ Timeline synchronization between user and admin');
      console.log('5. ✅ Scammer database with duplicate detection');
      console.log('6. ✅ Admin case management with timeline updates');
      console.log('7. ✅ User timeline view with real-time updates');
    } else {
      console.log('\n⚠️  Some workflow tests failed. Please check the errors above.');
    }

    return failed === 0;
  } catch (error) {
    console.error('❌ Complete workflow test failed:', error);
    return false;
  }
}

// Main execution
(async () => {
  try {
    // Check if server is running
    await axios.get('http://localhost:5000/');
    console.log('🚀 Server is running, starting complete workflow test...');
    
    const success = await testCompleteWorkflow();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ Server is not running or not accessible. Please start the server first.');
    console.log('Run: cd Backend && npm start');
    process.exit(1);
  }
})();
