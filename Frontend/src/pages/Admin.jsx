import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../utils/auth";
import Header from "../components/Header";
import "./Admin.css";

const Admin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.success) {
        if (response.user && response.user.role === 'admin') {
          // Admin users should only access admin dashboard
          navigate("/admin-dashboard");
        } else {
          // Non-admin users should not be able to access admin login
          setError("Access denied. Admin credentials required.");
        }
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <Header />

      <main className="admin-main">
        <div className="admin-hero-icon">👤</div>
        <h1 className="admin-title">
          Admin Access <span className="chip">Restricted</span>
        </h1>
        <p className="admin-subtitle">
          Administrative portal for case management and oversight
        </p>

        <section className="admin-card">
          <div className="admin-card-header">
            <span className="shield">🛡️</span>
            <h2>Secure Login</h2>
          </div>
          <p className="helper">Enter your administrative credentials</p>

          <div className="notice">
            <div className="notice-icon">⚠️</div>
            <div className="notice-text">
              <div className="notice-title">Authorized Personnel Only</div>
              <p>
                This area is restricted to authorized administrators. All access
                attempts are logged and monitored.
              </p>
            </div>
          </div>

          {error && (
            <div className="error-message" style={{ 
              color: '#ef4444', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form className="admin-form" onSubmit={handleSubmit}>
            <label className="field">
              <span className="label">Administrator Email</span>
              <div className="input-wrap">
                <span className="prefix">✉️</span>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@gmail.com" 
                  required
                />
              </div>
            </label>

            <label className="field">
              <span className="label">Administrative Password</span>
              <div className="input-wrap">
                <span className="prefix">🔒</span>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter admin password" 
                  required
                />
                <span className="suffix" aria-hidden="true">👁️</span>
              </div>
            </label>

            <div className="meta-row">
              <a className="link" href="#">Reset admin password?</a>
            </div>

            <button type="submit" className="admin-submit" disabled={loading}>
              {loading ? "Authenticating..." : "Access Admin Portal"}
            </button>

            <div className="back-row">
              <a className="link" href="/login">← Back to User Login</a>
            </div>
          </form>
        </section>

        <p className="audit-note">
          🔐 All admin activities are logged and audited for security compliance
        </p>
      </main>
    </div>
  );
};

export default Admin;


