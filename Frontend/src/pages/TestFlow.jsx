import React, { useState } from 'react';
import { caseFlowAPI, CASE_FLOW_STEPS } from '../utils/caseFlowAPI';
import CaseFlowTracker from '../components/CaseFlowTracker';
import { Rocket, PlayCircle, CheckCircle, Database, Mail, FileText, Activity, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

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
        location: { state: 'Maharashtra', city: 'Mumbai', address: 'Test Address, Mumbai' },
        contactInfo: { email: 'test@example.com', phone: '9876543210' },
        evidence: [],
        formData: {
          personalInfo: { firstName: 'Test', lastName: 'User', dateOfBirth: '1990-01-01', gender: 'male', nationality: 'Indian' },
          contactInfo: { email: 'test@example.com', phone: '9876543210' },
          addressInfo: { currentAddress: { street: 'Test Street', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001', country: 'India' } },
          governmentIds: { aadhaarNumber: '123456789012', panNumber: 'ABCDE1234F' },
          incidentInfo: {
            incidentDate: new Date().toISOString().split('T')[0],
            description: 'Test UPI fraud incident for flow demonstration',
            scamType: 'upi-fraud',
            communicationMethod: 'phone-call',
            suspectInfo: { name: 'Test Scammer', phone: '9876543212', email: 'scammer@example.com', bankAccount: '1234567890', upiId: 'scammer@upi' }
          },
          financialInfo: { amountLost: 25000, currency: 'INR', paymentMethod: 'UPI' }
        },
        scammerInfo: {
          name: 'Test Scammer', phone: '9876543212', email: 'scammer@example.com', upiId: 'scammer@upi', bankAccount: '1234567890', ifscCode: 'SBIN0001234', address: 'Test Scammer Address'
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
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200">
             <Rocket className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Complete Case Flow Test</h1>
          <p className="mt-4 text-lg text-slate-600">Demonstrate the complete automated fraud case management flow</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6">
          <button 
            onClick={createTestCase}
            disabled={isLoading}
            className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-xl transition-all hover:bg-indigo-700 hover:shadow-2xl hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
               <>
                  <Activity className="h-6 w-6 animate-spin" /> Creating...
               </>
            ) : (
               <>
                  <Zap className="h-6 w-6 fill-current" /> Initialize Test Case
               </>
            )}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 transition-opacity group-hover:opacity-100"></div>
          </button>
          
          {message && (
            <div className={`flex items-center gap-3 rounded-xl px-6 py-4 font-medium shadow-sm ring-1 ring-inset
               ${message.includes('✅') ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : 'bg-red-50 text-red-800 ring-red-200'}
            `}>
              {message.includes('✅') ? <CheckCircle className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
              {message}
            </div>
          )}
        </div>

        {/* Live Tracking */}
        {testCaseId && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
               <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
                  <Activity className="h-6 w-6 text-indigo-600" /> Live Case Flow Progress
               </h2>
               <p className="text-sm text-slate-500">Watching case automatically progress through all 9 steps</p>
            </div>
            <div className="p-6">
               <CaseFlowTracker 
                 caseId={testCaseId}
                 onStatusUpdate={(caseData) => {
                   console.log('🔄 Status updated:', caseData);
                   setMessage(`🔄 Status updated: ${caseData.status} (Step ${caseData.currentStep}/9)`);
                 }}
               />
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid gap-6 md:grid-cols-2">
           {/* Steps List */}
           <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                 <FileText className="h-5 w-5 text-indigo-600" /> Complete Flow Steps
              </h3>
              <div className="space-y-4">
                 {Object.entries(CASE_FLOW_STEPS).map(([stepNumber, step]) => (
                    <div key={stepNumber} className="group flex items-start gap-4 rounded-xl p-3 transition-colors hover:bg-slate-50">
                       <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-lg font-bold text-indigo-600 group-hover:bg-indigo-100 group-hover:text-indigo-700">
                          {stepNumber}
                       </div>
                       <div>
                          <div className="font-semibold text-slate-900">{step.name}</div>
                          <div className="text-sm text-slate-500">{step.description}</div>
                       </div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Features */}
           <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
                 <ShieldCheck className="h-5 w-5 text-emerald-600" /> System Features
              </h3>
              <ul className="space-y-4">
                 {[
                    { icon: <Zap className="h-5 w-5 text-amber-500" />, text: "Automated Flow", sub: "All 9 steps happen automatically" },
                    { icon: <Activity className="h-5 w-5 text-blue-500" />, text: "Real-time Updates", sub: "Live progress tracking via WebSockets" },
                    { icon: <Database className="h-5 w-5 text-indigo-500" />, text: "Database Integration", sub: "Complete data persistence & logging" },
                    { icon: <Mail className="h-5 w-5 text-rose-500" />, text: "Email Notifications", sub: "Authorities automatically notified" },
                    { icon: <FileText className="h-5 w-5 text-emerald-500" />, text: "Document Generation", sub: "91 CrPC documents auto-created" },
                    { icon: <CheckCircle className="h-5 w-5 text-teal-500" />, text: "Timeline Tracking", sub: "Complete audit trail of all actions" }
                 ].map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                       <div className="mt-0.5">{feature.icon}</div>
                       <div>
                          <strong className="block text-slate-900">{feature.text}</strong>
                          <span className="text-sm text-slate-500">{feature.sub}</span>
                       </div>
                    </li>
                 ))}
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TestFlow;
