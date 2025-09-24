import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../utils/auth";
import Header from "../components/Header";
import "./Register.css";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: ""
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

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      if (response.success) {
        // Session is automatically created by authAPI.register
        navigate("/");
      } else {
        setError(response.message || "Registration failed");
      }
    } catch (error) {
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <Header />

      <main className="login-main">
        <div className="login-card">
          <h1 className="title">Join Scam Reporter</h1>
          <p className="subtitle">Create an account to report scams and protect your community</p>

          <div className="card-inner">
            <h2 className="card-title">Sign Up</h2>

            {error && <div className="error-message">{error}</div>}

            <form className="form" onSubmit={handleSubmit}>
              <label className="field">
                <span className="label">Full Name</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </label>
              
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
                <span className="label">Phone Number</span>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
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
              
              <label className="field">
                <span className="label">Confirm Password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </label>

              <button type="submit" className="submit" disabled={loading}>
                {loading ? "Creating Account..." : "Sign Up"}
              </button>

              <p className="signup">
                Already have an account? <a className="link" href="#" onClick={() => navigate('/login')}>Sign in</a>
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;