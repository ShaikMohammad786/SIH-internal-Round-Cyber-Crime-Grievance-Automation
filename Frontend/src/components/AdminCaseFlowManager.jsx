import React, { useState, useEffect } from 'react';
import { caseFlowAPI } from '../utils/caseFlowAPI';
import CaseFlowTracker from './CaseFlowTracker';
import { Search, Loader2, X, Activity, FileText, ChevronRight, AlertCircle, RefreshCw } from 'lucide-react';

const AdminCaseFlowManager = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showFlowTracker, setShowFlowTracker] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      // This would be an API call to get all cases
      // For now, we'll simulate with empty array if API fails or returns mock
      // Ideally usage: const response = await caseFlowAPI.getAllCases();
      setCases([]); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStepProgress = async (caseId, step) => {
    try {
      await caseFlowAPI.progressStep(caseId, step);
      // Refresh case data
      if (selectedCase && selectedCase.id === caseId) {
        const response = await caseFlowAPI.getCaseStatus(caseId);
        if (response.success) {
          setSelectedCase(response.data.case);
        }
      }
    } catch (err) {
      console.error('Error progressing step:', err);
      alert(`Error updating step: ${err.message}`);
    }
  };

  const openCaseFlow = (caseId) => {
    setSelectedCase({ id: caseId });
    setShowFlowTracker(true);
  };

  if (loading) {
     return (
        <div className="flex h-64 items-center justify-center rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
           <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <p>Loading cases...</p>
           </div>
        </div>
     );
  }

  if (error) {
     return (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
           <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
           <p>Error: {error}</p>
        </div>
     );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
           <h2 className="text-2xl font-bold text-slate-900">Case Flow Management</h2>
           <p className="text-slate-500">Monitor and manage the end-to-end case flow process</p>
        </div>
        <button 
           onClick={fetchCases} 
           className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
        >
           <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {showFlowTracker && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
               <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-indigo-600" /> Case Flow Tracker
               </h3>
               <button 
                  onClick={() => setShowFlowTracker(false)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
               >
                  <X className="h-6 w-6" />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
               <CaseFlowTracker 
                 caseId={selectedCase.id}
                 onStatusUpdate={(caseData) => {
                   setSelectedCase(caseData);
                 }}
               />
               
               <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                 <h4 className="mb-4 text-sm font-bold text-slate-900 uppercase tracking-wider">Manual Flow Control (Admin Override)</h4>
                 <div className="flex flex-wrap gap-2">
                   {[2, 3, 4, 5, 6, 7, 8, 9].map(step => (
                     <button
                       key={step}
                       onClick={() => handleStepProgress(selectedCase.id, step)}
                       className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-200 transition-all"
                     >
                       Step {step}
                     </button>
                   ))}
                 </div>
                 <p className="mt-3 text-xs text-slate-500">
                    Warning: Manually progressing steps may bypass required checks. Use only when necessary.
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cases.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4">
               <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No Cases Found</h3>
            <p className="mt-1 text-slate-500">Cases will appear here as they are submitted</p>
          </div>
        ) : (
          cases.map(caseItem => (
            <div key={caseItem.id} className="group flex flex-col justify-between rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md">
               <div>
                  <div className="mb-4 flex items-start justify-between">
                     <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600">
                        <FileText className="h-6 w-6" />
                     </div>
                     <span className="font-mono text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        {caseItem.caseId}
                     </span>
                  </div>
                  <h4 className="mb-1 text-base font-bold text-slate-900">{caseItem.caseType}</h4>
                  <div className="mb-4 space-y-1">
                     <p className="text-sm text-slate-500 flex justify-between">
                        <span>Status:</span> <span className="font-medium text-slate-700">{caseItem.status}</span>
                     </p>
                     <p className="text-sm text-slate-500 flex justify-between">
                        <span>Amount:</span> <span className="font-medium text-slate-700">₹{caseItem.amount?.toLocaleString()}</span>
                     </p>
                     <p className="text-sm text-slate-500 flex justify-between">
                        <span>Created:</span> <span className="font-medium text-slate-700">{new Date(caseItem.createdAt).toLocaleDateString()}</span>
                     </p>
                  </div>
               </div>
               
               <button 
                  onClick={() => openCaseFlow(caseItem.id)}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
               >
                  View Flow <ChevronRight className="h-4 w-4" />
               </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCaseFlowManager;
