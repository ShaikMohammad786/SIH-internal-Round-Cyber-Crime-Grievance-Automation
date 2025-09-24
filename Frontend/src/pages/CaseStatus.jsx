import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import { userProfilesAPI } from "../utils/userProfilesAPI";
import Header from "../components/Header";
import jsPDF from "jspdf";
import "./CaseStatus.css";

const CaseStatus = () => {
  const { caseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Process flow steps - simplified and synchronized
  const processSteps = [
    { id: 'report_submitted', label: 'Report Submitted', description: 'Initial report received and logged', icon: '📄', color: '#3b82f6' },
    { id: 'information_verified', label: 'Information Verified', description: 'Personal and contact details verified', icon: '🔍', color: '#10b981' },
    { id: 'crpc_generated', label: '91 CrPC Generated', description: 'Legal document generated under Section 91 of CrPC', icon: '📋', color: '#8b5cf6' },
    { id: 'emails_sent', label: 'Authorities Notified', description: 'Emails sent to telecom, banking, and nodal authorities', icon: '📧', color: '#f59e0b' },
    { id: 'under_investigation', label: 'Under Investigation', description: 'Case is being investigated by authorities', icon: '🔍', color: '#ef4444' },
    { id: 'evidence_collected', label: 'Evidence Collected', description: 'All relevant evidence gathered', icon: '📋', color: '#8b5cf6' },
    { id: 'resolved', label: 'Case Resolved', description: 'Case successfully resolved', icon: '✅', color: '#10b981' },
    { id: 'closed', label: 'Case Closed', description: 'Case officially closed and archived', icon: '🔒', color: '#6b7280' }
  ];

  useEffect(() => {
    loadCaseData();
  }, [caseId, location.state?.caseId]);

  const loadCaseData = async () => {
    try {
      setLoading(true);
      setError("");
      const id = caseId || location.state?.caseId;
      
      console.log("Loading case data for ID:", id);
      
      if (!id) {
        setError("No case ID provided");
        return;
      }

      // Fetch both case details and timeline
      const [caseResponse, timelineResponse] = await Promise.all([
        userProfilesAPI.getCaseDetails(id),
        fetch(`/api/timeline/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }).then(async res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await res.text();
            console.warn("Timeline response is not JSON:", text.substring(0, 100));
            return { success: false, data: { timeline: [] } };
          }
          return res.json();
        }).catch(err => {
          console.warn("Timeline fetch failed:", err);
          return { success: false, data: { timeline: [] } };
        })
      ]);
      
      console.log("Case details response:", caseResponse);
      console.log("Timeline response:", timelineResponse);
      
      if (caseResponse.success) {
        setCaseData(caseResponse.data);
      } else {
        setError(caseResponse.message || "Failed to load case details");
      }

      if (timelineResponse.success) {
        setTimeline(timelineResponse.data.timeline || []);
      }
    } catch (error) {
      console.error("Error loading case data:", error);
      setError(error.message || "Failed to load case details");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const step = processSteps.find(s => s.id === status);
    return step || { 
      id: status, 
      label: status.replace('_', ' ').toUpperCase(), 
      description: 'Status update', 
      icon: '❓', 
      color: '#6b7280' 
    };
  };

  const getStepIndex = (status) => {
    return processSteps.findIndex(step => step.id === status);
  };

  const isStepCompleted = (stepId, currentStatus) => {
    const currentIndex = getStepIndex(currentStatus);
    const stepIndex = getStepIndex(stepId);
    return stepIndex <= currentIndex;
  };

  // Clean up timeline entries and remove duplicates
  const getCleanTimeline = () => {
    if (!timeline || timeline.length === 0) {
      // Fallback to process steps based on case status
      const currentStepIndex = processSteps.findIndex(step => step.id === caseData?.status);
      return processSteps.slice(0, currentStepIndex + 1).map((step, index) => ({
        ...step,
        completed: true,
        completedAt: caseData?.createdAt || new Date()
      }));
    }

    // Remove duplicates and sort by creation time
    const uniqueTimeline = timeline.reduce((acc, entry) => {
      const existing = acc.find(item => item.stage === entry.stage);
      if (!existing) {
        acc.push(entry);
      }
      return acc;
    }, []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Create a clean timeline based on actual timeline entries
    const cleanTimeline = [];
    
    // Add completed timeline entries
    uniqueTimeline.forEach(entry => {
      const step = processSteps.find(s => s.id === entry.stage);
      if (step) {
        cleanTimeline.push({
          ...step,
          completed: true,
          completedAt: entry.createdAt,
          adminComment: entry.adminComment,
          description: entry.description || step.description
        });
      }
    });

    // Add pending steps that haven't been completed yet
    processSteps.forEach(step => {
      const existing = cleanTimeline.find(item => item.id === step.id);
      if (!existing) {
        cleanTimeline.push({
          ...step,
          completed: false,
          completedAt: null,
          adminComment: null,
          description: step.description
        });
      }
    });

    // Sort by step order
    return cleanTimeline.sort((a, b) => {
      const aIndex = processSteps.findIndex(s => s.id === a.id);
      const bIndex = processSteps.findIndex(s => s.id === b.id);
      return aIndex - bIndex;
    });
  };

  const isStepActive = (stepId, currentStatus) => {
    return stepId === currentStatus;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAmount = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  const downloadPDF = async () => {
    try {
      setDownloading(true);
      
      const doc = new jsPDF();
      
      // Professional header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("FRAUDLENS", 20, 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text("Official Case File", 20, 28);
      
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(`CASE ID: ${caseData.caseId}`, 150, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 150, 28);
      
      doc.setTextColor(0, 0, 0);
      
      let yPosition = 60;
      
      // Case Information
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("CASE INFORMATION", 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Case Type: ${caseData.caseType}`, 20, yPosition);
      doc.text(`Status: ${getStatusInfo(caseData.status).label}`, 20, yPosition + 8);
      doc.text(`Amount: ${formatAmount(caseData.amount)}`, 20, yPosition + 16);
      doc.text(`Reported: ${formatDate(caseData.createdAt)}`, 20, yPosition + 24);
      
      yPosition += 50;
      
      // Description
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("INCIDENT DESCRIPTION", 20, yPosition);
      yPosition += 15;
      
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      const description = caseData.description || "No description provided";
      const descriptionLines = doc.splitTextToSize(description, 170);
      doc.text(descriptionLines, 20, yPosition);
      
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(15, 23, 42);
        doc.rect(0, doc.internal.pageSize.height - 20, 210, 20, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(`FraudLens Case Management System - Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 12);
        doc.text(`Confidential Document`, 20, doc.internal.pageSize.height - 6);
      }
      
      doc.save(`Case-${caseData.caseId}-Official-File.pdf`);
      
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download case report");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="case-status-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="case-status-page">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error Loading Case</h3>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => navigate("/case-history")}>
            Back to Case History
          </button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="case-status-page">
        <div className="error-container">
          <div className="error-icon">📄</div>
          <h3>Case Not Found</h3>
          <p>The requested case could not be found.</p>
          <button className="btn-primary" onClick={() => navigate("/case-history")}>
            Back to Case History
          </button>
        </div>
      </div>
    );
  }

  const currentStatusInfo = getStatusInfo(caseData.status);

  return (
    <div className="case-status-page">
      <Header loggedIn={true} username={getUser()?.name || getUser()?.username} />
      <div className="case-header">
        <div className="header-content">
          <div className="case-title">
            <h1>Case Status</h1>
            <div className="case-id">{caseData.caseId}</div>
          </div>
          <div className="header-actions">
            <button 
              className="btn-secondary" 
              onClick={() => navigate("/case-history")}
            >
              ← Back to Cases
            </button>
            <button 
              className="btn-primary" 
              onClick={downloadPDF}
              disabled={downloading}
            >
              {downloading ? "Generating..." : "📄 Download PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="case-content">
        {/* Case Overview */}
        <div className="case-overview">
          <div className="overview-card">
            <div className="card-header">
              <h2>Case Overview</h2>
              <div className="status-badge" style={{ backgroundColor: currentStatusInfo.color }}>
                <span className="status-icon">{currentStatusInfo.icon}</span>
                <span className="status-label">{currentStatusInfo.label}</span>
              </div>
            </div>
            <div className="card-content">
              <div className="info-grid">
                <div className="info-item">
                  <label>Case Type</label>
                  <span>{caseData.caseType}</span>
                </div>
                <div className="info-item">
                  <label>Amount Lost</label>
                  <span>{formatAmount(caseData.amount)}</span>
                </div>
                <div className="info-item">
                  <label>Reported Date</label>
                  <span>{formatDate(caseData.createdAt)}</span>
                </div>
                <div className="info-item">
                  <label>Last Updated</label>
                  <span>{formatDate(caseData.updatedAt)}</span>
                </div>
                <div className="info-item">
                  <label>Location</label>
                  <span>{caseData.location?.state}, {caseData.location?.city}</span>
                </div>
                <div className="info-item">
                  <label>Priority</label>
                  <span className="priority">{caseData.priority?.toUpperCase() || 'MEDIUM'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Victim Details */}
        <div className="victim-details">
          <div className="details-card">
            <div className="card-header">
              <h2>👤 Victim Information</h2>
            </div>
            <div className="card-content">
              <div className="victim-grid">
                <div className="victim-item">
                  <label>Full Name</label>
                  <span>{caseData.formData?.personalInfo?.firstName || ''} {caseData.formData?.personalInfo?.middleName || ''} {caseData.formData?.personalInfo?.lastName || ''}</span>
                </div>
                <div className="victim-item">
                  <label>Email Address</label>
                  <span>{caseData.formData?.contactInfo?.email || caseData.contactInfo?.email || 'Not provided'}</span>
                </div>
                <div className="victim-item">
                  <label>Phone Number</label>
                  <span>{caseData.formData?.contactInfo?.phone || caseData.contactInfo?.phone || 'Not provided'}</span>
                </div>
                <div className="victim-item">
                  <label>Alternate Phone</label>
                  <span>{caseData.formData?.contactInfo?.alternatePhone || 'Not provided'}</span>
                </div>
                <div className="victim-item">
                  <label>Date of Birth</label>
                  <span>{caseData.formData?.personalInfo?.dateOfBirth || 'Not provided'}</span>
                </div>
                <div className="victim-item">
                  <label>Gender</label>
                  <span>{caseData.formData?.personalInfo?.gender || 'Not provided'}</span>
                </div>
                <div className="victim-item">
                  <label>Nationality</label>
                  <span>{caseData.formData?.personalInfo?.nationality || 'Not provided'}</span>
                </div>
                <div className="victim-item">
                  <label>Aadhaar Number</label>
                  <span>{caseData.formData?.governmentIds?.aadhaarNumber || 'Not provided'}</span>
                </div>
                <div className="victim-item">
                  <label>PAN Number</label>
                  <span>{caseData.formData?.governmentIds?.panNumber || 'Not provided'}</span>
                </div>
                <div className="victim-item">
                  <label>Address</label>
                  <span>{caseData.formData?.addressInfo?.currentAddress?.street || ''}, {caseData.formData?.addressInfo?.currentAddress?.city || ''}, {caseData.formData?.addressInfo?.currentAddress?.state || ''} {caseData.formData?.addressInfo?.currentAddress?.postalCode || ''}</span>
                </div>
                <div className="victim-item">
                  <label>Emergency Contact</label>
                  <span>{caseData.formData?.contactInfo?.emergencyContact?.name || 'Not provided'} ({caseData.formData?.contactInfo?.emergencyContact?.relation || ''})</span>
                </div>
                <div className="victim-item">
                  <label>Emergency Phone</label>
                  <span>{caseData.formData?.contactInfo?.emergencyContact?.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Suspect Details */}
        <div className="suspect-details">
          <div className="details-card">
            <div className="card-header">
              <h2>🕵️ Suspect Information</h2>
            </div>
            <div className="card-content">
              <div className="suspect-grid">
                <div className="suspect-item">
                  <label>Suspect Name</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.name || 'Not provided'}</span>
                </div>
                <div className="suspect-item">
                  <label>Phone Number</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.phone || 'Not provided'}</span>
                </div>
                <div className="suspect-item">
                  <label>Email Address</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.email || 'Not provided'}</span>
                </div>
                <div className="suspect-item">
                  <label>Website</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.website || 'Not provided'}</span>
                </div>
                <div className="suspect-item">
                  <label>Bank Account</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.bankAccount || 'Not provided'}</span>
                </div>
                <div className="suspect-item">
                  <label>UPI ID</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.upiId || 'Not provided'}</span>
                </div>
                <div className="suspect-item">
                  <label>IFSC Code</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.ifscCode || 'Not provided'}</span>
                </div>
                <div className="suspect-item">
                  <label>Address</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.address || 'Not provided'}</span>
                </div>
                <div className="suspect-item">
                  <label>Social Media</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.socialMedia || 'Not provided'}</span>
                </div>
                <div className="suspect-item">
                  <label>Additional Info</label>
                  <span>{caseData.formData?.incidentInfo?.suspectInfo?.additionalInfo || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Details */}
        <div className="financial-details">
          <div className="details-card">
            <div className="card-header">
              <h2>💰 Financial Information</h2>
            </div>
            <div className="card-content">
              <div className="financial-grid">
                <div className="financial-item">
                  <label>Amount Lost</label>
                  <span>{formatAmount(caseData.formData?.financialInfo?.amountLost || caseData.amount)}</span>
                </div>
                <div className="financial-item">
                  <label>Currency</label>
                  <span>{caseData.formData?.financialInfo?.currency || 'INR'}</span>
                </div>
                <div className="financial-item">
                  <label>Payment Method</label>
                  <span>{caseData.formData?.financialInfo?.paymentMethod || 'Not specified'}</span>
                </div>
                <div className="financial-item">
                  <label>Bank Account Number</label>
                  <span>{caseData.formData?.financialInfo?.bankDetails?.accountNumber || 'Not provided'}</span>
                </div>
                <div className="financial-item">
                  <label>IFSC Code</label>
                  <span>{caseData.formData?.financialInfo?.bankDetails?.ifscCode || 'Not provided'}</span>
                </div>
                <div className="financial-item">
                  <label>Bank Name</label>
                  <span>{caseData.formData?.financialInfo?.bankDetails?.bankName || 'Not provided'}</span>
                </div>
                <div className="financial-item">
                  <label>Transaction Details</label>
                  <span>{caseData.formData?.financialInfo?.transactionDetails || 'Not provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Process Timeline */}
        <div className="process-timeline">
          <div className="timeline-header">
            <h2>Case Progress</h2>
            <p>Track the current status and progress of your case</p>
          </div>
          <div className="timeline-container">
            {processSteps.map((step, index) => {
              const isCompleted = isStepCompleted(step.id, caseData.status);
              const isActive = isStepActive(step.id, caseData.status);
              const isLast = index === processSteps.length - 1;
              
              return (
                <div key={step.id} className={`timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                  <div className="step-connector">
                    {!isLast && (
                      <div className={`connector-line ${isCompleted ? 'completed' : ''}`}></div>
                    )}
                  </div>
                  <div className="step-content">
                    <div className="step-icon" style={{ backgroundColor: isCompleted ? step.color : '#e5e7eb' }}>
                      <span className="icon">{step.icon}</span>
                      {isCompleted && (
                        <div className="checkmark">✓</div>
                      )}
                    </div>
                    <div className="step-details">
                      <div className="step-title">{step.label}</div>
                      <div className="step-description">{step.description}</div>
                      {isActive && (
                        <div className="step-status">
                          <div className="pulse-dot"></div>
                          <span>In Progress</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Incident Details */}
        <div className="incident-details">
          <div className="details-card">
            <div className="card-header">
              <h2>📋 Incident Details</h2>
            </div>
            <div className="card-content">
              <div className="incident-grid">
                <div className="incident-item">
                  <label>Incident Date</label>
                  <span>{formatDate(caseData.formData?.incidentInfo?.incidentDate || caseData.incidentDate)}</span>
                </div>
                <div className="incident-item">
                  <label>Incident Time</label>
                  <span>{caseData.formData?.incidentInfo?.incidentTime || 'Not specified'}</span>
                </div>
                <div className="incident-item">
                  <label>Scam Type</label>
                  <span>{caseData.formData?.incidentInfo?.scamType || caseData.caseType || 'Not specified'}</span>
                </div>
                <div className="incident-item">
                  <label>Communication Method</label>
                  <span>{caseData.formData?.incidentInfo?.communicationMethod || 'Not specified'}</span>
                </div>
                <div className="incident-item">
                  <label>Witnesses</label>
                  <span>{caseData.formData?.incidentInfo?.witnesses || 'None'}</span>
                </div>
                <div className="incident-item full-width">
                  <label>Description</label>
                  <span>{caseData.formData?.incidentInfo?.description || caseData.description || 'No description provided'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="location-details">
          <div className="details-card">
            <div className="card-header">
              <h2>📍 Location Information</h2>
            </div>
            <div className="card-content">
              <div className="location-grid">
                <div className="location-item">
                  <label>State</label>
                  <span>{caseData.formData?.incidentInfo?.location?.state || caseData.location?.state || 'N/A'}</span>
                </div>
                <div className="location-item">
                  <label>City</label>
                  <span>{caseData.formData?.incidentInfo?.location?.city || caseData.location?.city || 'N/A'}</span>
                </div>
                <div className="location-item">
                  <label>Address</label>
                  <span>{caseData.formData?.incidentInfo?.location?.address || caseData.location?.address || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline History */}
        <div className="timeline-history">
          <h3>Case Progress Timeline</h3>
          <div className="history-list">
            {getCleanTimeline().map((step, index) => (
              <div key={step.id} className={`history-item ${step.completed ? 'completed' : 'pending'}`}>
                <div className="history-time">
                  {step.completed ? formatDate(step.completedAt) : 'Pending'}
                </div>
                <div className="history-content">
                  <div className="history-status">
                    <span className="status-icon">{step.icon}</span>
                    {step.label}
                    {step.completed && <span className="completed-badge">✓ Completed</span>}
                  </div>
                  <div className="history-description">{step.description}</div>
                  {step.adminComment && (
                    <div className="admin-comment">
                      <strong>Admin Note:</strong> {step.adminComment}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseStatus;