import React, { useState, useEffect } from 'react';
import { userProfilesAPI } from '../utils/userProfilesAPI';
import { X, FileText, Download, Eye, Mail, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const CRPCDocumentsModal = ({ isOpen, onClose, caseId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getAuthorityEmail = (authority) => {
    const emails = {
      telecom: 'telecom@fraud.gov.in',
      banking: 'banking@fraud.gov.in',
      nodal: 'nodal@fraud.gov.in'
    };
    return emails[authority] || 'Unknown';
  };

  useEffect(() => {
    if (isOpen && caseId) {
      loadCRPCDocuments();
    }
  }, [isOpen, caseId]);

  const loadCRPCDocuments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await userProfilesAPI.getCRPCDocuments(caseId);
      if (response.success) {
        setDocuments(response.data.documents || []);
      } else {
        setError(response.message || 'Failed to load CRPC documents');
      }
    } catch (error) {
      console.error('Error loading CRPC documents:', error);
      setError('Failed to load CRPC documents');
    } finally {
      setLoading(false);
    }
  };

  const downloadDocument = async (documentId) => {
    try {
      const response = await fetch(`/api/crpc/download/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `91CRPC_${documentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const errorData = await response.json();
        alert('Failed to download document: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Failed to download document: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="flex w-full max-w-4xl flex-col bg-white rounded-xl shadow-2xl overflow-hidden ring-1 ring-slate-200 h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                <FileText className="h-6 w-6" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-900">91 CrPC Documents</h2>
                <p className="text-sm text-slate-500">Generated notices and correspondence</p>
             </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-full py-12">
                <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-600">Loading documents...</p>
             </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
               <div className="rounded-full bg-red-100 p-3 mb-4">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
               </div>
               <p className="text-slate-900 font-semibold mb-2">{error}</p>
               <button 
                  onClick={loadCRPCDocuments}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                >
                  Try Again
                </button>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
               <div className="rounded-full bg-slate-100 p-4 mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
               </div>
               <p className="text-slate-900 font-medium mb-1">No Documents Found</p>
               <p className="text-sm text-slate-500">No 91 CrPC documents have been generated for this case yet.</p>
            </div>
          ) : (
             <div className="space-y-4">
               {documents.map((doc, index) => (
                 <div key={doc._id || index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                    
                    {/* Document Header */}
                    <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 gap-4">
                       <div className="flex items-start gap-4">
                          <div className="mt-1">
                             <FileText className="h-5 w-5 text-indigo-500" />
                          </div>
                          <div>
                             <h3 className="text-base font-semibold text-slate-900">{doc.documentNumber}</h3>
                             <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                <span className="flex items-center gap-1">
                                   <Clock className="h-3 w-3" />
                                   {new Date(doc.generatedAt).toLocaleString()}
                                </span>
                                <span>•</span>
                                <span>By {doc.generatedBy?.name || 'System'}</span>
                             </div>
                          </div>
                       </div>
                       <div className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide
                          ${doc.status === 'generated' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20' : 
                            doc.status === 'sent' ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 
                            'bg-slate-100 text-slate-700 ring-1 ring-slate-500/20'}`}
                        >
                          {doc.status}
                       </div>
                    </div>

                    {/* Document Body */}
                    <div className="px-6 py-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                       
                       {/* Recipients List */}
                       <div className="lg:col-span-2">
                          {doc.recipients && (
                             <div className="space-y-3">
                                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-500 mb-2">
                                   <Mail className="h-3.5 w-3.5" /> Recipients Status
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                   {Object.entries(doc.recipients).map(([authority, details]) => (
                                     <div key={authority} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                                        <div className="min-w-0 flex-1">
                                           <p className="text-xs font-bold text-slate-700 uppercase truncate">{authority}</p>
                                           <p className="text-xs text-slate-500 truncate">{details.email || getAuthorityEmail(authority)}</p>
                                        </div>
                                        <span className={`ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                           ${(details.status || 'sent') === 'sent' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                           {details.status || 'sent'}
                                        </span>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          )}
                       </div>

                       {/* Actions */}
                       <div className="flex flex-col justify-center gap-3 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                          <button 
                             onClick={() => downloadDocument(doc._id)}
                             className="flex items-center justify-center gap-2 w-full rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors"
                          >
                             <Download className="h-4 w-4" /> Download PDF
                          </button>
                          <button 
                             onClick={() => window.open(`/api/crpc/${doc._id}`, '_blank')}
                             className="flex items-center justify-center gap-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                          >
                             <Eye className="h-4 w-4" /> View Online
                          </button>
                       </div>
                    </div>
                 </div>
               ))}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CRPCDocumentsModal;
