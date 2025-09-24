import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/auth';
import './PoliceLogin.css';

const PoliceLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(null, formData.password, formData.username);
      
      if (response.success) {
        // Check if user is police
        if (response.user.role === 'police') {
          // Store user data
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Redirect to police portal
          navigate('/police-portal');
        } else {
          setError('Access denied. Police login required.');
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (credentials) => {
    setFormData({
      username: credentials.username,
      password: credentials.password
    });
  };

  return (
    <div className="police-login">
      <div className="login-container">
        <div className="login-header">
          <div className="police-badge">
            <span className="badge-icon">👮</span>
            <span className="badge-text">POLICE LOGIN</span>
          </div>
          <h1>Police Portal Access</h1>
          <p>Sign in to access the police case management system</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username or email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Signing In...
              </>
            ) : (
              <>
                <span className="login-icon">🔐</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="demo-credentials">
          <h3>Demo Police Credentials</h3>
          <div className="credential-cards">
            <div 
              className="credential-card"
              onClick={() => handleDemoLogin({ username: 'inspector_rajesh', password: 'police123' })}
            >
              <div className="rank-badge">Inspector</div>
              <h4>Rajesh Kumar</h4>
              <p>Badge: POL001</p>
              <span className="click-hint">Click to auto-fill</span>
            </div>
            
            <div 
              className="credential-card"
              onClick={() => handleDemoLogin({ username: 'si_priya', password: 'police123' })}
            >
              <div className="rank-badge">Sub Inspector</div>
              <h4>Priya Sharma</h4>
              <p>Badge: POL002</p>
              <span className="click-hint">Click to auto-fill</span>
            </div>
            
            <div 
              className="credential-card"
              onClick={() => handleDemoLogin({ username: 'asi_amit', password: 'police123' })}
            >
              <div className="rank-badge">ASI</div>
              <h4>Amit Singh</h4>
              <p>Badge: POL003</p>
              <span className="click-hint">Click to auto-fill</span>
            </div>
          </div>
        </div>

        <div className="login-footer">
          <p>Need help? Contact IT Support</p>
          <a href="/" className="back-link">← Back to Main Site</a>
        </div>
      </div>
    </div>
  );
};

export default PoliceLogin;
