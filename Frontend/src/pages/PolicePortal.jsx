import React, { useState, useEffect } from 'react';
import { getUser } from '../utils/auth';
import { userProfilesAPI } from '../utils/userProfilesAPI';
import Header from '../components/Header';
import './PolicePortal.css';

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
      
      // Load dashboard stats and cases in parallel
      const [dashboardResponse, casesResponse] = await Promise.all([
        userProfilesAPI.getPoliceDashboard(),
        userProfilesAPI.getPoliceCases()
      ]);
      
      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      } else {
        console.error('Dashboard error:', dashboardResponse.message);
      }
      
      if (casesResponse.success) {
        setCases(casesResponse.data || []);
        console.log('Police cases loaded:', casesResponse.data);
      } else {
        console.error('Cases error:', casesResponse.message);
        setCases([]);
      }
    } catch (error) {
      console.error('Error loading police dashboard:', error);
      setError('Failed to load dashboard data: ' + error.message);
      setCases([]);
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
      console.error('Error loading case details:', error);
      alert('Failed to load case details');
    }
  };

  const handlePoliceAction = async (action, caseId, additionalData = {}) => {
    try {
      let response;
      
      if (action === 'collect_evidence') {
        // Add evidence first
        response = await userProfilesAPI.addPoliceEvidence(caseId, additionalData);
        if (response.success) {
          // Then update status to evidence_collected
          response = await userProfilesAPI.updatePoliceCaseStatus(caseId, 'evidence_collected', additionalData);
        }
      } else {
        // Map action to status
        const actionToStatus = {
          'start_review': 'under_review',
          'collect_evidence': 'evidence_collected',
          'resolve_case': 'resolved',
          'close_case': 'closed'
        };
        
        const status = actionToStatus[action];
        response = await userProfilesAPI.updatePoliceCaseStatus(caseId, status, additionalData);
      }
      
      if (response.success) {
        alert('Action completed successfully');
        loadDashboardData();
        setActionModal({ show: false, type: '', caseId: '' });
        if (showCaseModal) {
          setShowCaseModal(false);
        }
      } else {
        alert('Failed to complete action: ' + response.message);
      }
    } catch (error) {
      console.error('Error performing police action:', error);
      alert('Failed to complete action: ' + error.message);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'emails_sent': { label: 'Authorities Notified', color: '#3b82f6', icon: '📧' },
      'under_review': { label: 'Under Review', color: '#f59e0b', icon: '🔍' },
      'evidence_collected': { label: 'Evidence Collected', color: '#8b5cf6', icon: '📋' },
      'resolved': { label: 'Resolved', color: '#10b981', icon: '✅' },
      'closed': { label: 'Closed', color: '#6b7280', icon: '🔒' }
    };
    return statusMap[status] || { label: status, color: '#6b7280', icon: '📋' };
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      high: { label: 'High Priority', color: '#dc2626' },
      medium: { label: 'Medium', color: '#f59e0b' },
      low: { label: 'Low', color: '#10b981' }
    };
    return priorityMap[priority] || { label: 'Medium', color: '#f59e0b' };
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
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="police-portal">
        <Header loggedIn={true} username={getUser()?.name || getUser()?.username} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading police portal...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="police-portal">
        <Header loggedIn={true} username={getUser()?.name || getUser()?.username} />
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="police-portal">
      <Header loggedIn={true} username={getUser()?.name || getUser()?.username} />
      
      {/* Police Portal Header */}
      <div className="police-header">
        <div className="police-info">
          <h1>Police Portal</h1>
          <p>Manage assigned fraud cases and investigations</p>
        </div>
        <div className="police-badge">
          <span>Police Officer • Authorized Access</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total-cases">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.totalAssigned || 0}</div>
            <div className="stat-label">Total Assigned</div>
          </div>
        </div>

        <div className="stat-card active-cases">
          <div className="stat-icon">🔍</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.activeCases || 0}</div>
            <div className="stat-label">Active Cases</div>
          </div>
        </div>

        <div className="stat-card resolved-cases">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.resolved || 0}</div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        <div className="stat-card closed-cases">
          <div className="stat-icon">🔒</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.closed || 0}</div>
            <div className="stat-label">Closed</div>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="cases-section">
        <h2>Assigned Cases</h2>
        <div className="cases-table-container">
          <table className="cases-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Victim</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assigned Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((caseItem, index) => {
                const statusInfo = getStatusInfo(caseItem.status);
                const priorityInfo = getPriorityInfo(caseItem.priority);
                
                return (
                  <tr key={caseItem._id || index}>
                    <td className="case-id">{caseItem.caseId}</td>
                    <td className="victim-name">{caseItem.user?.name || 'Unknown'}</td>
                    <td className="amount">{formatAmount(caseItem.amount)}</td>
                    <td className="status">
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: statusInfo.color }}
                      >
                        <span className="status-icon">{statusInfo.icon}</span>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="priority">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: priorityInfo.color }}
                      >
                        {priorityInfo.label}
                      </span>
                    </td>
                    <td className="assigned-date">{formatDate(caseItem.createdAt)}</td>
                    <td className="actions">
                      <button 
                        className="view-btn"
                        onClick={() => handleViewCase(caseItem._id)}
                      >
                        View Details
                      </button>
                      {caseItem.status === 'emails_sent' && (
                        <button 
                          className="action-btn start-review"
                          onClick={() => setActionModal({ show: true, type: 'start_review', caseId: caseItem._id })}
                        >
                          Start Review
                        </button>
                      )}
                      {caseItem.status === 'under_review' && (
                        <button 
                          className="action-btn collect-evidence"
                          onClick={() => setActionModal({ show: true, type: 'collect_evidence', caseId: caseItem._id })}
                        >
                          Collect Evidence
                        </button>
                      )}
                      {caseItem.status === 'evidence_collected' && (
                        <button 
                          className="action-btn resolve-case"
                          onClick={() => setActionModal({ show: true, type: 'resolve_case', caseId: caseItem._id })}
                        >
                          Resolve Case
                        </button>
                      )}
                      {caseItem.status === 'resolved' && (
                        <button 
                          className="action-btn close-case"
                          onClick={() => setActionModal({ show: true, type: 'close_case', caseId: caseItem._id })}
                        >
                          Close Case
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {cases.length === 0 && (
            <div className="no-cases">
              <p>No cases assigned to you</p>
            </div>
          )}
        </div>
      </div>

      {/* Case Details Modal */}
      {showCaseModal && selectedCase && (
        <div className="modal-overlay" onClick={() => setShowCaseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Case Details: {selectedCase.caseId}</h2>
              <button className="close-btn" onClick={() => setShowCaseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="case-info">
                <div className="info-section">
                  <h3>Case Information</h3>
                  <p><strong>Victim:</strong> {selectedCase.user?.name || 'Unknown'}</p>
                  <p><strong>Amount:</strong> {formatAmount(selectedCase.amount)}</p>
                  <p><strong>Status:</strong> {getStatusInfo(selectedCase.status).label}</p>
                  <p><strong>Priority:</strong> {getPriorityInfo(selectedCase.priority).label}</p>
                </div>
                
                {selectedCase.scammerDetails && (
                  <div className="info-section">
                    <h3>Scammer Information</h3>
                    <p><strong>Name:</strong> {selectedCase.scammerDetails.name || 'Unknown'}</p>
                    <p><strong>Phone:</strong> {selectedCase.scammerDetails.phoneNumber || 'N/A'}</p>
                    <p><strong>Bank Account:</strong> {selectedCase.scammerDetails.bankAccount || 'N/A'}</p>
                  </div>
                )}
                
                {selectedCase.timeline && (
                  <div className="info-section">
                    <h3>Case Timeline</h3>
                    <div className="timeline">
                      {selectedCase.timeline.map((item, index) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-icon">{item.icon}</div>
                          <div className="timeline-content">
                            <h4>{item.stageName}</h4>
                            <p>{item.description}</p>
                            <span className="timeline-date">{formatDate(item.createdAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.show && (
        <div className="modal-overlay" onClick={() => setActionModal({ show: false, type: '', caseId: '' })}>
          <div className="modal-content action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Police Action</h2>
              <button className="close-btn" onClick={() => setActionModal({ show: false, type: '', caseId: '' })}>×</button>
            </div>
            <div className="modal-body">
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

  const getFormTitle = () => {
    switch (actionType) {
      case 'start_review': return 'Start Case Review';
      case 'collect_evidence': return 'Collect Evidence';
      case 'resolve_case': return 'Resolve Case';
      case 'close_case': return 'Close Case';
      default: return 'Police Action';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="action-form">
      <h3>{getFormTitle()}</h3>
      
      <div className="form-group">
        <label>Comment/Notes:</label>
        <textarea
          value={formData.comment}
          onChange={(e) => setFormData({...formData, comment: e.target.value})}
          placeholder="Add your comments or notes..."
          rows={3}
          required
        />
      </div>

      {actionType === 'collect_evidence' && (
        <>
          <div className="form-group">
            <label>Evidence Type:</label>
            <select
              value={formData.evidenceType}
              onChange={(e) => setFormData({...formData, evidenceType: e.target.value})}
              required
            >
              <option value="">Select evidence type</option>
              <option value="arrest">Arrest Made</option>
              <option value="investigation">Investigation Complete</option>
              <option value="recommendation">Recommendation</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Details:</label>
            <textarea
              value={formData.details}
              onChange={(e) => setFormData({...formData, details: e.target.value})}
              placeholder="Provide detailed information..."
              rows={3}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Arrest Information (if applicable):</label>
            <textarea
              value={formData.arrestInfo}
              onChange={(e) => setFormData({...formData, arrestInfo: e.target.value})}
              placeholder="Arrest details, charges, etc."
              rows={2}
            />
          </div>
          
          <div className="form-group">
            <label>Recommendation:</label>
            <textarea
              value={formData.recommendation}
              onChange={(e) => setFormData({...formData, recommendation: e.target.value})}
              placeholder="Your recommendation for this case..."
              rows={2}
            />
          </div>
        </>
      )}

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
        <button type="submit" className="submit-btn">Submit Action</button>
      </div>
    </form>
  );
};

export default PolicePortal;
