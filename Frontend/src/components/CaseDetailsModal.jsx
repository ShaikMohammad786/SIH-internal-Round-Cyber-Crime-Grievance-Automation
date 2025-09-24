import React, { useState, useEffect } from 'react';
import { userProfilesAPI } from '../utils/userProfilesAPI';
import { validateToken, clearSessionAndRedirect } from '../utils/auth';
import ScammerDetailsModal from './ScammerDetailsModal';
import CRPCDocumentsModal from './CRPCDocumentsModal';
import './CaseDetailsModal.css';

const CaseDetailsModal = ({ caseId, isOpen, onClose, isAdmin = false, onAdminActionComplete }) => {
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
      
      // Validate token before making API call
      if (!validateToken()) {
        setError('Session expired. Please login again.');
        return;
      }
      
      // Use admin API if isAdmin is true, otherwise use user API
      const response = isAdmin 
        ? await userProfilesAPI.getAdminCaseDetails(caseId)
        : await userProfilesAPI.getCaseDetails(caseId);
        
      if (response.success) {
        setCaseData(response.case || response.data);
      } else {
        setError(response.message || 'Failed to load case details');
      }
    } catch (error) {
      console.error('Error loading case details:', error);
      
      // Handle specific error cases
      if (error.message.includes('Invalid or expired token')) {
        setError('Session expired. Please login again.');
        // Clear session and redirect to login
        setTimeout(() => {
          clearSessionAndRedirect();
        }, 2000);
      } else if (error.message.includes('Access denied')) {
        setError('You do not have permission to view this case.');
      } else {
        setError('Failed to load case details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      completed: { label: 'Completed', color: '#10b981', bgColor: '#dcfce7' },
      in_progress: { label: 'In Progress', color: '#3b82f6', bgColor: '#dbeafe' },
      pending: { label: 'Pending', color: '#6b7280', bgColor: '#f1f5f9' }
    };
    return statusMap[status] || { label: status, color: '#6b7280', bgColor: '#f1f5f9' };
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      high: { label: 'High Priority', color: '#dc2626', bgColor: '#fef2f2' },
      medium: { label: 'Medium', color: '#f59e0b', bgColor: '#fef3c7' },
      low: { label: 'Low', color: '#10b981', bgColor: '#dcfce7' }
    };
    return priorityMap[priority] || { label: 'Medium', color: '#f59e0b', bgColor: '#fef3c7' };
  };

  const getScamTypeInfo = (scamType) => {
    const typeMap = {
      upi_fraud: 'UPI Fraud',
      investment_scam: 'Investment Scam',
      lottery_scam: 'Lottery Scam',
      phishing: 'Phishing',
      fake_calls: 'Fake Calls',
      other: 'Other'
    };
    return typeMap[scamType] || scamType || 'Other';
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAdminAction = async (action) => {
    try {
      let status;
      let comment = '';
      
      switch (action) {
        case 'mark_solved':
          status = 'resolved';
          comment = 'Case marked as solved by admin';
          break;
        case 'escalate':
          status = 'investigating';
          comment = 'Case escalated for further investigation';
          break;
        case 'generate_report':
          // Generate PDF report
          generateCaseReport();
          return;
        default:
          return;
      }

      const response = await userProfilesAPI.updateCaseStatus(caseId, status, comment);
      if (response.success) {
        alert(`Action ${action} executed successfully`);
        // Reload case details
        loadCaseDetails();
        // Notify parent component to refresh data
        if (onAdminActionComplete) {
          onAdminActionComplete();
        }
      } else {
        alert('Failed to execute action');
      }
    } catch (error) {
      console.error('Error executing admin action:', error);
      alert('Failed to execute action');
    }
  };

  const handleAddComment = async () => {
    try {
      if (!adminComment.trim()) {
        alert('Please enter a comment');
        return;
      }

      const response = await userProfilesAPI.addCaseComment(caseId, adminComment);
      if (response.success) {
        alert('Comment added successfully');
        setAdminComment('');
        // Reload case details to show new comment
        loadCaseDetails();
        // Notify parent component to refresh data
        if (onAdminActionComplete) {
          onAdminActionComplete();
        }
      } else {
        alert('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  const generateCaseReport = () => {
    // Generate PDF report functionality
    alert('PDF report generation feature will be implemented');
  };

  const handleStageAction = async (action, stage) => {
    try {
      console.log('Stage action triggered:', { action, stage, caseId });
      
      // Map frontend action names to backend action names
      const actionMap = {
        'verify_details': 'verify_details',
        'request_more_info': 'request_more_info',
        'collect_scammer_details': 'collect_scammer_details',
        'verify_evidence': 'verify_evidence',
        'start_investigation': 'start_investigation',
        'collect_evidence': 'collect_evidence',
        'send_emails': 'send_emails',
        'generate_crpc': 'generate_crpc',
        'mark_resolved': 'mark_resolved',
        'police_contact': 'police_contact',
        'close_case': 'close_case',
        'follow_up': 'follow_up',
        // Additional mappings for any legacy actions
        'start_analysis': 'start_analysis',
        'escalate_verification': 'escalate_verification',
        'initiate_crpc': 'initiate_crpc',
        'request_additional_evidence': 'request_additional_evidence',
        'mark_analysis_complete': 'mark_analysis_complete',
        'send_legal_notice': 'send_legal_notice',
        'track_response': 'track_response',
        'escalate_legal': 'escalate_legal'
      };
      
      const backendAction = actionMap[action] || action;
      console.log('Mapped action:', { frontend: action, backend: backendAction });
      
      let comment = '';
      
      // For certain actions, ask for specific comments
      if (['verify_details', 'verify_evidence', 'start_investigation', 'collect_evidence', 'mark_resolved', 'police_contact', 'close_case'].includes(backendAction)) {
        comment = prompt(`Add a comment for this action (optional):`);
        if (comment === null) return; // User cancelled
      }
      
      console.log('Calling performStageAction with:', { caseId, action: backendAction, stage, comment });
      const response = await userProfilesAPI.performStageAction(caseId, backendAction, stage, comment);
      console.log('Stage action response:', response);
      
      if (response.success) {
        alert(`Action completed successfully`);
        // Reload case details
        loadCaseDetails();
        // Notify parent component to refresh data
        if (onAdminActionComplete) {
          onAdminActionComplete();
        }
      } else {
        alert('Failed to perform action: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error performing stage action:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to perform action: ' + error.message);
    }
  };

  const getActionLabel = (action) => {
    const actionLabels = {
      'verify_details': 'Verify Details',
      'request_more_info': 'Request More Info',
      'collect_scammer_details': 'Collect Scammer Details',
      'verify_evidence': 'Verify Evidence',
      'start_investigation': 'Start Investigation',
      'collect_evidence': 'Collect Evidence',
      'send_emails': 'Send Emails',
      'generate_crpc': 'Generate 91 CrPC',
      'download_crpc': 'Download 91 CrPC',
      'track_responses': 'Track Responses',
      'mark_resolved': 'Mark Resolved',
      'police_contact': 'Contact Police',
      'close_case': 'Close Case',
      'follow_up': 'Follow Up'
    };
    return actionLabels[action] || action;
  };

  const handleScammerCreated = (newScammerId) => {
    setScammerId(newScammerId);
    loadCaseDetails(); // Reload to get updated scammer details
  };

  const handleSendEmails = async () => {
    console.log('📧 Send Emails button clicked');
    console.log('📧 Case ID:', caseId);
    console.log('📧 Scammer ID:', scammerId);
    console.log('📧 Case Data Scammer ID:', caseData?.scammerId);
    console.log('📧 Case Data:', caseData);
    console.log('📧 Case Data Scammer Details:', caseData?.scammerDetails);
    
    try {
      // Allow sending emails even without scammer details for testing
      if (!scammerId && !caseData?.scammerId && !caseData?.scammerDetails) {
        console.log('📧 No scammer details found, but proceeding with email sending...');
      }
      // Determine email types based on scammer details
      const emailTypes = [];
      const scammerDetails = caseData?.scammerDetails || {};
      
      if (scammerDetails.phoneNumber) emailTypes.push('telecom');
      if (scammerDetails.bankAccount || scammerDetails.upiId) emailTypes.push('banking');
      emailTypes.push('nodal'); // Always send to nodal officer

      // If no scammer details, send to all authorities
      if (emailTypes.length === 1) { // Only nodal
        emailTypes.push('telecom', 'banking');
      }

      console.log('📧 Sending emails with types:', emailTypes);
      console.log('📧 Using caseId:', caseId);
      console.log('📧 Using scammerId:', scammerId || caseData.scammerId || 'no-scammer-id');

      const response = await userProfilesAPI.sendEmails(caseId, scammerId || caseData.scammerId || 'no-scammer-id', emailTypes);
      console.log('📧 Email response:', response);
      console.log('📧 Response success:', response.success);
      console.log('📧 Response data:', response.data);
      console.log('📧 Email results:', response.data?.emailResults);
      
      if (response.success) {
        const emailResults = response.data?.emailResults || {};
        console.log('📧 Parsed email results:', emailResults);
        console.log('📧 Email results keys:', Object.keys(emailResults));
        console.log('📧 Email results values:', Object.values(emailResults));
        
        // Debug each email result individually
        Object.entries(emailResults).forEach(([key, result]) => {
          console.log(`📧 ${key}:`, result);
          console.log(`📧 ${key} success:`, result.success);
          console.log(`📧 ${key} status:`, result.status);
        });
        
        const successCount = Object.values(emailResults).filter(result => result.success).length;
        const totalCount = Object.keys(emailResults).length;
        
        console.log(`📧 Success count: ${successCount}, Total count: ${totalCount}`);
        alert(`Emails sent successfully: ${successCount}/${totalCount} authorities notified`);
        
        // Update local email status
        setSentEmails(emailResults);
        
        // Reload case details to get updated email status
        console.log('📧 Reloading case details after email send...');
        await loadCaseDetails();
        console.log('📧 Case details reloaded');
        console.log('📧 Updated case data:', caseData);
        console.log('📧 Case status:', caseData?.status);
        console.log('📧 Email status:', caseData?.emailStatus);
        if (onAdminActionComplete) {
          console.log('📧 Calling onAdminActionComplete...');
          onAdminActionComplete();
        }
      } else {
        console.log('📧 Email sending failed:', response.message);
        alert('Failed to send emails: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('📧 Email sending error:', error);
      alert('Error sending emails: ' + error.message);
    }
  };

  const handleGenerate91CrPC = async () => {
    if (!scammerId && !caseData?.scammerId) {
      alert('Please collect scammer details first');
      return;
    }

    try {
      const response = await userProfilesAPI.generate91CrPC(caseId, scammerId || caseData.scammerId);
      if (response.success) {
        alert('91 CrPC document generated successfully!');
        loadCaseDetails();
        if (onAdminActionComplete) {
          onAdminActionComplete();
        }
      } else {
        alert('Failed to generate 91 CrPC: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating 91 CrPC:', error);
      alert('Failed to generate 91 CrPC document: ' + error.message);
    }
  };

  const handleDownloadCRPC = async () => {
    try {
      console.log('📥 Downloading CRPC for case:', caseId);
      await userProfilesAPI.downloadCRPCFromAdmin(caseId);
      console.log('✅ CRPC download completed');
    } catch (error) {
      console.error('Error downloading CRPC:', error);
      alert('Failed to download CRPC document: ' + error.message);
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading case details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="error-container">
            <p>{error}</p>
            <button onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <h1>Case Details: {caseData.caseId}</h1>
            <p>Complete case information and management tools</p>
          </div>
          <div className="header-actions">
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'victim' ? 'active' : ''}`}
            onClick={() => setActiveTab('victim')}
          >
            Victim Details
          </button>
          <button 
            className={`tab-button ${activeTab === 'evidence' ? 'active' : ''}`}
            onClick={() => setActiveTab('evidence')}
          >
            Evidence
          </button>
          {isAdmin && (
            <button 
              className={`tab-button ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admin Actions
            </button>
          )}
          {isAdmin && (
            <button 
              className={`tab-button ${activeTab === 'session' ? 'active' : ''}`}
              onClick={() => setActiveTab('session')}
            >
              User Session History
            </button>
          )}
        </div>

        {/* Content */}
        <div className="modal-body">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <h2>Case Progress Timeline</h2>
              <div className="professional-timeline">
                {caseData.timeline && caseData.timeline.length > 0 ? (
                  caseData.timeline.map((item, index) => {
                    const statusInfo = getStatusInfo(item.status || 'pending');
                    const isLast = index === caseData.timeline.length - 1;
                    
                    return (
                      <div key={item._id || item.id || index} className={`timeline-stage ${item.status || 'pending'}`}>
                        <div className="stage-icon-container">
                          <div className="stage-icon" style={{ backgroundColor: statusInfo.color }}>
                            {item.icon || '📄'}
                          </div>
                          {!isLast && <div className="timeline-connector"></div>}
                        </div>
                        <div className="stage-content">
                          <div className="stage-header">
                            <h3 className="stage-title">{item.stageName || item.stage || 'Unknown Stage'}</h3>
                            <span className={`status-badge ${item.status || 'pending'}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="stage-description">{item.description || 'No description available'}</p>
                          {item.createdAt && (
                            <div className="stage-date">
                              {item.status === 'completed' ? 'Completed on: ' : 'Started on: '}
                              {formatDate(item.createdAt)}
                            </div>
                          )}
                          {/* Email Status Display - Only show for relevant stages */}
                          {item.emailStatus && (item.stage === 'emails_sent' || item.stage === 'evidence_collected') && (
                            <div className="email-status-section">
                              <h4>Email Status:</h4>
                              <div className="email-status-grid">
                                <div className="email-status-item">
                                  <span className="email-label">TELECOM</span>
                                  <span className={`email-status ${item.emailStatus.telecom}`}>
                                    {item.emailStatus.telecom === 'sent' ? '✅ Sent' : '⏳ Pending'}
                                  </span>
                                </div>
                                <div className="email-status-item">
                                  <span className="email-label">BANKING</span>
                                  <span className={`email-status ${item.emailStatus.banking}`}>
                                    {item.emailStatus.banking === 'sent' ? '✅ Sent' : '⏳ Pending'}
                                  </span>
                                </div>
                                <div className="email-status-item">
                                  <span className="email-label">NODAL</span>
                                  <span className={`email-status ${item.emailStatus.nodal}`}>
                                    {item.emailStatus.nodal === 'sent' ? '✅ Sent' : '⏳ Pending'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {isAdmin && item.adminActions && (
                            <div className="stage-actions">
                              {item.adminActions.map((action, actionIndex) => (
                                <button
                                  key={actionIndex}
                                  className="stage-action-btn"
                                  onClick={async () => {
                                    if (action === 'collect_scammer_details') {
                                      setShowScammerModal(true);
                                    } else if (action === 'send_emails') {
                                      await handleSendEmails();
                                    } else if (action === 'generate_crpc') {
                                      await handleGenerate91CrPC();
                                    } else if (action === 'download_crpc') {
                                      await handleDownloadCRPC();
                                    } else if (action === 'verify_details') {
                                      await handleStageAction(action, item.stage);
                                    } else if (action === 'request_more_info') {
                                      await handleStageAction(action, item.stage);
                                    } else if (action === 'verify_evidence') {
                                      await handleStageAction(action, item.stage);
                                    } else if (action === 'start_investigation') {
                                      await handleStageAction(action, item.stage);
                                    } else if (action === 'collect_evidence') {
                                      await handleStageAction(action, item.stage);
                                    } else if (action === 'track_responses') {
                                      await handleStageAction(action, item.stage);
                                    } else if (action === 'follow_up') {
                                      await handleStageAction(action, item.stage);
                                    } else if (action === 'mark_resolved') {
                                      await handleStageAction(action, item.stage);
                                    } else if (action === 'police_contact') {
                                      await handleStageAction(action, item.stage);
                                    } else if (action === 'close_case') {
                                      await handleStageAction(action, item.stage);
                                    } else {
                                      await handleStageAction(action, item.stage);
                                    }
                                  }}
                                >
                                  {getActionLabel(action)}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-timeline">
                    <div className="no-timeline-icon">📅</div>
                    <h3>No Timeline Data</h3>
                    <p>Timeline information is not available for this case.</p>
                  </div>
                )}
              </div>
              
              {/* Police Assignment Information */}
              {isAdmin && caseData.assignedTo && (
                <div className="police-assignment-info">
                  <h3>👮 Police Assignment</h3>
                  <div className="assignment-details">
                    <div className="assignment-item">
                      <span className="assignment-label">Assigned Officer:</span>
                      <span className="assignment-value">{caseData.assignedToName || 'Unknown Officer'}</span>
                    </div>
                    <div className="assignment-item">
                      <span className="assignment-label">Officer ID:</span>
                      <span className="assignment-value">{caseData.assignedTo}</span>
                    </div>
                    {caseData.assignedAt && (
                      <div className="assignment-item">
                        <span className="assignment-label">Assigned On:</span>
                        <span className="assignment-value">{formatDate(caseData.assignedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'victim' && (
            <div className="victim-content">
              <h2>👤 Victim Information</h2>
              <div className="victim-details-grid">
                <div className="detail-group">
                  <div className="detail-item">
                    <span className="detail-icon">👤</span>
                    <div className="detail-content">
                      <label>Full Name:</label>
                      <span>{caseData.victimDetails?.name || caseData.user?.[0]?.name || caseData.user?.name || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📞</span>
                    <div className="detail-content">
                      <label>Phone:</label>
                      <span>{caseData.victimDetails?.phone || caseData.user?.[0]?.phone || caseData.user?.phone || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">✉️</span>
                    <div className="detail-content">
                      <label>Email:</label>
                      <span>{caseData.victimDetails?.email || caseData.user?.[0]?.email || caseData.user?.email || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <div className="detail-content">
                      <label>Address:</label>
                      <span>{caseData.victimDetails?.address || caseData.user?.[0]?.address || caseData.user?.address || 'Address not provided'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <div className="detail-content">
                      <label>Date of Birth:</label>
                      <span>{caseData.victimDetails?.dateOfBirth || caseData.user?.[0]?.dateOfBirth || caseData.user?.dateOfBirth || 'Date of birth not provided'}</span>
                    </div>
                  </div>
                </div>
                <div className="detail-group">
                  <div className="detail-item">
                    <span className="detail-icon">🆔</span>
                    <div className="detail-content">
                      <label>Aadhaar Number:</label>
                      <span>{caseData.victimDetails?.aadhaarNumber || caseData.user?.[0]?.aadhaarNumber || caseData.user?.aadhaarNumber || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📋</span>
                    <div className="detail-content">
                      <label>PAN Number:</label>
                      <span>{caseData.victimDetails?.panNumber || caseData.user?.[0]?.panNumber || caseData.user?.panNumber || 'Not provided'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scammer Details Section */}
              {(caseData.scammerDetails && caseData.scammerDetails.length > 0) && (
                <div className="scammer-section">
                  <h3>🕵️ Scammer Information</h3>
                  <div className="scammer-details-grid">
                    <div className="detail-group">
                      <div className="detail-item">
                        <span className="detail-icon">👤</span>
                        <div className="detail-content">
                          <label>Name:</label>
                          <span>{caseData.scammerDetails[0]?.name || caseData.scammerDetails?.name || 'Unknown'}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📞</span>
                        <div className="detail-content">
                          <label>Phone:</label>
                          <span>{caseData.scammerDetails[0]?.phoneNumber || caseData.scammerDetails?.phoneNumber || 'Not provided'}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">✉️</span>
                        <div className="detail-content">
                          <label>Email:</label>
                          <span>{caseData.scammerDetails[0]?.email || caseData.scammerDetails?.email || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="detail-group">
                      <div className="detail-item">
                        <span className="detail-icon">💳</span>
                        <div className="detail-content">
                          <label>UPI ID:</label>
                          <span>{caseData.scammerDetails.upiId || 'Not provided'}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏦</span>
                        <div className="detail-content">
                          <label>Bank Account:</label>
                          <span>{caseData.scammerDetails.bankAccount || 'Not provided'}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">🏛️</span>
                        <div className="detail-content">
                          <label>IFSC Code:</label>
                          <span>{caseData.scammerDetails.ifscCode || 'Not provided'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="detail-group">
                      <div className="detail-item">
                        <span className="detail-icon">📍</span>
                        <div className="detail-content">
                          <label>Address:</label>
                          <span>{caseData.scammerDetails.address || 'Not provided'}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">📊</span>
                        <div className="detail-content">
                          <label>Total Cases:</label>
                          <span>{caseData.scammerDetails.totalCases || 0}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-icon">⚠️</span>
                        <div className="detail-content">
                          <label>Status:</label>
                          <span className={`status-badge ${caseData.scammerDetails.status}`}>
                            {caseData.scammerDetails.status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="evidence-content">
              <h2>📄 Attached Evidence</h2>
              {caseData.evidence && caseData.evidence.length > 0 ? (
                <div className="evidence-list">
                  {caseData.evidence.map((file) => {
                    const isImage = file.type?.startsWith('image/') || 
                                  file.name?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i);
                    const isVideo = file.type?.startsWith('video/') || 
                                  file.name?.match(/\.(mp4|avi|mov|wmv|flv|webm)$/i);
                    const isDocument = file.type?.includes('pdf') || 
                                     file.name?.match(/\.(pdf|doc|docx|txt)$/i);
                    
                    return (
                      <div key={file.id} className="evidence-item">
                        <div className="file-icon">
                          {isImage ? '🖼️' : isVideo ? '🎥' : isDocument ? '📄' : '📎'}
                        </div>
                        <div className="file-info">
                          <div className="file-name">{file.name}</div>
                          <div className="file-details">
                            {file.type} • {file.size} • {formatDate(file.uploadedAt)}
                          </div>
                        </div>
                        <div className="file-actions">
                          <button 
                            className="view-btn"
                            onClick={() => {
                              if (file.url) {
                                window.open(file.url, '_blank');
                              } else {
                                alert('File URL not available');
                              }
                            }}
                          >
                            <span>👁️</span> View
                          </button>
                          <button 
                            className="download-btn"
                            onClick={() => {
                              if (file.url) {
                                const link = document.createElement('a');
                                link.href = file.url;
                                link.download = file.name;
                                link.click();
                              } else {
                                alert('File URL not available');
                              }
                            }}
                          >
                            <span>⬇️</span> Download
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-evidence">
                  <div className="no-evidence-icon">📁</div>
                  <h3>No Evidence Files</h3>
                  <p>No evidence files have been uploaded for this case yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'admin' && isAdmin && (
            <div className="admin-content">
              <h2>💬 Admin Actions & Comments</h2>
              
              {/* Quick Actions */}
              <div className="admin-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button 
                    className="action-btn collect-scammer"
                    onClick={() => setShowScammerModal(true)}
                    disabled={caseData.scammerDetails}
                  >
                    <div className="action-icon">🕵️</div>
                    <span>{caseData.scammerDetails ? 'Scammer Details Collected' : 'Collect Scammer Details'}</span>
                  </button>
                  
                  <button 
                    className="action-btn send-emails"
                    onClick={handleSendEmails}
                    title="Send emails to authorities"
                  >
                    <div className="action-icon">📧</div>
                    <span>Send Emails to Authorities</span>
                  </button>
                  
                  <button 
                    className="action-btn generate-crpc"
                    onClick={handleGenerate91CrPC}
                    disabled={!caseData.scammerDetails || caseData.scammerDetails.length === 0}
                  >
                    <div className="action-icon">⚖️</div>
                    <span>Generate 91 CrPC</span>
                  </button>
                  
                  <button 
                    className="action-btn view-documents"
                    onClick={() => setShowCRPCDocumentsModal(true)}
                  >
                    <div className="action-icon">📋</div>
                    <span>View CRPC Documents</span>
                  </button>
                  
                  <button 
                    className="action-btn solved"
                    onClick={() => handleAdminAction('mark_solved')}
                  >
                    <div className="action-icon">✅</div>
                    <span>Mark as Solved</span>
                  </button>
                  
                  <button 
                    className="action-btn escalate"
                    onClick={() => handleAdminAction('escalate')}
                  >
                    <div className="action-icon">⚠️</div>
                    <span>Escalate Case</span>
                  </button>
                  
                  <button 
                    className="action-btn report"
                    onClick={() => handleAdminAction('generate_report')}
                  >
                    <div className="action-icon">📊</div>
                    <span>Generate Report</span>
                  </button>
                </div>
              </div>

              {/* Case Status Summary */}
              <div className="case-status-summary">
                <h3>Case Status Summary</h3>
                <div className="status-grid">
                  <div className="status-item">
                    <span className="status-label">Current Status:</span>
                    <span className={`status-value ${caseData.status}`}>
                      {caseData.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Priority:</span>
                    <span className={`priority-value ${caseData.priority}`}>
                      {caseData.priority?.toUpperCase()}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Scammer Details:</span>
                    <span className={`scammer-status ${caseData.scammerDetails ? 'collected' : 'pending'}`}>
                      {caseData.scammerDetails ? 'COLLECTED' : 'PENDING'}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Evidence Files:</span>
                    <span className="evidence-count">
                      {caseData.evidence?.length || 0} files
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Comments */}
              <div className="admin-comments">
                <h3>Add Admin Comment</h3>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  placeholder="Add your comments, notes, or observations about this case..."
                  rows={4}
                />
                <button 
                  className="add-comment-btn"
                  onClick={handleAddComment}
                >
                  <span>📤</span> Add Comment
                </button>
              </div>

              {/* Existing Comments */}
              {caseData.adminComments && caseData.adminComments.length > 0 && (
                <div className="existing-comments">
                  <h3>Previous Comments</h3>
                  <div className="comments-list">
                    {caseData.adminComments.map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <div className="comment-header">
                          <span className="comment-author">{comment.adminName}</span>
                          <span className="comment-date">{formatDate(comment.createdAt)}</span>
                        </div>
                        <div className="comment-content">{comment.comment}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'session' && isAdmin && (
            <div className="session-content">
              <h2>🔐 User Session History</h2>
              <div className="session-info-section">
                <div className="user-session-header">
                  <div className="user-info">
                    <h3>👤 {caseData.user?.name || 'Unknown User'}</h3>
                    <p>{caseData.user?.email || 'No email provided'}</p>
                    <span className="role-badge">{caseData.user?.role || 'user'}</span>
                  </div>
                </div>

                <div className="session-stats">
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <div className="stat-number">12</div>
                      <div className="stat-label">Total Sessions</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                      <div className="stat-number">10</div>
                      <div className="stat-label">Successful Logins</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">❌</div>
                    <div className="stat-content">
                      <div className="stat-number">2</div>
                      <div className="stat-label">Failed Attempts</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🕐</div>
                    <div className="stat-content">
                      <div className="stat-number">2h 30m</div>
                      <div className="stat-label">Current Session</div>
                    </div>
                  </div>
                </div>

                <div className="session-details">
                  <h3>Recent Login History</h3>
                  <div className="login-history">
                    <div className="history-item success">
                      <div className="history-time">2024-01-15 14:30:25</div>
                      <div className="history-details">
                        <span className="status-icon">✅</span>
                        <span>Login Successful</span>
                        <span className="ip-address">192.168.1.100</span>
                      </div>
                    </div>
                    <div className="history-item success">
                      <div className="history-time">2024-01-15 09:15:42</div>
                      <div className="history-details">
                        <span className="status-icon">✅</span>
                        <span>Login Successful</span>
                        <span className="ip-address">192.168.1.100</span>
                      </div>
                    </div>
                    <div className="history-item failed">
                      <div className="history-time">2024-01-14 16:45:18</div>
                      <div className="history-details">
                        <span className="status-icon">❌</span>
                        <span>Login Failed - Wrong Password</span>
                        <span className="ip-address">192.168.1.100</span>
                      </div>
                    </div>
                    <div className="history-item success">
                      <div className="history-time">2024-01-14 10:22:33</div>
                      <div className="history-details">
                        <span className="status-icon">✅</span>
                        <span>Login Successful</span>
                        <span className="ip-address">192.168.1.100</span>
                      </div>
                    </div>
                    <div className="history-item failed">
                      <div className="history-time">2024-01-13 20:15:07</div>
                      <div className="history-details">
                        <span className="status-icon">❌</span>
                        <span>Login Failed - Invalid Credentials</span>
                        <span className="ip-address">192.168.1.100</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="activity-log">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    <div className="activity-item">
                      <div className="activity-time">2024-01-15 14:35:12</div>
                      <div className="activity-details">
                        <span className="activity-action">Case Viewed</span>
                        <span className="activity-desc">Viewed case details for {caseData.caseId}</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-time">2024-01-15 14:30:25</div>
                      <div className="activity-details">
                        <span className="activity-action">Login</span>
                        <span className="activity-desc">Successfully logged into the system</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-time">2024-01-15 09:20:15</div>
                      <div className="activity-details">
                        <span className="activity-action">Case Created</span>
                        <span className="activity-desc">Created new case report</span>
                      </div>
                    </div>
                    <div className="activity-item">
                      <div className="activity-time">2024-01-14 10:25:30</div>
                      <div className="activity-details">
                        <span className="activity-action">Profile Updated</span>
                        <span className="activity-desc">Updated personal information</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scammer Details Modal */}
      <ScammerDetailsModal
        caseId={caseId}
        isOpen={showScammerModal}
        onClose={() => setShowScammerModal(false)}
        onScammerCreated={handleScammerCreated}
      />

      {/* CRPC Documents Modal */}
      <CRPCDocumentsModal
        isOpen={showCRPCDocumentsModal}
        onClose={() => setShowCRPCDocumentsModal(false)}
        caseId={caseId}
      />
    </div>
  );
};

export default CaseDetailsModal;