import React, { useState, useEffect } from 'react';
import { caseFlowAPI } from '../utils/caseFlowAPI';
import { authAPI } from '../utils/auth';
import { userProfilesAPI } from '../utils/userProfilesAPI';
import CaseFlowTracker from '../components/CaseFlowTracker';
import { Shield, Lock, Activity, RefreshCw, Plus, FileText, Mail, UserCheck, Scale, CheckCircle, AlertTriangle, Download, Eye, X } from 'lucide-react';

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
          // setMessage(`✅ Authenticated as ${response.user.name} (${response.user.role})`);
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
      const response = await userProfilesAPI.getAdminDashboard();
      if (response.success) {
        // Map backend cases to the format expected by this dashboard
        // The endpoint returns { stats: { recentCases: [...] } }
        setCases(response.stats?.recentCases || []);
      } else {
        setMessage(`Error loading cases: ${response.message}`);
      }
    } catch (err) {
      setMessage(`Error load cases: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStepAction = async (caseId, step, action) => {
    try {
      setMessage(`Processing ${action} for case ${caseId}...`);
      
      const token = localStorage.getItem('token');
      console.log('🔍 Debug - Token exists:', !!token);
      
      switch (step) {
        case 2: await processInformationVerification(caseId); break;
        case 3: await process91CRPCGeneration(caseId); break;
        case 4: await processEmailSending(caseId); break;
        case 5: await processAuthorization(caseId); break;
        case 6: await processPoliceAssignment(caseId); break;
        case 7: await processEvidenceCollection(caseId); break;
        case 8: await processResolution(caseId); break;
        case 9: await processClosure(caseId); break;
        default: setMessage('Invalid step');
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
    const response = await caseFlowAPI.progressStep(caseId, 2);
    if (!response.success) throw new Error(response.message);
  };

  const process91CRPCGeneration = async (caseId) => {
    const response = await caseFlowAPI.progressStep(caseId, 3);
    if (!response.success) throw new Error(response.message);
  };

  const viewCRPCDocument = async (caseId) => {
    try {
      setMessage('Loading 91CRPC document...');
      const response = await caseFlowAPI.getCRPCDocument(caseId);
      
      if (response.success) {
        setMessage(`✅ 91CRPC document loaded! Document Number: ${response.data.documentNumber}`);
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No authentication token found');
        
        const downloadUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/case-flow/crpc/download/${response.data.documentId}`;
        
        const form = document.createElement('form');
        form.method = 'GET';
        form.action = downloadUrl;
        form.target = '_blank';
        
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
    const response = await caseFlowAPI.progressStep(caseId, 4);
    if (!response.success) throw new Error(response.message);
  };

  const processAuthorization = async (caseId) => {
    const response = await caseFlowAPI.progressStep(caseId, 5);
    if (!response.success) throw new Error(response.message);
  };

  const processPoliceAssignment = async (caseId) => {
    const response = await caseFlowAPI.progressStep(caseId, 6);
    if (!response.success) throw new Error(response.message);
  };

  const processEvidenceCollection = async (caseId) => {
    const response = await caseFlowAPI.progressStep(caseId, 7);
    if (!response.success) throw new Error(response.message);
  };

  const processResolution = async (caseId) => {
    const response = await caseFlowAPI.progressStep(caseId, 8);
    if (!response.success) throw new Error(response.message);
  };

  const processClosure = async (caseId) => {
    const response = await caseFlowAPI.progressStep(caseId, 9);
    if (!response.success) throw new Error(response.message);
  };

  const createTestCase = async () => {
    try {
      setMessage('Creating test case...');
      
      const testData = {
        caseType: 'upi-fraud',
        description: 'Test UPI fraud case for manual flow demonstration',
        amount: 50000,
        incidentDate: new Date().toISOString().split('T')[0],
        location: { state: 'Maharashtra', city: 'Mumbai', address: 'Test Address, Mumbai' },
        contactInfo: { email: 'test@example.com', phone: '9876543210' },
        evidence: [],
        formData: {
          personalInfo: { firstName: 'Test', lastName: 'User', dateOfBirth: '1990-01-01', gender: 'male', nationality: 'Indian' }
        },
        scammerInfo: {
          name: 'Test Scammer', phone: '9876543212', email: 'scammer@example.com', upiId: 'scammer@upi', bankAccount: '1234567890'
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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
           <p className="font-medium text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-bold text-slate-900">
             <Shield className="h-10 w-10 text-indigo-600" /> 
             Admin Case Flow Management
          </h1>
          <p className="mt-2 text-slate-600">Manually control each step of the fraud case management process</p>
        </div>

        {message && (
          <div className={`mx-auto mb-6 max-w-2xl rounded-lg p-4 font-medium text-center shadow-sm flex items-center justify-center gap-2
            ${message.includes('❌') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}
          `}>
             {message.includes('❌') ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
            {message}
          </div>
        )}

        <div className="mb-8 flex flex-wrap justify-center gap-4">
          {!isAuthenticated ? (
            <button 
               onClick={loginAsAdmin} 
               className="flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg"
            >
              <Lock className="h-4 w-4" /> Login as Admin
            </button>
          ) : (
            <>
              <button 
                 onClick={createTestCase} 
                 className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
              >
                <Plus className="h-4 w-4" /> Create Test Case
              </button>
              <button 
                 onClick={fetchCases} 
                 className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
              >
                <RefreshCw className="h-4 w-4" /> Refresh Cases
              </button>
            </>
          )}
        </div>

        {isAuthenticated && selectedCase && (
          <div className="mb-8 space-y-6 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/50">
            <div className="flex items-center border-b border-slate-100 pb-4">
               <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Activity className="h-6 w-6 text-indigo-600" /> Case Flow Control
                  <span className="ml-2 rounded-lg bg-slate-100 px-2.5 py-0.5 text-sm font-mono font-medium text-slate-600">{selectedCase.caseId}</span>
               </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <h3 className="mb-3 font-semibold text-slate-800">Step 2: Verification</h3>
                <button 
                  onClick={() => handleStepAction(selectedCase.id, 2, 'Verify Information')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-indigo-50 hover:ring-indigo-300"
                >
                  <UserCheck className="h-4 w-4" /> Verify Info
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <h3 className="mb-3 font-semibold text-slate-800">Step 3: 91CRPC</h3>
                <div className="space-y-2">
                   <button 
                     onClick={() => handleStepAction(selectedCase.id, 3, 'Generate 91CRPC')}
                     className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-indigo-50 hover:ring-indigo-300"
                   >
                     <FileText className="h-4 w-4" /> Generate
                   </button>
                   <div className="flex gap-2">
                       <button onClick={() => viewCRPCDocument(selectedCase.id)} className="flex-1 rounded-lg bg-indigo-100 p-2 text-indigo-700 hover:bg-indigo-200"><Eye className="h-4 w-4 mx-auto" /></button>
                       <button onClick={() => downloadCRPCDocument(selectedCase.id)} className="flex-1 rounded-lg bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200"><Download className="h-4 w-4 mx-auto" /></button>
                   </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <h3 className="mb-3 font-semibold text-slate-800">Step 4: Emails</h3>
                <button 
                  onClick={() => handleStepAction(selectedCase.id, 4, 'Send Emails')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-indigo-50 hover:ring-indigo-300"
                >
                  <Mail className="h-4 w-4" /> Send Emails
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <h3 className="mb-3 font-semibold text-slate-800">Step 5: Authorize</h3>
                <button 
                  onClick={() => handleStepAction(selectedCase.id, 5, 'Authorize')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-emerald-50 hover:ring-emerald-300"
                >
                  <CheckCircle className="h-4 w-4" /> Authorize
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <h3 className="mb-3 font-semibold text-slate-800">Step 6: Police</h3>
                <button 
                  onClick={() => handleStepAction(selectedCase.id, 6, 'Assign to Police')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-indigo-50 hover:ring-indigo-300"
                >
                  <Shield className="h-4 w-4" /> Assign
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <h3 className="mb-3 font-semibold text-slate-800">Step 7: Evidence</h3>
                <button 
                  onClick={() => handleStepAction(selectedCase.id, 7, 'Mark Evidence Collected')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-indigo-50 hover:ring-indigo-300"
                >
                  <FileText className="h-4 w-4" /> Collected
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <h3 className="mb-3 font-semibold text-slate-800">Step 8: Resolve</h3>
                <button 
                  onClick={() => handleStepAction(selectedCase.id, 8, 'Resolve')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-emerald-50 hover:ring-emerald-300"
                >
                  <Scale className="h-4 w-4" /> Resolve
                </button>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md">
                <h3 className="mb-3 font-semibold text-slate-800">Step 9: Close</h3>
                <button 
                  onClick={() => handleStepAction(selectedCase.id, 9, 'Close Case')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-red-600 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-red-50 hover:ring-red-300"
                >
                  <Lock className="h-4 w-4" /> Close Case
                </button>
              </div>
            </div>

            <div className="mt-8">
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

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-6 flex items-center justify-center gap-2 text-xl font-bold text-slate-900">
             <FileText className="h-5 w-5 text-indigo-600" /> Manual Flow Steps Reference
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
             {[
                { n: 1, title: 'Report Submitted', desc: 'User submits case (Automatic)' },
                { n: 2, title: 'Information Verified', desc: 'Admin verifies user and scammer data' },
                { n: 3, title: '91CRPC Generated', desc: 'Admin generates legal document' },
                { n: 4, title: 'Email Sent', desc: 'Admin sends emails to authorities' },
                { n: 5, title: 'Authorized', desc: 'Admin authorizes the case' },
                { n: 6, title: 'Assigned to Police', desc: 'Admin assigns to police' },
                { n: 7, title: 'Evidence Collected', desc: 'Police collects evidence' },
                { n: 8, title: 'Resolved', desc: 'Police marks as resolved' },
                { n: 9, title: 'Case Closed', desc: 'Admin closes the case' }
             ].map((step) => (
                <div key={step.n} className="flex items-start gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                   <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 font-bold text-slate-600">
                      {step.n}
                   </div>
                   <div>
                      <strong className="block text-slate-900">{step.title}</strong>
                      <span className="text-sm text-slate-500">{step.desc}</span>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFlowDashboard;
