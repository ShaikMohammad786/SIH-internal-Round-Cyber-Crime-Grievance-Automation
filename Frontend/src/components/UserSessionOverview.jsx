import React, { useState, useEffect } from 'react';
import { getUser, getCurrentSession, getUserHistory } from '../utils/auth';
import './UserSessionOverview.css';

const UserSessionOverview = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const currentUser = getUser();
    const currentSession = getCurrentSession();
    const userHistory = currentUser ? getUserHistory(currentUser.id) : null;

    setUser(currentUser);
    setSession(currentSession);
    setHistory(userHistory);
  }, []);

  if (!user) {
    return <div className="user-session-overview">Please log in to view session overview.</div>;
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

  // Mock data for demonstration - in real app, this would come from API
  const allUserSessions = [
    {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      userRole: user.role,
      sessions: history ? history.loginHistory : [],
      currentSession: session
    }
  ];

  const getStatusColor = (success) => {
    return success ? '#059669' : '#dc2626';
  };

  const getRoleColor = (role) => {
    const roleColors = {
      admin: '#dc2626',
      police: '#7c3aed',
      user: '#3b82f6'
    };
    return roleColors[role] || '#6b7280';
  };

  return (
    <div className="user-session-overview">
      <div className="session-header">
        <h2>🔐 Session Overview</h2>
        <div className="user-info">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <span className="role-badge" style={{ backgroundColor: getRoleColor(user.role) }}>
            {user.role}
          </span>
        </div>
      </div>

      <div className="session-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'current' ? 'active' : ''}
          onClick={() => setActiveTab('current')}
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
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="overview-grid">
              <div className="overview-card">
                <div className="card-header">
                  <h4>Current Session</h4>
                  <span className="status-indicator active">Active</span>
                </div>
                <div className="card-content">
                  <div className="session-info">
                    <span className="label">Duration:</span>
                    <span className="value">{getSessionDuration()}</span>
                  </div>
                  <div className="session-info">
                    <span className="label">Login Time:</span>
                    <span className="value">{session ? formatDate(session.loginTime) : 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <h4>Account Statistics</h4>
                </div>
                <div className="card-content">
                  <div className="stat-item">
                    <span className="stat-label">Total Sessions:</span>
                    <span className="stat-value">{history?.totalSessions || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Last Login:</span>
                    <span className="stat-value">{history ? formatDate(history.lastLogin) : 'N/A'}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Successful Logins:</span>
                    <span className="stat-value">
                      {history?.loginHistory?.filter(login => login.success).length || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <h4>Recent Activity</h4>
                </div>
                <div className="card-content">
                  <div className="activity-list">
                    {history?.activityHistory?.slice(-5).map((activity, index) => (
                      <div key={index} className="activity-item">
                        <span className="activity-time">{formatDate(activity.timestamp)}</span>
                        <span className="activity-action">{activity.action}</span>
                      </div>
                    )) || <p>No recent activity</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'current' && session && (
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
                <div className="info-item">
                  <label>IP Address:</label>
                  <span className="ip-address">{session.ipAddress || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>User Agent:</label>
                  <span className="user-agent">{session.userAgent || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && history && (
          <div className="tab-content">
            <div className="info-section">
              <h4>Login History</h4>
              <div className="history-list">
                {history.loginHistory.slice(-15).map((login, index) => (
                  <div key={index} className="history-item">
                    <div className="history-time">{formatDate(login.timestamp)}</div>
                    <div className="history-details">
                      <span 
                        className="status" 
                        style={{ color: getStatusColor(login.success) }}
                      >
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
              <h4>Activity Log</h4>
              <div className="history-list">
                {history.activityHistory.slice(-20).map((activity, index) => (
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
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSessionOverview;
