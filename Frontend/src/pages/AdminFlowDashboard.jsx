import React, { useState, useEffect } from 'react';
import { caseFlowAPI } from '../utils/caseFlowAPI';
import { authAPI } from '../utils/auth';
import CaseFlowTracker from '../components/CaseFlowTracker';
import './AdminFlowDashboard.css';


const AdminFlowDashboard = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
    fetchCases();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await authAPI.getCurrentUser();
        if (response.success) {
          setIsAuthenticated(true);
          setUser(response.user);
          setMessage(`✅ Authenticated as ${response.user.name} (${response.user.role})`);
        } else {
          setMessage(`❌ Authentication failed: ${response.message}`);
          setIsAuthenticated(false);
        }
      } else {
        setMessage('❌ No authentication token found');
        setIsAuthenticated(false);
      }
    } catch (error) {
      setMessage(`❌ Auth check error: ${error.message}`);
      setIsAuthenticated(false);
    }
  };

  const loginAsAdmin = async () => {
    try {
      setMessage('Logging in as admin...');
      const response = await authAPI.login('admin@fraudlens.com', 'admin123');
      if (response.success) {
        setIsAuthenticated(true);
        setUser(response.user);
        setMessage(`✅ Logged in as ${response.user.name} (${response.user.role})`);
      } else {
        setMessage(`❌ Login failed: ${response.message}`);
      }
    } catch (error) {
      setMessage(`❌ Login error: ${error.message}`);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      // This would be an API call to get all cases
      // For now, we'll simulate with empty array
      setCases([]);
    } catch (err) {
      setMessage(`Error loading cases: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStepAction = async (caseId, step, action) => {
    try {
      setMessage(`Processing ${action} for case ${caseId}...`);
      
      // Debug: Check authentication
      const token = localStorage.getItem('token');
      console.log('🔍 Debug - Token exists:', !!token);
      console.log('🔍 Debug - Case ID:', caseId);
      console.log('🔍 Debug - Step:', step);
      
      switch (step) {
        case 2:
          await processInformationVerification(caseId);
          break;
        case 3:
          await process91CRPCGeneration(caseId);
          break;
        case 4:
          await processEmailSending(caseId);
          break;
        case 5:
          await processAuthorization(caseId);
          break;
        case 6:
          await processPoliceAssignment(caseId);
          break;
        case 7:
          await processEvidenceCollection(caseId);
          break;
        case 8:
          await processResolution(caseId);
          break;
        case 9:
          await processClosure(caseId);
          break;
        default:
          setMessage('Invalid step');
      }
      
      setMessage(`✅ ${action} completed successfully`);
      if (selectedCase && selectedCase.id === caseId) {
        // Refresh case data
        const response = await caseFlowAPI.getCaseStatus(caseId);
        if (response.success) {
          setSelectedCase(response.data.case);
        }
      }
    } catch (err) {
      console.error('❌ Step action error:', err);
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  const processInformationVerification = async (caseId) => {
    try {
      console.log('🔍 Processing information verification for case:', caseId);
      setMessage('Verifying information...');
      
      const response = await caseFlowAPI.progressStep(caseId, 2);
      console.log('🔍 Verification response:', response);
      
      if (response.success) {
        setMessage(`✅ Information verified successfully!`);
        
        // Refresh case data
        const statusResponse = await caseFlowAPI.getCaseStatus(caseId);
        if (statusResponse.success) {
          setSelectedCase(statusResponse.data.case);
        }
      } else {
        setMessage(`❌ Failed to verify information: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Information verification error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const process91CRPCGeneration = async (caseId) => {
    try {
      console.log('📋 Generating 91CRPC for case:', caseId);
      setMessage('Generating 91CRPC document...');
      
      const response = await caseFlowAPI.progressStep(caseId, 3);
      console.log('📋 91CRPC generation response:', response);
      
      if (response.success) {
        setMessage(`✅ 91CRPC document generated successfully!`);
        
        // Refresh case data to show updated status
        const statusResponse = await caseFlowAPI.getCaseStatus(caseId);
        if (statusResponse.success) {
          setSelectedCase(statusResponse.data.case);
        }
      } else {
        setMessage(`❌ Failed to generate 91CRPC: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ 91CRPC generation error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const viewCRPCDocument = async (caseId) => {
    try {
      setMessage('Loading 91CRPC document...');
      console.log('👁️ Viewing CRPC document for case:', caseId);
      
      const response = await caseFlowAPI.getCRPCDocument(caseId);
      console.log('👁️ CRPC document response:', response);
      
      if (response.success) {
        setMessage(`✅ 91CRPC document loaded! Document Number: ${response.data.documentNumber}`);
        
        // Get token for authentication
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Open document in new tab with authentication
        const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/case-flow/crpc/download/${response.data.documentId}`;
        console.log('👁️ Opening document URL:', downloadUrl);
        
        // Create a form to submit with token
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = downloadUrl;
        form.target = '_blank';
        
        // Add token as hidden input
        const tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'token';
        tokenInput.value = token;
        form.appendChild(tokenInput);
        
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
      } else {
        setMessage(`❌ Failed to load document: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ View CRPC document error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const downloadCRPCDocument = async (caseId) => {
    try {
      setMessage('Downloading 91CRPC document...');
      const response = await caseFlowAPI.getCRPCDocument(caseId);
      
      if (response.success) {
        await caseFlowAPI.downloadCRPCDocument(response.data.documentId);
        setMessage(`✅ 91CRPC document downloaded successfully!`);
      } else {
        setMessage(`❌ Failed to download document: ${response.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const processEmailSending = async (caseId) => {
    try {
      console.log('📧 Sending emails for case:', caseId);
      setMessage('Sending emails to authorities...');
      
      const response = await caseFlowAPI.progressStep(caseId, 4);
      console.log('📧 Email sending response:', response);
      
      if (response.success) {
        setMessage(`✅ Emails sent successfully!`);
        
        // Refresh case data
        const statusResponse = await caseFlowAPI.getCaseStatus(caseId);
        if (statusResponse.success) {
          setSelectedCase(statusResponse.data.case);
        }
      } else {
        setMessage(`❌ Failed to send emails: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Email sending error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const processAuthorization = async (caseId) => {
    try {
      console.log('✅ Processing authorization for case:', caseId);
      setMessage('Authorizing case...');
      
      const response = await caseFlowAPI.progressStep(caseId, 5);
      console.log('✅ Authorization response:', response);
      
      if (response.success) {
        setMessage(`✅ Case authorized successfully!`);
        
        // Refresh case data
        const statusResponse = await caseFlowAPI.getCaseStatus(caseId);
        if (statusResponse.success) {
          setSelectedCase(statusResponse.data.case);
        }
      } else {
        setMessage(`❌ Failed to authorize: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Authorization error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const processPoliceAssignment = async (caseId) => {
    try {
      console.log('👮 Processing police assignment for case:', caseId);
      setMessage('Assigning to police...');
      
      const response = await caseFlowAPI.progressStep(caseId, 6);
      console.log('👮 Police assignment response:', response);
      
      if (response.success) {
        setMessage(`✅ Case assigned to police successfully!`);
        
        // Refresh case data
        const statusResponse = await caseFlowAPI.getCaseStatus(caseId);
        if (statusResponse.success) {
          setSelectedCase(statusResponse.data.case);
        }
      } else {
        setMessage(`❌ Failed to assign to police: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Police assignment error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const processEvidenceCollection = async (caseId) => {
    try {
      console.log('📋 Processing evidence collection for case:', caseId);
      setMessage('Collecting evidence...');
      
      const response = await caseFlowAPI.progressStep(caseId, 7);
      console.log('📋 Evidence collection response:', response);
      
      if (response.success) {
        setMessage(`✅ Evidence collected successfully!`);
        
        // Refresh case data
        const statusResponse = await caseFlowAPI.getCaseStatus(caseId);
        if (statusResponse.success) {
          setSelectedCase(statusResponse.data.case);
        }
      } else {
        setMessage(`❌ Failed to collect evidence: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Evidence collection error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const processResolution = async (caseId) => {
    try {
      console.log('✅ Processing resolution for case:', caseId);
      setMessage('Resolving case...');
      
      const response = await caseFlowAPI.progressStep(caseId, 8);
      console.log('✅ Resolution response:', response);
      
      if (response.success) {
        setMessage(`✅ Case resolved successfully!`);
        
        // Refresh case data
        const statusResponse = await caseFlowAPI.getCaseStatus(caseId);
        if (statusResponse.success) {
          setSelectedCase(statusResponse.data.case);
        }
      } else {
        setMessage(`❌ Failed to resolve: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Resolution error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const processClosure = async (caseId) => {
    try {
      console.log('🔒 Processing closure for case:', caseId);
      setMessage('Closing case...');
      
      const response = await caseFlowAPI.progressStep(caseId, 9);
      console.log('🔒 Closure response:', response);
      
      if (response.success) {
        setMessage(`✅ Case closed successfully!`);
        
        // Refresh case data
        const statusResponse = await caseFlowAPI.getCaseStatus(caseId);
        if (statusResponse.success) {
          setSelectedCase(statusResponse.data.case);
        }
      } else {
        setMessage(`❌ Failed to close: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Closure error:', error);
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  const createTestCase = async () => {
    try {
      setMessage('Creating test case...');
      
      const testData = {
        caseType: 'upi-fraud',
        description: 'Test UPI fraud case for manual flow demonstration',
        amount: 50000,
        incidentDate: new Date().toISOString().split('T')[0],
        location: {
          state: 'Maharashtra',
          city: 'Mumbai',
          address: 'Test Address, Mumbai'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '9876543210'
        },
        evidence: [],
        formData: {
          personalInfo: {
            firstName: 'Test',
            lastName: 'User',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            nationality: 'Indian'
          }
        },
        scammerInfo: {
          name: 'Test Scammer',
          phone: '9876543212',
          email: 'scammer@example.com',
          upiId: 'scammer@upi',
          bankAccount: '1234567890'
        }
      };

      const response = await caseFlowAPI.submitCase(testData);
      
      if (response.success) {
        setMessage(`✅ Test case created! Case ID: ${response.case.caseId}`);
        setSelectedCase({ id: response.case.caseId, caseId: response.case.caseId });
        fetchCases(); // Refresh cases list
      } else {
        setMessage(`❌ Failed to create test case: ${response.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="admin-flow-dashboard">
        <div className="loading">Loading cases...</div>
      </div>
    );
  }

  return (
    <div className="admin-flow-dashboard">
      <div className="dashboard-header">
        <h1>🔧 Admin Case Flow Management</h1>
        <p>Manually control each step of the fraud case management process</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="dashboard-controls">
        {!isAuthenticated ? (
          <button onClick={loginAsAdmin} className="login-btn">
            🔐 Login as Admin
          </button>
        ) : (
          <>
            <button onClick={createTestCase} className="create-test-btn">
              🚀 Create Test Case
            </button>
            <button onClick={fetchCases} className="refresh-btn">
              🔄 Refresh Cases
            </button>
          </>
        )}
      </div>

      {isAuthenticated && selectedCase && (
        <div className="case-flow-section">
          <h2>📊 Case Flow Control - {selectedCase.caseId}</h2>
          
          <div className="flow-controls">
            <div className="step-controls">
              <h3>Step 2: Information Verification</h3>
              <button 
                onClick={() => handleStepAction(selectedCase.id, 2, 'Verify Information')}
                className="step-btn"
              >
                ✅ Verify Information
              </button>
            </div>

            <div className="step-controls">
              <h3>Step 3: Generate 91CRPC</h3>
              <button 
                onClick={() => handleStepAction(selectedCase.id, 3, 'Generate 91CRPC')}
                className="step-btn"
              >
                📋 Generate 91CRPC
              </button>
              <div className="crpc-actions">
                <button 
                  onClick={() => viewCRPCDocument(selectedCase.id)}
                  className="crpc-btn view-btn"
                >
                  👁️ View Document
                </button>
                <button 
                  onClick={() => downloadCRPCDocument(selectedCase.id)}
                  className="crpc-btn download-btn"
                >
                  📥 Download PDF
                </button>
              </div>
            </div>

            <div className="step-controls">
              <h3>Step 4: Send Emails</h3>
              <button 
                onClick={() => handleStepAction(selectedCase.id, 4, 'Send Emails')}
                className="step-btn"
              >
                📧 Send Emails
              </button>
            </div>

            <div className="step-controls">
              <h3>Step 5: Authorize</h3>
              <button 
                onClick={() => handleStepAction(selectedCase.id, 5, 'Authorize')}
                className="step-btn"
              >
                ✅ Authorize
              </button>
            </div>

            <div className="step-controls">
              <h3>Step 6: Assign to Police</h3>
              <button 
                onClick={() => handleStepAction(selectedCase.id, 6, 'Assign to Police')}
                className="step-btn"
              >
                👮 Assign to Police
              </button>
            </div>

            <div className="step-controls">
              <h3>Step 7: Evidence Collected</h3>
              <button 
                onClick={() => handleStepAction(selectedCase.id, 7, 'Mark Evidence Collected')}
                className="step-btn"
              >
                📋 Evidence Collected
              </button>
            </div>

            <div className="step-controls">
              <h3>Step 8: Resolve</h3>
              <button 
                onClick={() => handleStepAction(selectedCase.id, 8, 'Resolve')}
                className="step-btn"
              >
                ✅ Resolve
              </button>
            </div>

            <div className="step-controls">
              <h3>Step 9: Close Case</h3>
              <button 
                onClick={() => handleStepAction(selectedCase.id, 9, 'Close Case')}
                className="step-btn close-btn"
              >
                🔒 Close Case
              </button>
            </div>
          </div>

          <div className="flow-tracker">
            <CaseFlowTracker 
              caseId={selectedCase.id}
              onStatusUpdate={(caseData) => {
                console.log('Status updated:', caseData);
                setSelectedCase(prev => ({ ...prev, ...caseData }));
              }}
            />
          </div>
        </div>
      )}

      <div className="flow-info">
        <h3>📋 Manual Flow Steps</h3>
        <div className="steps-info">
          <div className="step-info">
            <span className="step-number">1</span>
            <div>
              <strong>Report Submitted</strong> - User submits case (Automatic)
            </div>
          </div>
          <div className="step-info">
            <span className="step-number">2</span>
            <div>
              <strong>Information Verified</strong> - Admin verifies user and scammer data
            </div>
          </div>
          <div className="step-info">
            <span className="step-number">3</span>
            <div>
              <strong>91CRPC Generated</strong> - Admin generates legal document
            </div>
          </div>
          <div className="step-info">
            <span className="step-number">4</span>
            <div>
              <strong>Email Sent</strong> - Admin sends emails to authorities
            </div>
          </div>
          <div className="step-info">
            <span className="step-number">5</span>
            <div>
              <strong>Authorized</strong> - Admin authorizes the case
            </div>
          </div>
          <div className="step-info">
            <span className="step-number">6</span>
            <div>
              <strong>Assigned to Police</strong> - Admin assigns to police
            </div>
          </div>
          <div className="step-info">
            <span className="step-number">7</span>
            <div>
              <strong>Evidence Collected</strong> - Police collects evidence
            </div>
          </div>
          <div className="step-info">
            <span className="step-number">8</span>
            <div>
              <strong>Resolved</strong> - Police marks as resolved
            </div>
          </div>
          <div className="step-info">
            <span className="step-number">9</span>
            <div>
              <strong>Case Closed</strong> - Admin closes the case
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFlowDashboard;
