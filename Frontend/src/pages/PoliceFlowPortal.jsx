import React, { useState, useEffect } from 'react';
import { caseFlowAPI } from '../utils/caseFlowAPI';
import CaseFlowTracker from '../components/CaseFlowTracker';
import { Shield, FileText, CheckCircle, Activity, Plus, RefreshCw, AlertTriangle, Scale, Search } from 'lucide-react';

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
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
           <p className="font-medium text-slate-600">Loading police portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="flex items-center justify-center gap-3 text-3xl font-bold text-slate-900">
             <Shield className="h-10 w-10 text-blue-600" />
             Police Case Management Portal
          </h1>
          <p className="mt-2 text-slate-600">Manage evidence collection and case resolution</p>
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
          <button 
             onClick={createTestCase} 
             className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
          >
            <Plus className="h-4 w-4" /> Create Test Case
          </button>
          <button 
             onClick={fetchCases} 
             className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Cases
          </button>
        </div>

        {selectedCase && (
          <div className="mb-8 space-y-6 rounded-2xl bg-white p-6 shadow-xl ring-1 ring-slate-200/50">
            <div className="flex items-center border-b border-slate-100 pb-4">
               <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Activity className="h-6 w-6 text-blue-600" /> Case Management
                  <span className="ml-2 rounded-lg bg-slate-100 px-2.5 py-0.5 text-sm font-mono font-medium text-slate-600">{selectedCase.caseId}</span>
               </h2>
            </div>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="group rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition-all hover:border-blue-200 hover:shadow-md hover:bg-blue-50/30">
                <div className="mb-4 flex items-center gap-2 text-blue-800">
                   <FileText className="h-6 w-6" />
                   <h3 className="text-lg font-bold">Evidence Collection</h3>
                </div>
                <p className="mb-6 text-slate-600">Mark evidence as collected after gathering all necessary documents and information.</p>
                <button 
                  onClick={() => handlePoliceAction(selectedCase.id, 'Evidence Collected')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow-md"
                >
                  <FileText className="h-5 w-5" /> Mark Evidence Collected
                </button>
              </div>

              <div className="group rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md hover:bg-emerald-50/30">
                <div className="mb-4 flex items-center gap-2 text-emerald-800">
                   <CheckCircle className="h-6 w-6" />
                   <h3 className="text-lg font-bold">Case Resolution</h3>
                </div>
                <p className="mb-6 text-slate-600">Mark case as resolved after completing investigation and taking necessary action.</p>
                <button 
                  onClick={() => handlePoliceAction(selectedCase.id, 'Resolve')}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
                >
                  <CheckCircle className="h-5 w-5" /> Mark as Resolved
                </button>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 pt-6">
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
             <Shield className="h-6 w-6 text-blue-600" /> Police Portal Features
          </h3>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
             {[
                { icon: <FileText className="h-8 w-8 text-blue-500" />, title: 'Evidence Collection', desc: 'Gather documents, statements, and digital evidence.' },
                { icon: <Search className="h-8 w-8 text-indigo-500" />, title: 'Case Investigation', desc: 'Review details and scammer info for investigation.' },
                { icon: <Scale className="h-8 w-8 text-emerald-500" />, title: 'Case Resolution', desc: 'Resolve cases after completing legal actions.' },
                { icon: <Activity className="h-8 w-8 text-purple-500" />, title: 'Progress Tracking', desc: 'Monitor real-time status from all departments.' }
             ].map((feature, idx) => (
                <div key={idx} className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all">
                   <div className="mb-4 rounded-full bg-white p-3 shadow-sm ring-1 ring-slate-100">
                      {feature.icon}
                   </div>
                   <h4 className="mb-2 font-bold text-slate-800">{feature.title}</h4>
                   <p className="text-sm text-slate-600">{feature.desc}</p>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoliceFlowPortal;
