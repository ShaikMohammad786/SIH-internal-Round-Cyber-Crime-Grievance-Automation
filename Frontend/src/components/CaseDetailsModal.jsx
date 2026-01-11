import React, { useState, useEffect } from 'react';
import { userProfilesAPI } from '../utils/userProfilesAPI';
import { validateToken, clearSessionAndRedirect } from '../utils/auth';
import ScammerDetailsModal from './ScammerDetailsModal';
import CRPCDocumentsModal from './CRPCDocumentsModal';
import { 
  X, Check, AlertTriangle, FileText, User, MapPin, 
  Calendar, CreditCard, Globe, Phone, Mail, Clock, 
  Download, Eye, Send, UserPlus
} from 'lucide-react';

const CaseDetailsModal = ({ caseId, isOpen, onClose, isAdmin = false, onAdminActionComplete, onAssignPolice }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [showScammerModal, setShowScammerModal] = useState(false);
  const [showCRPCDocumentsModal, setShowCRPCDocumentsModal] = useState(false);
  const [scammerId, setScammerId] = useState(null);
  const [sentEmails, setSentEmails] = useState([]);

  useEffect(() => {
    if (isOpen && caseId) {
      loadCaseDetails();
    }
  }, [isOpen, caseId]);

  const loadCaseDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!validateToken()) {
        setError('Session expired. Please login again.');
        return;
      }
      
      const response = isAdmin 
        ? await userProfilesAPI.getAdminCaseDetails(caseId)
        : await userProfilesAPI.getCaseDetails(caseId);
        
      if (response.success) {
        setCaseData(response.case || response.data);
        if (isAdmin) loadCaseEmails();
      } else {
        setError(response.message || 'Failed to load case details');
      }
    } catch (error) {
      if (error && error.message && error.message.includes('Invalid or expired token')) {
        setError('Session expired. Please login again.');
        setTimeout(clearSessionAndRedirect, 2000);
      } else {
        setError('Failed to load case details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCaseEmails = async () => {
    try {
      const response = await userProfilesAPI.getCaseEmails(caseId);
      if (response.success) {
        setSentEmails(response.emails || []);
      }
    } catch (error) {
      console.error('Failed to load case emails:', error);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { label: 'Submitted', color: 'text-slate-600 bg-slate-50 ring-slate-500/10' },
      verified: { label: 'Verified', color: 'text-blue-700 bg-blue-50 ring-blue-600/20' },
      crpc_generated: { label: '91 CRPC Ready', color: 'text-indigo-700 bg-indigo-50 ring-indigo-600/20' },
      emails_sent: { label: 'Notified Authorities', color: 'text-purple-700 bg-purple-50 ring-purple-600/20' },
      authorized: { label: 'Authorized', color: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20' },
      assigned_to_police: { label: 'Investigation In Progress', color: 'text-orange-700 bg-orange-50 ring-orange-600/20' },
      evidence_collected: { label: 'Evidence Ready', color: 'text-cyan-700 bg-cyan-50 ring-cyan-600/20' },
      resolved: { label: 'Solved', color: 'text-green-700 bg-green-50 ring-green-600/20' },
      closed: { label: 'Closed', color: 'text-slate-600 bg-slate-50 ring-slate-500/10' },
      pending: { label: 'Pending', color: 'text-slate-600 bg-slate-50 ring-slate-500/10' }
    };
    return statusMap[status] || { label: status, color: 'text-slate-600 bg-slate-50 ring-slate-500/10' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatAmount = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  const handleStageAction = async (action, stage) => {
    try {
      const actionMap = {
        'verify_details': 'verify_details', 'request_more_info': 'request_more_info',
        'collect_scammer_details': 'collect_scammer_details', 'verify_evidence': 'verify_evidence',
        'start_investigation': 'start_investigation', 'collect_evidence': 'collect_evidence',
        'send_emails': 'send_emails', 'generate_crpc': 'generate_crpc',
        'mark_resolved': 'mark_resolved', 'police_contact': 'police_contact',
        'close_case': 'close_case'
      };
      
      const backendAction = actionMap[action] || action;
      let comment = '';
      
      if (['verify_details', 'verify_evidence', 'start_investigation', 'collect_evidence', 'mark_resolved', 'police_contact', 'close_case'].includes(backendAction)) {
        comment = prompt(`Add a comment for this action (optional):`);
        if (comment === null) return;
      }
      
      const response = await userProfilesAPI.performStageAction(caseId, backendAction, stage, comment);
      
      if (response.success) {
        alert(`Action completed successfully`);
        loadCaseDetails();
        if (onAdminActionComplete) onAdminActionComplete();
      } else {
        alert('Failed to perform action: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Failed to perform action: ' + error.message);
    }
  };

  const getActionLabel = (action) => {
    return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Keep existing email/crpc handlers but stripped of excessive logging for brevity
  const handleSendEmails = async () => {
    try {
      const emailTypes = [];
      const scammerDetails = caseData?.scammerDetails || {};
      if (scammerDetails.phoneNumber) emailTypes.push('telecom');
      if (scammerDetails.bankAccount || scammerDetails.upiId) emailTypes.push('banking');
      emailTypes.push('nodal');
      if (emailTypes.length === 1) emailTypes.push('telecom', 'banking'); // Fallback

      const response = await userProfilesAPI.sendEmails(caseId, scammerId || caseData?.scammerId || 'no-scammer-id', emailTypes);
      
      if (response.success) {
        alert(`Emails sent successfully`);
        setSentEmails(response.data?.emailResults || {});
        loadCaseDetails();
        if (onAdminActionComplete) onAdminActionComplete();
      } else {
        alert('Failed to send emails: ' + response.message);
      }
    } catch (error) {
      alert('Error sending emails: ' + error.message);
    }
  };

  const handleGenerate91CrPC = async () => {
    if (!scammerId && !caseData?.scammerId) return alert('Please collect scammer details first');
    try {
      const response = await userProfilesAPI.generate91CrPC(caseId, scammerId || caseData.scammerId);
      if (response.success) {
        alert('91 CrPC document generated successfully!');
        loadCaseDetails();
        if (onAdminActionComplete) onAdminActionComplete();
      } else {
        alert('Failed to generate 91 CrPC');
      }
    } catch (error) { alert('Failed to generate 91 CrPC: ' + error.message); }
  };

  const handleDownloadCRPC = async () => {
    try { await userProfilesAPI.downloadCRPCFromAdmin(caseId); } 
    catch (error) { alert('Failed to download CRPC: ' + error.message); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Case Details: {caseData?.caseId || 'Loading...'}</h2>
            <p className="text-sm text-slate-500">Complete case information and management</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-500 font-medium">{error}</p>
              <button onClick={onClose} className="mt-4 text-sm font-semibold text-slate-600 hover:underline">Close</button>
            </div>
          </div>
        ) : caseData && (
          <>
            {/* Tabs */}
            <div className="border-b border-slate-200 bg-white px-2">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'victim', label: 'Victim Details' },
                  { id: 'evidence', label: 'Evidence' },
                  ...(isAdmin ? [
                    { id: 'admin', label: 'Admin Actions' },
                    { id: 'emails', label: 'Communications' }
                  ] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      border-b-2 py-4 px-1 text-sm font-medium transition-colors
                      ${activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
              
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Timeline */}
                  <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="mb-6 text-base font-semibold text-slate-900">Case Timeline</h3>
                    <div className="relative border-l-2 border-slate-200 ml-4 space-y-8">
                      {caseData.timeline?.map((item, index) => {
                        const statusInfo = getStatusInfo(item.status);
                        return (
                          <div key={index} className="relative pl-8">
                             <div className={`absolute -left-[11px] top-0 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ${item.status === 'completed' ? 'ring-green-500' : 'ring-slate-300'}`}>
                                <div className={`h-2.5 w-2.5 rounded-full ${item.status === 'completed' ? 'bg-green-500' : 'bg-slate-300'}`} />
                             </div>
                             <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-slate-900">
                                      {item.stageName || item.stage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${statusInfo.color}`}>
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-600">{item.description}</p>
                                  {item.createdAt && (
                                    <p className="text-xs text-slate-400">
                                      {item.status === 'completed' ? 'Completed ' : 'Started '} {formatDate(item.createdAt)}
                                    </p>
                                  )}
                                  
                                  {/* Admin Actions in Timeline */}
                                  {isAdmin && item.adminActions && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {item.adminActions.map((action, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => {
                                            if (action === 'send_emails') handleSendEmails();
                                            else if (action === 'generate_crpc') handleGenerate91CrPC();
                                            else if (action === 'download_crpc') handleDownloadCRPC();
                                            else if (action === 'collect_scammer_details') setShowScammerModal(true);
                                            else if (action === 'assign_police') onAssignPolice && onAssignPolice(caseId);
                                            else handleStageAction(action, item.stage);
                                          }}
                                          className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
                                        >
                                          {getActionLabel(action)}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                             </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Police Assignment */}
                  {isAdmin && caseData.assignedTo && (
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <h3 className="mb-4 text-base font-semibold text-slate-900">Police Assignment</h3>
                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-medium uppercase text-slate-500">Officer Name</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-900">{caseData.assignedToName || 'Unknown'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-medium uppercase text-slate-500">Assigned Date</dt>
                          <dd className="mt-1 text-sm font-semibold text-slate-900">{formatDate(caseData.assignedAt)}</dd>
                        </div>
                      </dl>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'victim' && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
                      <User className="h-4 w-4" /> Personal Details
                    </h3>
                    <dl className="space-y-4">
                      {['name', 'phone', 'email', 'dateOfBirth'].map(field => (
                        <div key={field}>
                          <dt className="text-xs font-medium uppercase text-slate-500">{field.replace(/([A-Z])/g, ' $1').trim()}</dt>
                          <dd className="mt-1 text-sm font-medium text-slate-900">
                            {caseData.victimDetails?.[field] || caseData.user?.[field] || caseData.user?.[0]?.[field] || 'N/A'}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                  <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <h3 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> Address & ID
                      </h3>
                      <dl className="space-y-4">
                        {['address', 'city', 'aadhaarNumber', 'panNumber'].map(field => (
                          <div key={field}>
                            <dt className="text-xs font-medium uppercase text-slate-500">{field.replace(/([A-Z])/g, ' $1').trim()}</dt>
                            <dd className="mt-1 text-sm font-medium text-slate-900">
                              {caseData.victimDetails?.[field] || caseData.user?.[field] || caseData.user?.[0]?.[field] || 'N/A'}
                            </dd>
                          </div>
                        ))}
                      </dl>
                  </div>
                  
                  {/* Scammer info if available */}
                  {(caseData.scammerDetails || caseData.scammerDetails?.[0]) && (
                     <div className="col-span-1 md:col-span-2 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 border-l-4 border-red-500">
                        <h3 className="mb-4 text-base font-semibold text-slate-900 flex items-center gap-2">
                           <AlertTriangle className="h-4 w-4 text-red-500" /> Known Scammer Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <dt className="text-xs font-medium uppercase text-slate-500">Name</dt>
                                <dd className="text-sm font-semibold">{caseData.scammerDetails?.name || caseData.scammerDetails?.[0]?.name}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium uppercase text-slate-500">Phone</dt>
                                <dd className="text-sm font-semibold">{caseData.scammerDetails?.phoneNumber || caseData.scammerDetails?.[0]?.phoneNumber}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-medium uppercase text-slate-500">Bank Account</dt>
                                <dd className="text-sm font-semibold">{caseData.scammerDetails?.bankAccount || caseData.scammerDetails?.[0]?.bankAccount || 'N/A'}</dd>
                            </div>
                        </div>
                     </div>
                  )}
                </div>
              )}

              {activeTab === 'evidence' && (
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                   <h3 className="mb-4 text-base font-semibold text-slate-900">Attached Files</h3>
                   {caseData.evidence?.length > 0 ? (
                     <div className="space-y-3">
                       {caseData.evidence.map((file, idx) => (
                         <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
                            <div className="flex items-center gap-3">
                               <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-100 text-slate-500">
                                  <FileText className="h-5 w-5" />
                               </div>
                               <div>
                                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                                  <p className="text-xs text-slate-500">{file.size} • {formatDate(file.uploadedAt)}</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                {(file.url || file.data) && (
                                   <button 
                                     onClick={() => {
                                       const fileData = file.url || file.data;
                                       if (!fileData) return;
                                       
                                       let downloadUrl = fileData;
                                       if (fileData && !fileData.startsWith('http') && !fileData.startsWith('data:')) {
                                         downloadUrl = `http://localhost:5000${fileData}`;
                                       }
                                       
                                       const link = document.createElement('a');
                                       link.href = downloadUrl;
                                       link.download = file.name || 'document.png';
                                       document.body.appendChild(link);
                                       link.click();
                                       document.body.removeChild(link);
                                     }}
                                      className="rounded p-2 text-emerald-600 hover:bg-emerald-50" 
                                      title="Download Evidence"
                                   >
                                      <Download className="h-4 w-4" />
                                   </button>
                                )}
                             </div>
                          </div>
                       ))}
                     </div>
                   ) : (
                     <p className="text-sm text-slate-500 italic">No evidence files attached.</p>
                   )}
                </div>
              )}

              {activeTab === 'admin' && isAdmin && (
                <div className="space-y-6">
                   <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <h3 className="mb-4 text-base font-semibold text-slate-900">Admin Actions</h3>
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                         {/* General Admin Actions */}
                         <button onClick={() => setShowScammerModal(true)} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:border-indigo-500 hover:text-indigo-600 shadow-sm transition-all">
                            <User className="h-6 w-6" />
                            Add Scammer
                         </button>
                         <button onClick={handleGenerate91CrPC} className="flex flex-col items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm font-medium text-slate-700 hover:border-indigo-500 hover:text-indigo-600 shadow-sm transition-all">
                            <FileText className="h-6 w-6" />
                            Gen. 91 CrPC
                         </button>
                      </div>
                   </div>

                   <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                      <h3 className="mb-4 text-base font-semibold text-slate-900">Admin Notes</h3>
                      <textarea
                        value={adminComment}
                        onChange={(e) => setAdminComment(e.target.value)}
                        placeholder="Add internal notes for this case..."
                        className="w-full rounded-lg border-0 bg-slate-50 p-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                        rows={4}
                      />
                      <div className="mt-3 flex justify-end">
                        <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                           <Send className="h-4 w-4" /> Save Note
                        </button>
                      </div>
                   </div>
                </div>
              )}

              {activeTab === 'emails' && isAdmin && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white p-6 md:p-8 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-bold text-slate-900">Communication History</h3>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                        {sentEmails.length} Emails Sent
                      </span>
                    </div>

                    {sentEmails.length > 0 ? (
                      <div className="space-y-6">
                        {sentEmails.map((email, idx) => (
                          <div key={idx} className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md hover:border-indigo-200">
                            <div className="mb-4 flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                  <Mail className="h-5 w-5" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{email.subject}</h4>
                                  <p className="text-xs text-slate-500">
                                    To: <span className="font-medium text-slate-700">{email.recipient?.email || email.recipient}</span> • {formatDate(email.sentAt)}
                                  </p>
                                </div>
                              </div>
                              <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                email.status === 'sent' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {email.status === 'sent' ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                {email.status}
                              </div>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {email.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                          <Mail className="h-10 w-10" />
                        </div>
                        <h4 className="text-lg font-semibold text-slate-900">No Communications Yet</h4>
                        <p className="mt-2 text-sm text-slate-500 max-w-xs">
                          Once you perform actions that involve notifying authorities, the email logs will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Sub Modals */}
      {showScammerModal && (
        <ScammerDetailsModal
          isOpen={showScammerModal}
          onClose={() => setShowScammerModal(false)}
          caseId={caseId}
          onScammerCreated={(id) => {
            setScammerId(id);
            loadCaseDetails();
            setShowScammerModal(false);
          }}
        />
      )}
      
      {showCRPCDocumentsModal && (
        <CRPCDocumentsModal
          isOpen={showCRPCDocumentsModal}
          onClose={() => setShowCRPCDocumentsModal(false)}
          caseId={caseId}
        />
      )}
    </div>
  );
};

export default CaseDetailsModal;