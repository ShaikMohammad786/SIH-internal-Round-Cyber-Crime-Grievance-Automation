import React, { useState, useEffect } from 'react';
import { getUser } from '../utils/auth';
import { userProfilesAPI } from '../utils/userProfilesAPI';
import Header from '../components/Header';
import { 
  Shield, FileText, Search, CheckCircle, Lock, 
  MapPin, Phone, CreditCard, Clock, AlertTriangle, 
  X, ChevronRight, User, FileCheck, Gavel, Save
} from 'lucide-react';

const PolicePortal = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [actionModal, setActionModal] = useState({ show: false, type: '', caseId: '' });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [dashboardResponse, casesResponse] = await Promise.all([
        userProfilesAPI.getPoliceDashboard(),
        userProfilesAPI.getPoliceCases()
      ]);
      
      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      }
      
      if (casesResponse.success) {
        setCases(casesResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading police dashboard:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCase = async (caseId) => {
    try {
      const response = await userProfilesAPI.getPoliceCaseDetails(caseId);
      if (response.success) {
        setSelectedCase(response.case);
        setShowCaseModal(true);
      }
    } catch (error) {
      alert('Failed to load case details');
    }
  };

  const handlePoliceAction = async (action, caseId, additionalData = {}) => {
    try {
      let response;
      if (action === 'collect_evidence') {
        const evidenceResponse = await userProfilesAPI.addPoliceEvidence(caseId, additionalData);
        if (evidenceResponse.success) {
          response = await userProfilesAPI.updatePoliceCaseStatus(caseId, 'evidence_collected', additionalData);
        } else {
             response = evidenceResponse;
        }
      } else {
        const actionToStatus = {
          'start_review': 'under_review',
          'collect_evidence': 'evidence_collected',
          'resolve_case': 'resolved',
          'close_case': 'closed'
        };
        response = await userProfilesAPI.updatePoliceCaseStatus(caseId, actionToStatus[action], additionalData);
      }
      
      if (response && response.success) {
        alert('Action completed successfully');
        loadDashboardData();
        setActionModal({ show: false, type: '', caseId: '' });
        setShowCaseModal(false);
      } else {
        alert('Failed to complete action: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to complete action: ' + error.message);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'emails_sent': { label: 'Authorities Notified', color: 'text-blue-700 bg-blue-50 ring-blue-600/20', icon: MapPin },
      'under_review': { label: 'Under Review', color: 'text-amber-700 bg-amber-50 ring-amber-600/20', icon: Search },
      'evidence_collected': { label: 'Evidence Collected', color: 'text-purple-700 bg-purple-50 ring-purple-600/20', icon: FileCheck },
      'resolved': { label: 'Resolved', color: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20', icon: CheckCircle },
      'closed': { label: 'Closed', color: 'text-slate-700 bg-slate-50 ring-slate-600/20', icon: Lock }
    };
    return statusMap[status] || { label: status, color: 'text-slate-700 bg-slate-50 ring-slate-600/20', icon: FileText };
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      high: { label: 'High Priority', color: 'bg-red-50 text-red-700 ring-red-600/10' },
      medium: { label: 'Medium', color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/10' },
      low: { label: 'Low', color: 'bg-green-50 text-green-700 ring-green-600/10' }
    };
    return priorityMap[priority] || { label: 'Medium', color: 'bg-yellow-50 text-yellow-700 ring-yellow-600/10' };
  };

  const formatAmount = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) return (
     <div className="min-h-screen flex flex-col bg-slate-50">
        <Header loggedIn={true} username={getUser()?.name} />
        <div className="flex-1 flex items-center justify-center">
           <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
     </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header loggedIn={true} username={getUser()?.name} />
      
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Police Portal</h1>
            <p className="text-slate-500">Manage assigned fraud cases and investigations</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
             <Shield className="h-4 w-4 text-indigo-600" />
             Police Officer • Authorized Access
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
           {[
              { label: 'Total Assigned', value: dashboardData?.totalAssigned || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Cases', value: dashboardData?.activeCases || 0, icon: Search, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Resolved', value: dashboardData?.resolved || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Closed', value: dashboardData?.closed || 0, icon: Lock, color: 'text-slate-600', bg: 'bg-slate-50' }
           ].map((stat, idx) => (
              <div key={idx} className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md">
                 <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                 </div>
                 <div>
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                 </div>
              </div>
           ))}
        </div>

        {/* Cases Table */}
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Assigned Cases</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Case ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Victim</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assigned</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {cases.map((caseItem) => {
                  const statusInfo = getStatusInfo(caseItem.status);
                  const priorityInfo = getPriorityInfo(caseItem.priority);
                  
                  return (
                    <tr key={caseItem._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-slate-900">{caseItem.caseId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{caseItem.user?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{formatAmount(caseItem.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusInfo.color}`}>
                           <statusInfo.icon className="h-3 w-3" />
                           {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${priorityInfo.color}`}>
                           {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatDate(caseItem.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                           <button 
                              onClick={() => handleViewCase(caseItem._id)}
                              className="text-indigo-600 hover:text-indigo-900"
                           >
                              <span className="sr-only">View</span>
                              <FileText className="h-4 w-4" />
                           </button>
                           
                           {/* Action Buttons based on status */}
                           {caseItem.status === 'emails_sent' && (
                              <button onClick={() => setActionModal({ show: true, type: 'start_review', caseId: caseItem._id })} className="text-amber-600 hover:text-amber-900" title="Start Review">
                                 <Search className="h-4 w-4" />
                              </button>
                           )}
                           {caseItem.status === 'under_review' && (
                              <button onClick={() => setActionModal({ show: true, type: 'collect_evidence', caseId: caseItem._id })} className="text-purple-600 hover:text-purple-900" title="Collect Evidence">
                                 <FileCheck className="h-4 w-4" />
                              </button>
                           )}
                           {caseItem.status === 'evidence_collected' && (
                              <button onClick={() => setActionModal({ show: true, type: 'resolve_case', caseId: caseItem._id })} className="text-emerald-600 hover:text-emerald-900" title="Resolve Case">
                                 <Gavel className="h-4 w-4" />
                              </button>
                           )}
                           {caseItem.status === 'resolved' && (
                              <button onClick={() => setActionModal({ show: true, type: 'close_case', caseId: caseItem._id })} className="text-slate-600 hover:text-slate-900" title="Close Case">
                                 <Lock className="h-4 w-4" />
                              </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {cases.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                      No cases assigned to you yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Case Details Modal */}
      {showCaseModal && selectedCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-white rounded-xl shadow-2xl ring-1 ring-slate-200">
             <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-bold text-slate-900">Case Details: {selectedCase.caseId}</h2>
                <button onClick={() => setShowCaseModal(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                   <X className="h-6 w-6" />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="rounded-xl bg-slate-50 p-6 border border-slate-100">
                      <h3 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
                         <User className="h-4 w-4" /> Victim Information
                      </h3>
                      <dl className="space-y-3">
                         <div className="flex justify-between">
                            <dt className="text-sm font-medium text-slate-500">Name</dt>
                            <dd className="text-sm font-semibold text-slate-900">{selectedCase.user?.name || 'Unknown'}</dd>
                         </div>
                         <div className="flex justify-between">
                            <dt className="text-sm font-medium text-slate-500">Amount Lost</dt>
                            <dd className="text-sm font-semibold text-red-600">{formatAmount(selectedCase.amount)}</dd>
                         </div>
                         <div className="flex justify-between">
                            <dt className="text-sm font-medium text-slate-500">Current Status</dt>
                            <dd className="text-sm font-semibold">{selectedCase.status.replace(/_/g, ' ')}</dd>
                         </div>
                      </dl>
                   </div>
                   
                   {selectedCase.scammerDetails && (
                      <div className="rounded-xl bg-red-50 p-6 border border-red-100">
                         <h3 className="mb-4 text-base font-semibold text-red-900 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" /> Suspect Information
                         </h3>
                         <dl className="space-y-3">
                            <div className="flex justify-between">
                               <dt className="text-sm font-medium text-red-700">Name</dt>
                               <dd className="text-sm font-semibold text-red-900">{selectedCase.scammerDetails.name || 'Unknown'}</dd>
                            </div>
                            <div className="flex justify-between">
                               <dt className="text-sm font-medium text-red-700">Phone</dt>
                               <dd className="text-sm font-semibold text-red-900">{selectedCase.scammerDetails.phoneNumber || 'N/A'}</dd>
                            </div>
                            <div className="flex justify-between">
                               <dt className="text-sm font-medium text-red-700">Bank Account</dt>
                               <dd className="text-sm font-semibold text-red-900">{selectedCase.scammerDetails.bankAccount || 'N/A'}</dd>
                            </div>
                         </dl>
                      </div>
                   )}
                </div>
                
                {/* Timeline */}
                {selectedCase.timeline && (
                   <div className="rounded-xl border border-slate-200 p-6">
                      <h3 className="mb-6 text-base font-semibold text-slate-900">Investigation Timeline</h3>
                      <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                         {selectedCase.timeline.map((item, index) => (
                            <div key={index} className="relative pl-8">
                               <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white bg-indigo-500 shadow-sm ring-1 ring-slate-200"></div>
                               <div>
                                  <div className="flex items-center gap-2">
                                     <span className="text-sm font-bold text-slate-900">{item.stageName}</span>
                                     <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">
             <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
                <h2 className="text-lg font-bold text-slate-900">
                   {actionModal.type === 'start_review' && 'Start Investigation'}
                   {actionModal.type === 'collect_evidence' && 'Log Evidence'}
                   {actionModal.type === 'resolve_case' && 'Resolve Case'}
                   {actionModal.type === 'close_case' && 'Close Case'}
                </h2>
                <button onClick={() => setActionModal({ show: false, type: '', caseId: '' })} className="text-slate-400 hover:text-slate-600">
                   <X className="h-5 w-5" />
                </button>
             </div>
             
             <div className="p-6">
                <ActionForm 
                   actionType={actionModal.type}
                   caseId={actionModal.caseId}
                   onSubmit={handlePoliceAction}
                   onCancel={() => setActionModal({ show: false, type: '', caseId: '' })}
                />
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Action Form Component
const ActionForm = ({ actionType, caseId, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    comment: '',
    evidenceType: '',
    details: '',
    arrestInfo: '',
    recommendation: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(actionType, caseId, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Comment / Notes</label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({...formData, comment: e.target.value})}
          placeholder="Add your official notes..."
          rows={3}
          required
          className="block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
        />
      </div>

      {actionType === 'collect_evidence' && (
        <>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Evidence Type</label>
            <select
              value={formData.evidenceType}
              onChange={(e) => setFormData({...formData, evidenceType: e.target.value})}
              required
              className="block w-full rounded-md border-0 py-2.5 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="">Select Evidence Type</option>
              <option value="arrest">Arrest Made</option>
              <option value="investigation">Investigation Report</option>
              <option value="recommendation">Police Recommendation</option>
              <option value="other">Other Evidence</option>
            </select>
          </div>
          
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Details</label>
             <textarea
               value={formData.details}
               onChange={(e) => setFormData({...formData, details: e.target.value})}
               rows={2}
               required
               className="block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
             />
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Arrest Info (Optional)</label>
             <input
               type="text"
               value={formData.arrestInfo}
               onChange={(e) => setFormData({...formData, arrestInfo: e.target.value})}
               className="block w-full rounded-md border-0 py-2 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
             />
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-lg">Cancel</button>
        <button type="submit" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm">
           Confirm Action
        </button>
      </div>
    </form>
  );
};

export default PolicePortal;
