import React, { useState, useEffect } from 'react';
import { getUser, getUserHistory, getCurrentSession } from '../utils/auth';
import './UserProfile.css';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const currentUser = getUser();
    const currentSession = getCurrentSession();
    const userHistory = currentUser ? getUserHistory(currentUser.id) : null;

    setUser(currentUser);
    setSession(currentSession);
    setHistory(userHistory);
  }, []);

  if (!user) {
    return <div className="user-profile">Please log in to view your profile.</div>;
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
    <div className="user-profile">
      <div className="profile-header">
        <h2>👤 User Profile</h2>
        <div className="user-info">
          <h3>{user.name}</h3>
          <p>{user.email}</p>
          <span className="role-badge">{user.role}</span>
        </div>
      </div>

      <div className="profile-tabs">
        <button 
          className={activeTab === 'profile' ? 'active' : ''}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={activeTab === 'session' ? 'active' : ''}
          onClick={() => setActiveTab('session')}
        >
          Session
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="tab-content">
            <div className="info-section">
              <h4>Personal Information</h4>
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name:</label>
                  <span>{user.name}</span>
                </div>
                <div className="info-item">
                  <label>Email:</label>
                  <span>{user.email}</span>
                </div>
                <div className="info-item">
                  <label>Phone:</label>
                  <span>{user.phone || 'Not provided'}</span>
                </div>
                <div className="info-item">
                  <label>Role:</label>
                  <span className="role-badge">{user.role}</span>
                </div>
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
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'session' && session && (
          <div className="tab-content">
            <div className="info-section">
              <h4>Current Session</h4>
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
                  <span>{getSessionDuration()}</span>
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
                {history.loginHistory.slice(-5).map((login, index) => (
                  <div key={index} className="history-item">
                    <div className="history-time">{formatDate(login.timestamp)}</div>
                    <div className="history-details">
                      <span className={`status ${login.success ? 'success' : 'failed'}`}>
                        {login.success ? '✅' : '❌'}
                      </span>
                      <span>Login {login.success ? 'Successful' : 'Failed'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-section">
              <h4>Recent Activity</h4>
              <div className="history-list">
                {history.activityHistory.slice(-10).map((activity, index) => (
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

export default UserProfile;
