import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import { userProfilesAPI } from "../utils/userProfilesAPI";
import Header from "../components/Header";
import jsPDF from "jspdf";
import "./CaseHistory.css";

const CaseHistory = () => {
  const navigate = useNavigate();
  const username = useMemo(() => {
    const user = getUser();
    return user?.name || user?.username || "User";
  }, []);
  
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedCases, setSelectedCases] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);

  // Load cases on component mount and when component becomes visible
  useEffect(() => {
    loadCases();
  }, []);

  // Refresh cases when component becomes visible (user navigates back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadCases();
      }
    };

    const handleFocus = () => {
      loadCases();
    };

    // Refresh when user navigates back to this page
    const handlePageShow = () => {
      loadCases();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // Auto-refresh every 30 seconds to catch admin updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadCases();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("Loading user cases...");
      
      const response = await userProfilesAPI.getMyCases();
      console.log("Cases response:", response);
      
      if (response.success) {
        const newCases = response.cases || [];
        const previousCount = cases.length;
        
        setCases(newCases);
        setLastRefresh(new Date());
        
        // Show notification if cases were updated (not initial load)
        if (previousCount > 0 && newCases.length > 0) {
          setShowUpdateNotification(true);
          setTimeout(() => setShowUpdateNotification(false), 3000);
        }
        
        console.log("Loaded cases:", newCases.length);
      } else {
        setError(response.message || "Failed to load cases");
      }
    } catch (error) {
      console.error("Error loading cases:", error);
      setError(error.message || "Failed to load cases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Get unique values for filters
  const uniqueTypes = useMemo(() => {
    const types = [...new Set(cases.map(c => c.caseType).filter(Boolean))];
    return types.sort();
  }, [cases]);

  const uniqueStatuses = useMemo(() => {
    const statuses = [...new Set(cases.map(c => c.status).filter(Boolean))];
    return statuses.sort();
  }, [cases]);

  // Filter and sort cases
  const filteredAndSortedCases = useMemo(() => {
    let filtered = [...cases];

    // Search filter
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(caseItem => 
        (caseItem.caseId || '').toLowerCase().includes(query) ||
        (caseItem.caseType || '').toLowerCase().includes(query) ||
        (caseItem.description || '').toLowerCase().includes(query) ||
        (caseItem.status || '').toLowerCase().includes(query) ||
        (caseItem.location?.state || '').toLowerCase().includes(query) ||
        (caseItem.location?.city || '').toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(caseItem => caseItem.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(caseItem => caseItem.caseType === typeFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(caseItem => {
            const caseDate = new Date(caseItem.createdAt);
            return caseDate.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(caseItem => new Date(caseItem.createdAt) >= weekAgo);
          break;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(caseItem => new Date(caseItem.createdAt) >= monthAgo);
          break;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(caseItem => new Date(caseItem.createdAt) >= yearAgo);
          break;
      }
    }

    // Amount filter
    if (amountFilter !== 'all') {
      filtered = filtered.filter(caseItem => {
        const amount = Number(caseItem.amount || 0);
        switch (amountFilter) {
          case '0-1000':
            return amount >= 0 && amount <= 1000;
          case '1000-10000':
            return amount > 1000 && amount <= 10000;
          case '10000-50000':
            return amount > 10000 && amount <= 50000;
          case '50000+':
            return amount > 50000;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      
      switch (sortBy) {
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          aVal = new Date(a.updatedAt || a.createdAt).getTime();
          bVal = new Date(b.updatedAt || b.createdAt).getTime();
          break;
        case 'amount':
          aVal = Number(a.amount || 0);
          bVal = Number(b.amount || 0);
          break;
        case 'status':
          aVal = (a.status || '').toLowerCase();
          bVal = (b.status || '').toLowerCase();
          break;
        case 'caseType':
          aVal = (a.caseType || '').toLowerCase();
          bVal = (b.caseType || '').toLowerCase();
          break;
        default:
          aVal = 0;
          bVal = 0;
      }

      if (sortBy === 'status' || sortBy === 'caseType') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      } else {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
    });

    return filtered;
  }, [cases, searchTerm, statusFilter, typeFilter, dateFilter, amountFilter, sortBy, sortDir]);

  // Get status info
  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { label: "Report Submitted", color: "#3b82f6", icon: "📄" },
      under_review: { label: "Under Review", color: "#f59e0b", icon: "🔍" },
      investigating: { label: "Investigating", color: "#ef4444", icon: "🕵️" },
      resolved: { label: "Resolved", color: "#10b981", icon: "✅" },
      closed: { label: "Closed", color: "#6b7280", icon: "🔒" }
    };
    return statusMap[status] || { label: status, color: "#6b7280", icon: "❓" };
  };

  const getTimelineStatus = (caseItem) => {
    if (!caseItem.timeline || caseItem.timeline.length === 0) {
      return { current: 0, total: 5 };
    }
    
    const completed = caseItem.timeline.filter(t => t.status === 'completed').length;
    return { current: completed, total: caseItem.timeline.length };
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Format amount
  const formatAmount = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle case selection
  const handleCaseSelect = (caseId) => {
    setSelectedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedCases.length === filteredAndSortedCases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(filteredAndSortedCases.map(c => c.id));
    }
  };

  // Download individual case PDF
  const downloadCasePDF = async (caseData) => {
    try {
      const doc = new jsPDF();
      
      // Set font
      doc.setFont("helvetica");
      
      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("FRAUDLENS - CASE REPORT", 20, 30);
      
      // Case details
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Case ID: ${caseData.caseId}`, 20, 50);
      doc.text(`Case Type: ${caseData.caseType}`, 20, 60);
      doc.text(`Status: ${getStatusInfo(caseData.status).label}`, 20, 70);
      doc.text(`Amount: ${formatAmount(caseData.amount)}`, 20, 80);
      doc.text(`Reported: ${formatDate(caseData.createdAt)}`, 20, 90);
      doc.text(`Last Updated: ${formatDate(caseData.updatedAt)}`, 20, 100);
      
      // Description
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("DESCRIPTION", 20, 120);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      const description = doc.splitTextToSize(caseData.description || "No description available", 170);
      doc.text(description, 20, 135);
      
      // Location
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("LOCATION", 20, 160);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`State: ${caseData.location?.state || 'N/A'}`, 20, 175);
      doc.text(`City: ${caseData.location?.city || 'N/A'}`, 20, 185);
      doc.text(`Address: ${caseData.location?.address || 'N/A'}`, 20, 195);
      
      // Footer
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 20, 280);
      doc.text("FraudLens Case Management System", 20, 285);
      
      // Download
      doc.save(`Case-${caseData.caseId}-Report.pdf`);
      
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download case report");
    }
  };

  // Download bulk PDF
  const downloadBulkPDF = async () => {
    if (selectedCases.length === 0) {
      alert("Please select cases to download");
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("FRAUDLENS - BULK CASE REPORT", 20, 30);
      doc.text(`Selected Cases: ${selectedCases.length}`, 20, 40);
      doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 20, 50);
      
      let yPosition = 70;
      const selectedCasesData = cases.filter(c => selectedCases.includes(c.id));
      
      selectedCasesData.forEach((caseData, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Case header
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`Case ${index + 1}: ${caseData.caseId}`, 20, yPosition);
        
        // Case details
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Type: ${caseData.caseType}`, 20, yPosition + 10);
        doc.text(`Status: ${getStatusInfo(caseData.status).label}`, 20, yPosition + 20);
        doc.text(`Amount: ${formatAmount(caseData.amount)}`, 20, yPosition + 30);
        doc.text(`Reported: ${formatDate(caseData.createdAt)}`, 20, yPosition + 40);
        
        yPosition += 60;
      });
      
      // Footer
      doc.setFontSize(10);
      doc.text("FraudLens Case Management System", 20, doc.internal.pageSize.height - 10);
      
      doc.save(`Bulk-Case-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      
    } catch (error) {
      console.error("Error downloading bulk PDF:", error);
      alert("Failed to download bulk report");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setDateFilter("all");
    setAmountFilter("all");
    setSortBy("createdAt");
    setSortDir("desc");
  };

  if (loading) {
    return (
      <div className="case-history-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your cases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="case-history-page">
      <Header loggedIn={true} username={username} />
      <div className="case-history-content">
        <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Case History</h1>
            <p>Track and manage all your reported cases</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-secondary" 
              onClick={() => navigate("/dashboard")}
            >
              ← Back to Dashboard
            </button>
            <button 
              className="btn-secondary"
              onClick={loadCases}
              title="Refresh cases"
            >
              🔄 Refresh
            </button>
            <div className="last-updated">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <button 
              className="btn-primary" 
              onClick={() => navigate("/register-case")}
            >
              + Report New Case
            </button>
          </div>
        </div>
      </div>

      {/* Update Notification */}
      {showUpdateNotification && (
        <div className="update-notification">
          <div className="notification-content">
            <span className="notification-icon">🔄</span>
            <span>Cases updated! Your case status has been refreshed.</span>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-number">{cases.length}</div>
            <div className="stat-label">Total Cases</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔍</div>
          <div className="stat-info">
            <div className="stat-number">
              {cases.filter(c => ['submitted', 'under_review', 'investigating'].includes(c.status)).length}
            </div>
            <div className="stat-label">Active Cases</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-number">
              {cases.filter(c => ['resolved', 'closed'].includes(c.status)).length}
            </div>
            <div className="stat-label">Resolved Cases</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-number">
              {formatAmount(cases.reduce((sum, c) => sum + (Number(c.amount) || 0), 0))}
            </div>
            <div className="stat-label">Total Amount</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search cases by ID, type, description, status, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="search-icon">🔍</div>
        </div>

        <div className="filters-grid">
          <div className="filter-group">
            <label>Status</label>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>
                  {getStatusInfo(status).label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Case Type</label>
            <select 
              value={typeFilter} 
              onChange={(e) => setTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Amount Range</label>
            <select 
              value={amountFilter} 
              onChange={(e) => setAmountFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Amounts</option>
              <option value="0-1000">₹0 - ₹1,000</option>
              <option value="1000-10000">₹1,000 - ₹10,000</option>
              <option value="10000-50000">₹10,000 - ₹50,000</option>
              <option value="50000+">₹50,000+</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="createdAt">Date Created</option>
              <option value="updatedAt">Last Updated</option>
              <option value="amount">Amount</option>
              <option value="status">Status</option>
              <option value="caseType">Case Type</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Order</label>
            <select 
              value={sortDir} 
              onChange={(e) => setSortDir(e.target.value)}
              className="filter-select"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button 
            className="btn-secondary" 
            onClick={clearFilters}
          >
            Clear Filters
          </button>
          <div className="results-count">
            Showing {filteredAndSortedCases.length} of {cases.length} cases
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCases.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            {selectedCases.length} case(s) selected
          </div>
          <div className="bulk-buttons">
            <button 
              className="btn-primary" 
              onClick={downloadBulkPDF}
            >
              📄 Download Selected PDFs
            </button>
            <button 
              className="btn-secondary" 
              onClick={() => setSelectedCases([])}
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Cases List */}
      <div className="cases-section">
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        {filteredAndSortedCases.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>No Cases Found</h3>
            <p>
              {cases.length === 0 
                ? "You haven't reported any cases yet. Click 'Report New Case' to get started."
                : "No cases match your current filters. Try adjusting your search criteria."
              }
            </p>
            {error && (
              <div className="error-message">
                <p>Error: {error}</p>
                <button 
                  className="btn-secondary" 
                  onClick={loadCases}
                >
                  🔄 Retry
                </button>
              </div>
            )}
            {cases.length === 0 && !error && (
              <button 
                className="btn-primary" 
                onClick={() => navigate("/register-case")}
              >
                Report Your First Case
              </button>
            )}
          </div>
        ) : (
          <div className="cases-list">
            <div className="cases-header">
              <div className="case-checkbox">
                <input
                  type="checkbox"
                  checked={selectedCases.length === filteredAndSortedCases.length && filteredAndSortedCases.length > 0}
                  onChange={handleSelectAll}
                />
              </div>
              <div className="case-id">Case ID</div>
              <div className="case-type">Type</div>
              <div className="case-amount">Amount</div>
              <div className="case-status">Status</div>
              <div className="case-date">Date</div>
              <div className="case-progress">Progress</div>
              <div className="case-actions">Actions</div>
            </div>

            {filteredAndSortedCases.map((caseItem) => {
              const statusInfo = getStatusInfo(caseItem.status);
              return (
                <div 
                  key={caseItem.id} 
                  className={`case-item ${selectedCases.includes(caseItem.id) ? 'selected' : ''}`}
                  onClick={() => navigate(`/case-status/${caseItem.id}`)}
                >
                  <div className="case-checkbox" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCases.includes(caseItem.id)}
                      onChange={() => handleCaseSelect(caseItem.id)}
                    />
                  </div>
                  <div className="case-id">
                    <div className="case-id-text">{caseItem.caseId}</div>
                  </div>
                  <div className="case-type">
                    <div className="case-type-text">{caseItem.caseType}</div>
                  </div>
                  <div className="case-amount">
                    <div className="amount-text">{formatAmount(caseItem.amount)}</div>
                  </div>
                  <div className="case-status">
                    <div 
                      className="status-badge" 
                      style={{ backgroundColor: statusInfo.color }}
                    >
                      <span className="status-icon">{statusInfo.icon}</span>
                      <span className="status-label">{statusInfo.label}</span>
                    </div>
                  </div>
                  <div className="case-date">
                    <div className="date-text">{formatDate(caseItem.createdAt)}</div>
                  </div>
                  <div className="case-progress">
                    <div className="progress-info">
                      <span className="progress-text">
                        {(() => {
                          const timelineStatus = getTimelineStatus(caseItem);
                          return `${timelineStatus.current}/${timelineStatus.total} Steps`;
                        })()}
                      </span>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{
                            width: `${(() => {
                              const timelineStatus = getTimelineStatus(caseItem);
                              return (timelineStatus.current / timelineStatus.total) * 100;
                            })()}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="case-actions" onClick={(e) => e.stopPropagation()}>
                    <span 
                      className=""
                      onClick={() => navigate(`/case-status/${caseItem.id}`)}
                      title="View Details"
                    >
                      👁️
                    </span>
                    <span 
                      className=""
                      onClick={() => downloadCasePDF(caseItem)}
                      title="Download PDF"
                    >
                      📄
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default CaseHistory;