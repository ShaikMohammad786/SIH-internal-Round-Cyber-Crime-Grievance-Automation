import React, { useState, useEffect } from 'react';
import { caseFlowAPI, CASE_FLOW_STEPS } from '../utils/caseFlowAPI';
import './CaseFlowTracker.css';

const CaseFlowTracker = ({ caseId, onStatusUpdate }) => {
  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (caseId) {
      fetchCaseStatus();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchCaseStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [caseId]);

  const fetchCaseStatus = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
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
    const step = CASE_FLOW_STEPS[stepNumber];
    if (!step) return '📄';
    
    switch (status) {
      case 'completed':
        return '✅';
      case 'in_progress':
        return '⏳';
      default:
        return step.icon;
    }
  };

  const getStepClass = (stepNumber, status) => {
    const baseClass = 'flow-step';
    switch (status) {
      case 'completed':
        return `${baseClass} completed`;
      case 'in_progress':
        return `${baseClass} in-progress`;
      default:
        return `${baseClass} pending`;
    }
  };

  if (loading) {
    return (
      <div className="case-flow-tracker">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading case status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="case-flow-tracker">
        <div className="error-message">
          <span className="error-icon">❌</span>
          <p>Error loading case status: {error}</p>
          <button onClick={fetchCaseStatus} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="case-flow-tracker">
        <div className="no-data">
          <span className="no-data-icon">📄</span>
          <p>No case data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="case-flow-tracker">
      <div className="flow-header">
        <h3>Case Flow Status</h3>
        <div className="case-info">
          <span className="case-id">Case ID: {caseData.caseId}</span>
          <span className={`status-badge status-${caseData.status}`}>
            {caseData.status.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flow-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${(caseData.currentStep / 9) * 100}%` }}
          ></div>
        </div>
        <div className="progress-text">
          Step {caseData.currentStep} of 9 - {Math.round((caseData.currentStep / 9) * 100)}% Complete
        </div>
      </div>

      <div className="flow-steps">
        {Object.entries(CASE_FLOW_STEPS).map(([stepNumber, step]) => {
          const status = getStepStatus(parseInt(stepNumber));
          const stepClass = getStepClass(parseInt(stepNumber), status);
          const icon = getStepIcon(parseInt(stepNumber), status);
          
          return (
            <div key={stepNumber} className={stepClass}>
              <div className="step-icon">
                {icon}
              </div>
              <div className="step-content">
                <div className="step-title">
                  {step.name}
                  {status === 'completed' && <span className="completed-badge">✓</span>}
                  {status === 'in_progress' && <span className="progress-badge">In Progress</span>}
                </div>
                <div className="step-description">
                  {step.description}
                </div>
                {status === 'completed' && (
                  <div className="step-timestamp">
                    Completed {new Date().toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {timeline.length > 0 && (
        <div className="timeline-section">
          <h4>Recent Activity</h4>
          <div className="timeline">
            {timeline.slice(-5).reverse().map((entry, index) => (
              <div key={index} className="timeline-entry">
                <div className="timeline-icon">{entry.icon}</div>
                <div className="timeline-content">
                  <div className="timeline-title">{entry.stage}</div>
                  <div className="timeline-description">{entry.description}</div>
                  <div className="timeline-time">
                    {new Date(entry.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flow-actions">
        <button 
          onClick={fetchCaseStatus} 
          className="refresh-btn"
          disabled={loading}
        >
          {loading ? '⏳' : '🔄'} Refresh Status
        </button>
      </div>
    </div>
  );
};

export default CaseFlowTracker;
