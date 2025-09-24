import React, { useEffect, useState } from "react";
import { getUser } from "../utils/auth";
import { userProfilesAPI } from "../utils/userProfilesAPI";
import Header from "../components/Header";
import CaseDetailsModal from "../components/CaseDetailsModal";
import AdminSessionHistory from "../components/AdminSessionHistory";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState("pending");
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [showSessionHistory, setShowSessionHistory] = useState(false);

  useEffect(() => {
    loadDashboardData();
    loadPoliceOfficers();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await userProfilesAPI.getAdminDashboard();
      console.log("Admin dashboard response:", response);
      
      if (response.success) {
        const data = response.data;
        setDashboardData(data);
        setCases(data.recentCases || []);
        setLastUpdated(new Date());
        console.log("Dashboard data loaded:", data);
      } else {
        setError(response.message || "Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error loading admin dashboard:", error);
      setError("Failed to load dashboard data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { label: "Under Review", color: "#f59e0b", icon: "⏰" },
      under_review: { label: "Under Review", color: "#f59e0b", icon: "⏰" },
      investigating: { label: "AI Interaction", color: "#3b82f6", icon: "💬" },
      evidence_sent: { label: "Evidence Sent", color: "#2563eb", icon: "📄" },
      resolved: { label: "Solved", color: "#10b981", icon: "✅" },
      closed: { label: "Closed", color: "#6b7280", icon: "🔒" }
    };
    return statusMap[status] || { label: status, color: "#6b7280", icon: "📋" };
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      high: { label: "High Priority", color: "#dc2626", icon: "⚠️" },
      medium: { label: "Medium", color: "#f59e0b", icon: "⚡" },
      low: { label: "Low", color: "#10b981", icon: "📋" }
    };
    return priorityMap[priority] || { label: "Medium", color: "#f59e0b", icon: "⚡" };
  };

  const getScamTypeInfo = (scamType) => {
    const typeMap = {
      upi_fraud: "UPI Fraud",
      investment_scam: "Investment Scam",
      lottery_scam: "Lottery Scam",
      phishing: "Phishing",
      fake_calls: "Fake Calls",
      other: "Other"
    };
    return typeMap[scamType] || scamType || "Other";
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
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredCases = cases.filter(caseItem => {
    const victimName = caseItem.user?.name || 'Unknown';
    const matchesSearch = caseItem.caseId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         victimName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === "pending" ? 
      !['resolved', 'closed'].includes(caseItem.status) : 
      ['resolved', 'closed'].includes(caseItem.status);
    
    return matchesSearch && matchesTab;
  });

  const pendingCases = cases.filter(caseItem => !['resolved', 'closed'].includes(caseItem.status));
  const solvedCases = cases.filter(caseItem => ['resolved', 'closed'].includes(caseItem.status));

  const handleViewCase = (caseId) => {
    setSelectedCaseId(caseId);
    setShowCaseModal(true);
  };

  const handleCloseModal = () => {
    setShowCaseModal(false);
    setSelectedCaseId(null);
  };

  const handleAdminActionComplete = () => {
    // Refresh dashboard data after admin action
    loadDashboardData();
  };

  const loadPoliceOfficers = async () => {
    try {
      const response = await userProfilesAPI.getPoliceOfficers();
      if (response.success) {
        setPoliceOfficers(response.data);
      }
    } catch (error) {
      console.error('Error loading police officers:', error);
    }
  };

  const handleAssignCase = (caseId) => {
    setSelectedCaseId(caseId);
    setShowAssignModal(true);
  };

  const handleAssignToPolice = async (policeId, policeName) => {
    try {
      const response = await userProfilesAPI.assignCaseToPolice(selectedCaseId, policeId, policeName);
      if (response.success) {
        alert('Case assigned to police officer successfully');
        setShowAssignModal(false);
        loadDashboardData();
      } else {
        alert('Failed to assign case: ' + response.message);
      }
    } catch (error) {
      console.error('Error assigning case:', error);
      alert('Failed to assign case: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <Header loggedIn={true} username={getUser()?.name || getUser()?.username} />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <Header loggedIn={true} username={getUser()?.name || getUser()?.username} />
        <div className="error-container">
          <p>{error}</p>
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Header loggedIn={true} username={getUser()?.name || getUser()?.username} />
      
      {/* Authority Dashboard Header */}
      <div className="authority-header">
        <div className="authority-info">
          <h1>Authority Dashboard</h1>
          <p>Manage and review assigned scam cases</p>
        </div>
        <div className="header-actions">
          <div className="authority-badge">
            <span>Cyber Crime Division • Authorized Personnel Access</span>
          </div>
          <div className="refresh-section">
            {lastUpdated && (
              <div className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            {/* <button 
              className="session-history-btn"
              onClick={() => setShowSessionHistory(!showSessionHistory)}
            >
              <span className="session-icon">🔐</span>
              {showSessionHistory ? 'Hide Session History' : 'View Session History'}
            </button> */}
            <button 
              className="refresh-btn"
              onClick={loadDashboardData}
              disabled={loading}
            >
              <span className="refresh-icon">🔄</span>
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
        <div className="stat-card total-cases">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.totalCases || 0}</div>
            <div className="stat-label">Total Cases</div>
          </div>
        </div>

        <div className="stat-card solved-cases">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.resolvedCases || 0}</div>
            <div className="stat-label">Cases Solved</div>
          </div>
        </div>

        <div className="stat-card ongoing-cases">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-number">{dashboardData?.activeCases || 0}</div>
            <div className="stat-label">Ongoing Cases</div>
          </div>
        </div>
          </div>

      {/* Session History Section */}
      {showSessionHistory && (
        <AdminSessionHistory />
      )}

      {/* Case Management Section */}
      <div className="case-management">
        <div className="section-header">
          <h2>Case Management</h2>
          <p>Review and manage your assigned cases</p>
                  </div>

        {/* Tabs */}
        <div className="case-tabs">
          <button 
            className={`tab-button ${selectedTab === "pending" ? "active" : ""}`}
            onClick={() => setSelectedTab("pending")}
          >
            Pending Cases ({pendingCases.length})
          </button>
          <button 
            className={`tab-button ${selectedTab === "solved" ? "active" : ""}`}
            onClick={() => setSelectedTab("solved")}
          >
            Solved Cases ({solvedCases.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="search-section">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
              <input
                type="text"
              placeholder="Search cases by ID or victim name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          </div>

          {/* Cases Table */}
        <div className="cases-table-container">
          <table className="cases-table">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Victim Details</th>
                <th>Scam Type</th>
                <th>Date Assigned</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map((caseItem, index) => {
                const statusInfo = getStatusInfo(caseItem.status);
                const priorityInfo = getPriorityInfo(caseItem.priority);
                const victimName = caseItem.user?.name || 'Unknown';
                const caseId = caseItem.caseId || `SCR-2024-${String(index + 1).padStart(3, '0')}`;
                
                return (
                  <tr key={caseItem.id || caseItem._id || index}>
                    <td className="case-id">{caseId}</td>
                    <td className="victim-details">
                      <div className="victim-name">{victimName}</div>
                      <div className="case-number">(Case #{String(index + 1).padStart(3, '0')})</div>
                    </td>
                    <td className="scam-type">
                      <span className="scam-type-badge">
                        {getScamTypeInfo(caseItem.caseType)}
                      </span>
                    </td>
                    <td className="date-assigned">
                      <span className="date-icon">📅</span>
                      {formatDate(caseItem.createdAt)}
                    </td>
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
                        <span className="priority-icon">{priorityInfo.icon}</span>
                        {priorityInfo.label}
                    </span>
                    </td>
                    <td className="amount">{formatAmount(caseItem.amount)}</td>
                    <td className="action">
                    <button 
                        className="view-details-btn"
                        onClick={() => handleViewCase(caseItem.id || caseItem._id)}
                    >
                        <span className="action-icon">👁️</span>
                        View Details
                    </button>
                    {caseItem.status === 'emails_sent' && !caseItem.assignedTo && (
                      <button 
                        className="assign-btn"
                        onClick={() => handleAssignCase(caseItem.id || caseItem._id)}
                      >
                        <span className="action-icon">👮</span>
                        Assign to Police
                      </button>
                    )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredCases.length === 0 && (
            <div className="no-cases">
              <p>No {selectedTab} cases found</p>
        </div>
      )}
        </div>
                  </div>

      {/* Case Details Modal */}
      <CaseDetailsModal
        caseId={selectedCaseId}
        isOpen={showCaseModal}
        onClose={handleCloseModal}
        isAdmin={true}
        onAdminActionComplete={handleAdminActionComplete}
      />

      {/* Assign Case Modal */}
      {showAssignModal && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Case to Police Officer</h2>
              <button className="close-btn" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="police-list">
                <h3>Select Police Officer:</h3>
                {policeOfficers.length > 0 ? (
                  <div className="police-grid">
                    {policeOfficers.map((officer) => (
                      <div 
                        key={officer._id} 
                        className="police-card"
                        onClick={() => handleAssignToPolice(officer._id, officer.name)}
                      >
                        <div className="police-avatar">👮</div>
                        <div className="police-info">
                          <h4>{officer.name}</h4>
                          <p>{officer.badgeNumber || 'Badge: N/A'}</p>
                          <p>{officer.department || 'Department: N/A'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No police officers available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;