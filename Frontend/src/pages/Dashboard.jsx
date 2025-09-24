import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUser } from "../utils/auth";
import { userProfilesAPI } from "../utils/userProfilesAPI";
import { formatAmount, formatDate, getStatusColor, getStatusLabel } from "../utils/casesAPI";
import Header from "../components/Header";
import CaseFlowTracker from "../components/CaseFlowTracker";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [previousCases, setPreviousCases] = useState([]);
  const [showPreviousCases, setShowPreviousCases] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [flowStarted, setFlowStarted] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load fresh dashboard data
        const dashboardResponse = await userProfilesAPI.getDashboardFresh();
        
        if (dashboardResponse.success) {
          const { user: userData, recentCases, statistics } = dashboardResponse.dashboard;
          
          setUser(userData);
          setCases(recentCases || []);
          setStats(statistics || null);
          
          // Debug: Log statistics structure
          console.log('Dashboard statistics:', statistics);
          
          // Load user's own cases (previous cases)
          try {
            const myCasesResponse = await userProfilesAPI.getMyCases();
            if (myCasesResponse.success) {
              setPreviousCases(myCasesResponse.cases || []);
            }
          } catch (error) {
            console.log('Error loading my cases:', error.message);
          }
        }
        
        // Check for success message from navigation
        if (location.state?.message) {
          setSuccessMessage(location.state.message);
          // Clear the message after 5 seconds
          setTimeout(() => setSuccessMessage(null), 5000);
        }

        // Check if flow was started
        if (location.state?.flowStarted && location.state?.caseId) {
          setFlowStarted(true);
          setSelectedCaseId(location.state.caseId);
        }
        
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        // Fallback to local user data
        setUser(getUser());
      }
    };

    loadDashboardData();
  }, [location.state]);


  return (
    <div className="dash-page">
      <Header loggedIn={true} username={user?.name || user?.username} />

      <main className="dash-main">
        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            <span>{successMessage}</span>
            {location.state?.caseId && (
              <span className="case-id">Case ID: {location.state.caseId}</span>
            )}
          </div>
        )}
        
        <section className="welcome-section">
          <h1>Welcome back, {user?.name || 'User'}</h1>
          <p>Manage your scam reports and track case progress from your dashboard.</p>
        </section>


        {stats ? (
              <section className="stats-sections">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                      <div className="stat-number">{stats.totalCases || 0}</div>
                      <div className="stat-label">Total Cases</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                      <div className="stat-number">{formatAmount(stats.totalAmount || 0)}</div>
                      <div className="stat-label">Total Amount</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🔍</div>
                    <div className="stat-info">
                      <div className="stat-number">{stats.activeCases || 0}</div>
                      <div className="stat-label">Active Cases</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <div className="stat-number">{(stats.statusBreakdown?.resolved || 0) + (stats.statusBreakdown?.closed || 0)}</div>
                      <div className="stat-label">Resolved Cases</div>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="stats-sections">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                      <div className="stat-number">0</div>
                      <div className="stat-label">Total Cases</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                      <div className="stat-number">₹0</div>
                      <div className="stat-label">Total Amount</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">🔍</div>
                    <div className="stat-info">
                      <div className="stat-number">0</div>
                      <div className="stat-label">Active Cases</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <div className="stat-number">0</div>
                      <div className="stat-label">Resolved Cases</div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="action-cards">
              <article className="action-card">
                <div className="card-icon blue">
                  <span className="icon">+</span>
                </div>
                <h3>Register New Case</h3>
                <p>Report a new scam incident with our guided step-by-step process</p>
                <button className="card-btn primary" onClick={() => navigate('/register-case')}>Start Report →</button>
              </article>

              <article className="action-card">
                <div className="card-icon green">
                  <span className="icon">🔍</span>
                </div>
                <h3>Case Status</h3>
                <p>Track the progress of your reported cases and view updates</p>
                <button className="card-btn success" onClick={() => navigate('/case-status')}>Check Status →</button>
              </article>

              <article className="action-card">
                <div className="card-icon light-blue">
                  <span className="icon">↻</span>
                </div>
                <h3>Previous Cases</h3>
                <p>View your complete case history and download reports</p>
                <button className="card-btn outline" onClick={() => navigate('/case-history')}>View History →</button>
              </article>
            </section>

            {previousCases.length > 0 && (
              <section className="previous-cases-section">
                <div className="section-header">
                  <div className="section-title">
                    <h2>Previous Cases Found</h2>
                    <p>Cases linked to your Aadhaar/PAN number</p>
                  </div>
                  <button 
                    className="toggle-btn"
                    onClick={() => setShowPreviousCases(!showPreviousCases)}
                  >
                    {showPreviousCases ? 'Hide' : 'Show'} ({previousCases.length})
                  </button>
                </div>
                
                {showPreviousCases && (
                  <div className="previous-cases-list">
                    {previousCases.map((caseItem) => (
                      <div key={caseItem.id} className="previous-case-item">
                        <div className="case-info">
                          <div className="case-icon">📋</div>
                          <div className="case-details">
                            <div className="case-title">{caseItem.caseType}</div>
                            <div className="case-meta">
                              <span>Case ID: {caseItem.caseId}</span>
                              <span className="dot">•</span>
                              <span>{formatDate(caseItem.createdAt)}</span>
                              <span className="dot">•</span>
                              <span className="amount">{formatAmount(caseItem.amount)}</span>
                              {caseItem.isCurrentUser && (
                                <>
                                  <span className="dot">•</span>
                                  <span className="current-user-badge">Your Case</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={`status-badge ${getStatusColor(caseItem.status)}`}>
                          <span className="status-icon">
                            {caseItem.status === 'submitted' && '⏰'}
                            {caseItem.status === 'under_review' && '🔍'}
                            {caseItem.status === 'investigating' && '🕵️'}
                            {caseItem.status === 'resolved' && '✅'}
                            {caseItem.status === 'closed' && '🔒'}
                            {caseItem.status === 'rejected' && '❌'}
                          </span>
                          <span>{getStatusLabel(caseItem.status)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Case Flow Tracker - Show when flow is started */}
            {flowStarted && selectedCaseId && (
              <section className="case-flow-section">
                <CaseFlowTracker 
                  caseId={selectedCaseId} 
                  onStatusUpdate={(caseData) => {
                    console.log('Case status updated:', caseData);
                    // Update local cases if needed
                    setCases(prevCases => 
                      prevCases.map(c => 
                        c.id === selectedCaseId ? { ...c, status: caseData.status } : c
                      )
                    );
                  }}
                />
              </section>
            )}

            <section className="recent-cases">
              <div className="recent-header">
                <div className="recent-title-section">
                  <h2>Recent Cases</h2>
                  <p>Your latest case submissions</p>
                </div>
                <button className="view-all-btn" onClick={() => navigate('/case-history')}>View All</button>
              </div>

              <div className="cases-container">
                {cases.length > 0 ? (
                  cases.slice(0, 3).map((caseItem) => {
                    // Generate more descriptive case titles based on case type
                    const getCaseTitle = (caseType) => {
                      const titleMap = {
                        'upi_fraud': 'UPI Fraud',
                        'investment_scam': 'Investment Scam',
                        'romance_scam': 'Romance Scam',
                        'job_scam': 'Job Scam',
                        'loan_scam': 'Loan Scam',
                        'tech_support': 'Tech Support Scam',
                        'phishing': 'Phishing',
                        'lottery_scam': 'Lottery Scam',
                        'other': 'Fraud Case'
                      };
                      return titleMap[caseType] || caseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    };

                    return (
                      <div key={caseItem.id} className="case-item" onClick={() => navigate('/case-status', { state: { caseId: caseItem.id } })}>
                        <div className="case-info">
                          <div className="case-icon">
                            <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                              <path d="M8 3h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2"/>
                              <path d="M14 3v4h4" stroke="currentColor" strokeWidth="2"/>
                              <path d="M9 12h6M9 16h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            </svg>
                          </div>
                          <div className="case-details">
                            <div className="case-title">{getCaseTitle(caseItem.caseType)}</div>
                            <div className="case-meta">
                              <span>{caseItem.caseId}</span>
                              <span className="dot">•</span>
                              <span>{formatDate(caseItem.createdAt)}</span>
                              <span className="dot">•</span>
                              <span className="amount">{formatAmount(caseItem.amount)}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`status-badge ${getStatusColor(caseItem.status)}`}>
                          <span className="status-icon">
                            {caseItem.status === 'submitted' && '⏰'}
                            {caseItem.status === 'under_review' && '🔍'}
                            {caseItem.status === 'investigating' && '🕵️'}
                            {caseItem.status === 'resolved' && '✅'}
                            {caseItem.status === 'closed' && '🔒'}
                            {caseItem.status === 'rejected' && '❌'}
                          </span>
                          <span>{getStatusLabel(caseItem.status)}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-cases">
                    <div className="no-cases-icon">📋</div>
                    <div className="no-cases-text">
                      <h3>No cases yet</h3>
                      <p>Click "Register New Case" to get started.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>
      </main>
    </div>
  );
};

export default Dashboard;


