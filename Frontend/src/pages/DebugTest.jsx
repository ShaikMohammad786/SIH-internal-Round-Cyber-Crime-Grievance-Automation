import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/auth';
import { caseFlowAPI } from '../utils/caseFlowAPI';

const DebugTest = () => {
  const [logs, setLogs] = useState([]);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    addLog('🔍 Debug Test Page Loaded');
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      addLog('🔐 Checking authentication...');
      const token = localStorage.getItem('token');
      if (token) {
        addLog(`✅ Token found: ${token.substring(0, 20)}...`);
        setToken(token);
        
        const response = await authAPI.getCurrentUser();
        if (response.success) {
          addLog(`✅ User authenticated: ${response.user.name} (${response.user.role})`);
          setUser(response.user);
        } else {
          addLog(`❌ Auth failed: ${response.message}`);
        }
      } else {
        addLog('❌ No token found');
      }
    } catch (error) {
      addLog(`❌ Auth error: ${error.message}`);
    }
  };

  const loginAsAdmin = async () => {
    try {
      addLog('🔐 Logging in as admin...');
      const response = await authAPI.login('admin@fraudlens.com', 'admin123');
      if (response.success) {
        addLog(`✅ Login successful: ${response.user.name}`);
        setToken(response.token);
        setUser(response.user);
      } else {
        addLog(`❌ Login failed: ${response.message}`);
      }
    } catch (error) {
      addLog(`❌ Login error: ${error.message}`);
    }
  };

  const testCaseCreation = async () => {
    try {
      addLog('📝 Testing case creation...');
      
      const testData = {
        caseType: 'upi-fraud',
        description: 'Debug test case',
        amount: 10000,
        incidentDate: new Date().toISOString().split('T')[0],
        location: {
          state: 'Maharashtra',
          city: 'Mumbai',
          address: 'Test Address'
        },
        contactInfo: {
          email: 'test@example.com',
          phone: '9876543210'
        },
        evidence: [],
        formData: {
          personalInfo: {
            firstName: 'Debug',
            lastName: 'User',
            dateOfBirth: '1990-01-01',
            gender: 'male',
            nationality: 'Indian'
          }
        },
        scammerInfo: {
          name: 'Debug Scammer',
          phone: '9876543212',
          email: 'scammer@example.com',
          upiId: 'scammer@upi',
          bankAccount: '1234567890'
        }
      };

      const response = await caseFlowAPI.submitCase(testData);
      addLog(`✅ Case created: ${response.case.caseId}`);
      
      // Test 91CRPC generation
      addLog('📋 Testing 91CRPC generation...');
      const crpcResponse = await caseFlowAPI.progressStep(response.case.id, 3);
      addLog(`✅ 91CRPC generated: ${crpcResponse.message}`);
      
      // Test getting CRPC document
      addLog('📄 Testing CRPC document retrieval...');
      const docResponse = await caseFlowAPI.getCRPCDocument(response.case.id);
      addLog(`✅ CRPC document retrieved: ${docResponse.data.documentNumber}`);
      
    } catch (error) {
      addLog(`❌ Case creation error: ${error.message}`);
    }
  };

  const testAPI = async () => {
    try {
      addLog('🌐 Testing API connection...');
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        addLog(`✅ API connection successful: ${data.user.name}`);
      } else {
        addLog(`❌ API connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      addLog(`❌ API error: ${error.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🔍 Debug Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={loginAsAdmin} style={{ marginRight: '10px', padding: '10px' }}>
          🔐 Login as Admin
        </button>
        <button onClick={testAPI} style={{ marginRight: '10px', padding: '10px' }}>
          🌐 Test API
        </button>
        <button onClick={testCaseCreation} style={{ marginRight: '10px', padding: '10px' }}>
          📝 Test Case Creation
        </button>
        <button onClick={() => setLogs([])} style={{ padding: '10px' }}>
          🗑️ Clear Logs
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Status:</h3>
        <p>Token: {token ? '✅ Present' : '❌ Missing'}</p>
        <p>User: {user ? `${user.name} (${user.role})` : '❌ Not logged in'}</p>
      </div>

      <div>
        <h3>Debug Logs:</h3>
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '10px', 
          height: '400px', 
          overflowY: 'auto',
          border: '1px solid #ccc'
        }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebugTest;
