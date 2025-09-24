import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { isAuthenticated, getUser } from "../utils/auth";
import "./Home.css"; // create for custom styling if needed

const Home = () => {
  const navigate = useNavigate();

  const handleReportCase = () => {
    if (isAuthenticated()) {
      // User is logged in, check their role and redirect accordingly
      const user = getUser();
      if (user && user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        // Regular user - go to register case form
        navigate('/register-case');
      }
    } else {
      // User not logged in - go to login page
      navigate('/login');
    }
  };

  return (
    <div className="home-container">
      <Header />
      {/* Hero Section */}
      <div className="bg">
      <section className="hero">

        <div className="hero-content">
          <h1>Report Scams. <br /> Protect Others.</h1>
          <p>
            Join our secure platform to report fraud incidents, track case progress,
            and help authorities take swift action against scammers.
          </p>
      <div className="hero-buttons">
        <button className="primary-btn" onClick={handleReportCase}>Report a Case →</button>
        {/* <button className="secondary-btn" onClick={() => navigate('/test-flow')}>🚀 See Live Demo</button> */}
        {/* <button className="debug-btn" onClick={() => navigate('/debug-test')}>🔍 Debug Test</button> */}
      </div>
      
      <div className="portal-links">
        {/* <h3>🔧 Management Portals</h3> */}
        <div className="portal-buttons">
          {/* <button className="admin-btn" onClick={() => navigate('/admin-flow')}> */}
            {/* 👨‍💼 Admin Portal */}
          {/* </button> */}
          {/* <button className="police-btn" onClick={() => navigate('/police-flow')}> */}
            {/* 👮 Police Portal */}
          {/* </button> */}
        </div>
      </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stat-box">
          <h2>1,247</h2>
          <p>Cases Reported</p>
        </div>
        <div className="stat-box">
          <h2>89%</h2>
          <p>Resolution Rate</p>
        </div>
        <div className="stat-box">
          <h2>24hr</h2>
          <p>Average Response</p>
        </div>
        <div className="stat-box">
          <h2>₹2.4Cr</h2>
          <p>Fraud Prevented</p>
        </div>
      </section>

      {/* How it Works */}
<section className="how-it-works" id="how">
  <h2 className="how-title">How Scam Reporter Works</h2>
  <p className="how-subtitle">
    Our platform provides a secure, streamlined process to report fraud and
    coordinate with authorities for swift action.
  </p>

  <div className="how-cards">
    <article className="how-card">
      <div className="how-icon">
        {/* document icon */}
        <svg viewBox="0 0 24 24" fill="none" width="28" height="28" aria-hidden="true">
          <path d="M8 3h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" stroke="#2A66FF" strokeWidth="1.8"/>
          <path d="M14 3v4h4" stroke="#2A66FF" strokeWidth="1.8"/>
          <path d="M9 12h6M9 16h6" stroke="#2A66FF" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="how-card-title">Report Incidents</h3>
      <p className="how-card-text">
        Securely document scam details with our guided reporting system.
      </p>
    </article>

    <article className="how-card">
      <div className="how-icon">
        {/* search icon */}
        <svg viewBox="0 0 24 24" fill="none" width="28" height="28" aria-hidden="true">
          <circle cx="11" cy="11" r="6" stroke="#2A66FF" strokeWidth="1.8"/>
          <path d="M20 20l-3.5-3.5" stroke="#2A66FF" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="how-card-title">Track Progress</h3>
      <p className="how-card-text">
        Monitor your case status through our transparent timeline system.
      </p>
    </article>

    <article className="how-card">
      <div className="how-icon">
        {/* people icon */}
        <svg viewBox="0 0 24 24" fill="none" width="28" height="28" aria-hidden="true">
          <circle cx="8" cy="8" r="3" stroke="#2A66FF" strokeWidth="1.8"/>
          <circle cx="16" cy="10" r="3" stroke="#2A66FF" strokeWidth="1.8"/>
          <path d="M4.5 18a4 4 0 0 1 7 0M12 18a4 4 0 0 1 7 0" stroke="#2A66FF" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="how-card-title">Authority Coordination</h3>
      <p className="how-card-text">
        Automatically generate reports for police, banks, and telecom authorities.
      </p>
    </article>
  </div>
</section>


      {/* Call to Action */}
      <section className="cta">
        <h2>Been Scammed? Don't Wait.</h2>
        <p>
          Time is critical in fraud cases. Report your incident now and let us help
          you coordinate with the right authorities for maximum recovery chances.
        </p>
        <button className="primary-btn" onClick={handleReportCase}>Start Your Report →</button>
      </section>
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Scam Reporter. Protecting communities from fraud.</p>
      </footer>
    </div>
  );
};

export default Home;
