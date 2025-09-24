import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../utils/auth";
import Header from "../components/Header";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
        // Session is automatically created by authAPI.login
        // Check user role and redirect accordingly
        if (response.user && response.user.role === 'admin') {
          // Admin users should only access admin dashboard
          navigate("/admin-dashboard");
        } else {
          // Regular users go to user dashboard
          navigate("/dashboard");
        }
      } else {
        setError(response.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <Header />

      <main className="login-main">
        <div className="login-card">
          <h1 className="title">Welcome Back</h1>
          <p className="subtitle">Sign in to access your scam reporting dashboard</p>

          <div className="card-inner">
            <h2 className="card-title">Sign In</h2>

            <div className="oauth-row">
              {/* <button className="oauth google">
                <span>G</span>
                <span>Google</span>
              </button> */}
             
            </div>

            {/* <div className="divider"><span>OR CONTINUE WITH</span></div> */}

            <form className="form" onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              <label className="field">
                <span className="label">Email Address</span>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </label>
              <label className="field">
                <span className="label">Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </label>

              <div className="meta-row">
                <a className="link" href="#">Forgot password?</a>
              </div>

              <button type="submit" className="submit" disabled={loading}>
                {loading ? "Signing In..." : "Sign In"}
              </button>

              <p className="signup">
                Don't have an account? <a className="link" href="#" onClick={() => navigate('/register')}>Sign up</a>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;


