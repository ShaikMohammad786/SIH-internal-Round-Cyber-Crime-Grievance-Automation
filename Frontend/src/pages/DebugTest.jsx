import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/auth';
import { caseFlowAPI } from '../utils/caseFlowAPI';
import { Terminal, Lock, Globe, FileText, Trash2, Search, CheckCircle, XCircle } from 'lucide-react';

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
        location: { state: 'Maharashtra', city: 'Mumbai', address: 'Test Address' },
        contactInfo: { email: 'test@example.com', phone: '9876543210' },
        evidence: [],
        formData: {
          personalInfo: { firstName: 'Debug', lastName: 'User', dateOfBirth: '1990-01-01', gender: 'male', nationality: 'Indian' }
        },
        scammerInfo: {
          name: 'Debug Scammer', phone: '9876543212', email: 'scammer@example.com', upiId: 'scammer@upi', bankAccount: '1234567890'
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
    <div className="min-h-screen bg-slate-900 p-6 font-mono text-slate-300">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-700 pb-6">
          <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
             <Terminal className="h-8 w-8 text-green-500" /> Debug Test Page
          </h1>
          <div className="flex items-center gap-4 text-sm">
             <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${token ? 'bg-green-500' : 'bg-red-500'}`}></span>
                Token
             </div>
             <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${user ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                {user ? `${user.name} (${user.role})` : 'Not logged in'}
             </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button 
             onClick={loginAsAdmin} 
             className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-700 hover:text-white"
          >
            <Lock className="h-4 w-4 text-yellow-500" /> Login Admin
          </button>
          <button 
             onClick={testAPI} 
             className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-700 hover:text-white"
          >
            <Globe className="h-4 w-4 text-blue-500" /> Test API
          </button>
          <button 
             onClick={testCaseCreation} 
             className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-700 hover:text-white"
          >
            <FileText className="h-4 w-4 text-purple-500" /> Test Case Creation
          </button>
          <button 
             onClick={() => setLogs([])} 
             className="ml-auto flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-900/20 px-4 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-900/40 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" /> Clear Logs
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Debug Console</h3>
          <div className="h-[500px] overflow-y-auto rounded-xl border border-slate-700 bg-black/50 p-4 font-mono text-sm shadow-inner">
            {logs.length === 0 ? (
               <div className="flex h-full items-center justify-center text-slate-600">
                  <p>No logs yet. Perform an action to see logs here.</p>
               </div>
            ) : (
               <div className="flex flex-col gap-1">
                  {logs.map((log, index) => (
                    <div key={index} className="border-l-2 border-slate-800 pl-3 transition-colors hover:border-slate-600 hover:bg-white/5 py-0.5">
                      <span className={
                         log.includes('✅') ? 'text-green-400' : 
                         log.includes('❌') ? 'text-red-400' : 
                         log.includes('🔍') || log.includes('🔐') || log.includes('📝') || log.includes('🌐') || log.includes('📋') || log.includes('📄') ? 'text-blue-300' :
                         'text-slate-300'
                      }>
                         {log}
                      </span>
                    </div>
                  ))}
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugTest;
