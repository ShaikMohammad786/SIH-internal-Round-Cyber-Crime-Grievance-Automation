import React, { useState, useEffect } from 'react';
import { caseFlowAPI } from '../utils/caseFlowAPI';
import './AdminCaseFlowManager.css';

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
      // For now, we'll simulate with empty array
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
    }
  };

  const openCaseFlow = (caseId) => {
    setSelectedCase({ id: caseId });
    setShowFlowTracker(true);
  };

  if (loading) {
    return (
      <div className="admin-case-flow-manager">
        <div className="loading">Loading cases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-case-flow-manager">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="admin-case-flow-manager">
      <div className="manager-header">
        <h2>Case Flow Management</h2>
        <p>Monitor and manage the complete case flow process</p>
      </div>

      {showFlowTracker && selectedCase && (
        <div className="flow-tracker-modal">
          <div className="modal-header">
            <h3>Case Flow Tracker</h3>
            <button 
              className="close-btn"
              onClick={() => setShowFlowTracker(false)}
            >
              ✕
            </button>
          </div>
          <div className="modal-content">
            <CaseFlowTracker 
              caseId={selectedCase.id}
              onStatusUpdate={(caseData) => {
                setSelectedCase(caseData);
              }}
            />
            <div className="admin-actions">
              <h4>Manual Step Control</h4>
              <div className="step-buttons">
                {[2, 3, 4, 5, 6, 7, 8, 9].map(step => (
                  <button
                    key={step}
                    className="step-btn"
                    onClick={() => handleStepProgress(selectedCase.id, step)}
                  >
                    Step {step}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="cases-grid">
        {cases.length === 0 ? (
          <div className="no-cases">
            <div className="no-cases-icon">📋</div>
            <h3>No Cases Available</h3>
            <p>Cases will appear here as they are submitted</p>
          </div>
        ) : (
          cases.map(caseItem => (
            <div key={caseItem.id} className="case-card">
              <div className="case-header">
                <h4>{caseItem.caseType}</h4>
                <span className="case-id">{caseItem.caseId}</span>
              </div>
              <div className="case-details">
                <p><strong>Status:</strong> {caseItem.status}</p>
                <p><strong>Amount:</strong> ₹{caseItem.amount?.toLocaleString()}</p>
                <p><strong>Created:</strong> {new Date(caseItem.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="case-actions">
                <button 
                  className="view-flow-btn"
                  onClick={() => openCaseFlow(caseItem.id)}
                >
                  View Flow
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminCaseFlowManager;
