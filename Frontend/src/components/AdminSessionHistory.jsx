import React, { useState, useEffect } from 'react';
import { getUser, getUserHistory, getCurrentSession } from '../utils/auth';
import './AdminSessionHistory.css';

const AdminSessionHistory = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('session');

  useEffect(() => {
    const currentUser = getUser();
    const currentSession = getCurrentSession();
    const userHistory = currentUser ? getUserHistory(currentUser.id) : null;

    setUser(currentUser);
    setSession(currentSession);
    setHistory(userHistory);
  }, []);

  if (!user) {
    return <div className="admin-session-history">Please log in to view session history.</div>;
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getSessionDuration = () => {
    if (!session) return 'Unknown';
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const diffMs = now - loginTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  return (
    <div className="admin-session-history">
      <div className="session-header">
        <h2>🔐 Admin Session & History</h2>
        <div className="admin-info">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <span className="role-badge admin-badge">{user.role}</span>
        </div>
      </div>

      <div className="session-tabs">
        <button 
          className={activeTab === 'session' ? 'active' : ''}
          onClick={() => setActiveTab('session')}
        >
          Current Session
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          Login History
        </button>
        <button 
          className={activeTab === 'activity' ? 'active' : ''}
          onClick={() => setActiveTab('activity')}
        >
          Activity Log
        </button>
      </div>

      <div className="session-content">
        {activeTab === 'session' && session && (
          <div className="tab-content">
            <div className="info-section">
              <h4>Current Session Details</h4>
              <div className="info-grid">
                <div className="info-item">
                  <label>Session ID:</label>
                  <span className="session-id">{session.sessionId}</span>
                </div>
                <div className="info-item">
                  <label>Login Time:</label>
                  <span>{formatDate(session.loginTime)}</span>
                </div>
                <div className="info-item">
                  <label>Last Activity:</label>
                  <span>{formatDate(session.lastActivity)}</span>
                </div>
                <div className="info-item">
                  <label>Session Duration:</label>
                  <span className="duration">{getSessionDuration()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && history && (
          <div className="tab-content">
            <div className="info-section">
              <h4>Recent Login History</h4>
              <div className="history-list">
                {history.loginHistory.slice(-10).map((login, index) => (
                  <div key={index} className="history-item">
                    <div className="history-time">{formatDate(login.timestamp)}</div>
                    <div className="history-details">
                      <span className={`status ${login.success ? 'success' : 'failed'}`}>
                        {login.success ? '✅' : '❌'}
                      </span>
                      <span>Login {login.success ? 'Successful' : 'Failed'}</span>
                      <span className="ip-address">{login.ipAddress || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && history && (
          <div className="tab-content">
            <div className="info-section">
              <h4>Recent Admin Activity</h4>
              <div className="history-list">
                {history.activityHistory.slice(-15).map((activity, index) => (
                  <div key={index} className="history-item">
                    <div className="history-time">{formatDate(activity.timestamp)}</div>
                    <div className="history-details">
                      <span className="action">{activity.action}</span>
                      <span className="details">{activity.details}</span>
                      <span className="page">{activity.page}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {history && (
              <div className="info-section">
                <h4>Account Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-item">
                    <label>Total Sessions:</label>
                    <span>{history.totalSessions}</span>
                  </div>
                  <div className="stat-item">
                    <label>Last Login:</label>
                    <span>{formatDate(history.lastLogin)}</span>
                  </div>
                  <div className="stat-item">
                    <label>Admin Actions:</label>
                    <span>{history.activityHistory.filter(a => a.action.includes('admin')).length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSessionHistory;
