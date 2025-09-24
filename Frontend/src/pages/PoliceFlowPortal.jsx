import React, { useState, useEffect } from 'react';
import { caseFlowAPI } from '../utils/caseFlowAPI';
import CaseFlowTracker from '../components/CaseFlowTracker';
import './PoliceFlowPortal.css';

const PoliceFlowPortal = () => {
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      // This would be an API call to get police cases
      setCases([]);
    } catch (err) {
      setMessage(`Error loading cases: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePoliceAction = async (caseId, action) => {
    try {
      setMessage(`Processing ${action} for case ${caseId}...`);
      
      if (action === 'Evidence Collected') {
        await caseFlowAPI.progressStep(caseId, 7);
      } else if (action === 'Resolve') {
        await caseFlowAPI.progressStep(caseId, 8);
      }
      
      setMessage(`✅ ${action} completed successfully`);
      if (selectedCase && selectedCase.id === caseId) {
        const response = await caseFlowAPI.getCaseStatus(caseId);
        if (response.success) {
          setSelectedCase(response.data.case);
        }
      }
    } catch (err) {
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  const createTestCase = async () => {
    try {
      setMessage('Creating test case...');
      
      const testData = {
        caseType: 'upi-fraud',
        description: 'Test UPI fraud case for police portal demonstration',
        amount: 75000,
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
        fetchCases();
      } else {
        setMessage(`❌ Failed to create test case: ${response.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="police-flow-portal">
        <div className="loading">Loading cases...</div>
      </div>
    );
  }

  return (
    <div className="police-flow-portal">
      <div className="portal-header">
        <h1>👮 Police Case Management Portal</h1>
        <p>Manage evidence collection and case resolution</p>
      </div>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="portal-controls">
        <button onClick={createTestCase} className="create-test-btn">
          🚀 Create Test Case
        </button>
        <button onClick={fetchCases} className="refresh-btn">
          🔄 Refresh Cases
        </button>
      </div>

      {selectedCase && (
        <div className="case-management-section">
          <h2>📊 Case Management - {selectedCase.caseId}</h2>
          
          <div className="police-actions">
            <div className="action-card">
              <h3>📋 Evidence Collection</h3>
              <p>Mark evidence as collected after gathering all necessary documents and information</p>
              <button 
                onClick={() => handlePoliceAction(selectedCase.id, 'Evidence Collected')}
                className="action-btn evidence-btn"
              >
                📋 Mark Evidence Collected
              </button>
            </div>

            <div className="action-card">
              <h3>✅ Case Resolution</h3>
              <p>Mark case as resolved after completing investigation and taking necessary action</p>
              <button 
                onClick={() => handlePoliceAction(selectedCase.id, 'Resolve')}
                className="action-btn resolve-btn"
              >
                ✅ Mark as Resolved
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

      <div className="police-info">
        <h3>👮 Police Portal Features</h3>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <h4>Evidence Collection</h4>
            <p>Mark evidence as collected after gathering all necessary documents, witness statements, and digital evidence</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h4>Case Investigation</h4>
            <p>Review case details, scammer information, and victim statements to conduct thorough investigation</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h4>Case Resolution</h4>
            <p>Mark cases as resolved after completing investigation and taking appropriate legal action</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h4>Progress Tracking</h4>
            <p>Monitor real-time case progress and status updates from admin and other departments</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliceFlowPortal;
