import React, { useState, useEffect } from 'react';
import { caseFlowAPI, CASE_FLOW_STEPS } from '../utils/caseFlowAPI';
import CaseFlowTracker from '../components/CaseFlowTracker';
import './TestFlow.css';

const TestFlow = () => {
  const [testCaseId, setTestCaseId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createTestCase = async () => {
    setIsLoading(true);
    setMessage('Creating test case...');
    
    try {
      const testData = {
        caseType: 'upi-fraud',
        description: 'Test UPI fraud case to demonstrate complete flow',
        amount: 25000,
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
          },
          contactInfo: {
            email: 'test@example.com',
            phone: '9876543210'
          },
          addressInfo: {
            currentAddress: {
              street: 'Test Street',
              city: 'Mumbai',
              state: 'Maharashtra',
              postalCode: '400001',
              country: 'India'
            }
          },
          governmentIds: {
            aadhaarNumber: '123456789012',
            panNumber: 'ABCDE1234F'
          },
          incidentInfo: {
            incidentDate: new Date().toISOString().split('T')[0],
            description: 'Test UPI fraud incident for flow demonstration',
            scamType: 'upi-fraud',
            communicationMethod: 'phone-call',
            suspectInfo: {
              name: 'Test Scammer',
              phone: '9876543212',
              email: 'scammer@example.com',
              bankAccount: '1234567890',
              upiId: 'scammer@upi'
            }
          },
          financialInfo: {
            amountLost: 25000,
            currency: 'INR',
            paymentMethod: 'UPI'
          }
        },
        scammerInfo: {
          name: 'Test Scammer',
          phone: '9876543212',
          email: 'scammer@example.com',
          upiId: 'scammer@upi',
          bankAccount: '1234567890',
          ifscCode: 'SBIN0001234',
          address: 'Test Scammer Address'
        }
      };

      console.log('🚀 Creating test case with data:', testData);
      const response = await caseFlowAPI.submitCase(testData);
      
      if (response.success) {
        setTestCaseId(response.case.caseId);
        setMessage(`✅ Test case created successfully! Case ID: ${response.case.caseId}`);
        console.log('✅ Test case created:', response);
      } else {
        setMessage(`❌ Failed to create test case: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Error creating test case:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="test-flow-page">
      <div className="test-header">
        <h1>🚀 Complete Case Flow Test</h1>
        <p>This page demonstrates the complete automated fraud case management flow</p>
      </div>

      <div className="test-controls">
        <button 
          onClick={createTestCase}
          disabled={isLoading}
          className="create-test-btn"
        >
          {isLoading ? '⏳ Creating...' : '🚀 Create Test Case'}
        </button>
        
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>

      {testCaseId && (
        <div className="flow-demo">
          <h2>📊 Live Case Flow Progress</h2>
          <p>Watch the case automatically progress through all 9 steps:</p>
          
          <CaseFlowTracker 
            caseId={testCaseId}
            onStatusUpdate={(caseData) => {
              console.log('🔄 Status updated:', caseData);
              setMessage(`🔄 Status updated: ${caseData.status} (Step ${caseData.currentStep}/9)`);
            }}
          />
        </div>
      )}

      <div className="flow-info">
        <h3>📋 Complete Flow Steps</h3>
        <div className="steps-grid">
          {Object.entries(CASE_FLOW_STEPS).map(([stepNumber, step]) => (
            <div key={stepNumber} className="step-card">
              <div className="step-number">{stepNumber}</div>
              <div className="step-icon">{step.icon}</div>
              <div className="step-name">{step.name}</div>
              <div className="step-desc">{step.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="features-info">
        <h3>✨ Features Demonstrated</h3>
        <ul>
          <li>✅ <strong>Automated Flow</strong> - All 9 steps happen automatically</li>
          <li>✅ <strong>Real-time Updates</strong> - Live progress tracking</li>
          <li>✅ <strong>Database Integration</strong> - Complete data persistence</li>
          <li>✅ <strong>Email Notifications</strong> - Authorities automatically notified</li>
          <li>✅ <strong>Document Generation</strong> - 91 CrPC documents created</li>
          <li>✅ <strong>Timeline Tracking</strong> - Complete audit trail</li>
          <li>✅ <strong>Error Handling</strong> - Robust error recovery</li>
        </ul>
      </div>
    </div>
  );
};

export default TestFlow;
