import React, { useState, useEffect } from 'react';
import { caseFlowAPI, CASE_FLOW_STEPS } from '../utils/caseFlowAPI';
import { CheckCircle, Clock, Circle, FileText, AlertCircle, RefreshCw } from 'lucide-react';

const CaseFlowTracker = ({ caseId, onStatusUpdate }) => {
  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caseId) {
      fetchCaseStatus(true);
      const interval = setInterval(() => fetchCaseStatus(false), 30000);
      return () => clearInterval(interval);
    }
  }, [caseId]);

  const fetchCaseStatus = async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      const response = await caseFlowAPI.getCaseStatus(caseId);
      if (response.success) {
        setCaseData(response.data.case);
        setTimeline(response.data.timeline);
        if (onStatusUpdate) {
          onStatusUpdate(response.data.case);
        }
      }
    } catch (err) {
      console.error('Error fetching case status:', err);
      setError(err.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const getStepStatus = (stepNumber) => {
    if (!caseData) return 'pending';
    const currentStep = caseData.currentStep || 1;
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'in_progress';
    return 'pending';
  };

  const getStepIcon = (stepNumber, status) => {
    if (status === 'completed') return <CheckCircle className="h-6 w-6 text-emerald-500" />;
    if (status === 'in_progress') return <Clock className="h-6 w-6 text-amber-500 animate-pulse" />;
    return <Circle className="h-6 w-6 text-slate-300" />;
  };

  if (loading && !caseData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-white p-8 text-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p>Loading case status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p>Error loading case status: {error}</p>
        <button onClick={fetchCaseStatus} className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200">
          Retry
        </button>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
        <FileText className="h-10 w-10 text-slate-300 mb-2" />
        <p>No case data available</p>
      </div>
    );
  }

  const progressPercentage = Math.round((caseData.currentStep / 9) * 100);

  const statusMap = {
    submitted: { label: "Submitted" },
    verified: { label: "Verified" },
    crpc_generated: { label: "91 CRPC Ready" },
    emails_sent: { label: "Notified" },
    authorized: { label: "Authorized" },
    assigned_to_police: { label: "Investigating" },
    evidence_collected: { label: "Evidence Ready" },
    resolved: { label: "Solved" },
    closed: { label: "Closed" }
  };

  return (
    <div className="space-y-8 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
           <h3 className="text-lg font-bold text-slate-900">Case Flow Status</h3>
           <p className="text-sm text-slate-500 font-mono mt-1">ID: {caseData.caseId}</p>
        </div>
        <div className="flex items-center gap-3">
           <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide
              ${caseData.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 
                caseData.status === 'closed' ? 'bg-slate-100 text-slate-800' :
                'bg-blue-100 text-blue-800'
              }
           `}>
             {caseData.status.replace(/_/g, ' ')}
           </span>
           <button 
             onClick={fetchCaseStatus} 
             disabled={loading}
             className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
             title="Refresh"
           >
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div 
            className="h-full bg-indigo-600 transition-all duration-500 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs font-medium text-slate-500">
          <span>Step {caseData.currentStep} of 9</span>
          <span>{progressPercentage}% Complete</span>
        </div>
      </div>

      {/* Steps List */}
      <div className="relative space-y-0">
        <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-200"></div>
        {Object.entries(CASE_FLOW_STEPS).map(([stepNumber, step]) => {
          const status = getStepStatus(parseInt(stepNumber));
          const isCompleted = status === 'completed';
          const isInProgress = status === 'in_progress';
          
          return (
            <div key={stepNumber} className={`relative flex gap-4 py-4 ${status === 'pending' ? 'opacity-60' : ''}`}>
               <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors
                  ${isCompleted ? 'border-emerald-500' : isInProgress ? 'border-amber-500 shadow-md ring-4 ring-amber-50' : 'border-slate-200'}
               `}>
                 {getStepIcon(parseInt(stepNumber), status)}
               </div>
               <div className={`flex-1 rounded-lg border p-4 transition-all
                  ${isInProgress ? 'border-amber-200 bg-amber-50/50' : 'border-transparent hover:bg-slate-50'}
               `}>
                  <div className="flex items-center justify-between">
                     <h4 className={`font-semibold ${isCompleted ? 'text-slate-900' : isInProgress ? 'text-amber-900' : 'text-slate-700'}`}>
                        {step.name}
                     </h4>
                     {isCompleted && (
                        <span className="text-xs font-medium text-emerald-600">Completed</span>
                     )}
                     {isInProgress && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">In Progress</span>
                     )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{step.description}</p>
               </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Timeline */}
      {timeline.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
          <h4 className="mb-4 text-sm font-semibold text-slate-900 uppercase tracking-wider">Recent Activity Log</h4>
          <div className="space-y-4">
            {timeline.slice(-5).reverse().map((entry, index) => (
              <div key={index} className="flex gap-3 text-sm">
                <div className="mt-0.5 text-xl">{entry.icon || '📄'}</div>
                <div>
                  <div className="flex items-center gap-2">
                     <span className="font-medium text-slate-900">{entry.stage}</span>
                     <span className="text-xs text-slate-500">• {new Date(entry.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-600">{entry.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseFlowTracker;
