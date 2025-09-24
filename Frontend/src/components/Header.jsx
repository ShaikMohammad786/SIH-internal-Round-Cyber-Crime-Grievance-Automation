// src/components/Header.jsx
import { Link, useNavigate } from "react-router-dom";
import { authAPI, getUser } from "../utils/auth";
import ProfilePopup from "./ProfilePopup";
import { useState } from "react";
import "./Header.css";

export default function Header({ loggedIn = false, username = "" }) {
  const navigate = useNavigate();
  const user = getUser();
  const isLoggedIn = loggedIn || !!user;
  const displayName = user?.name || user?.username || username || "";
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  const handleProfileClick = () => {
    setShowProfilePopup(true);
  };

  return (
    <header className="navbar">
      <div className="logo" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
        <span  >🛡️ Scam Reporter</span>
        <small>Protect Your Community</small>
      </div>
      <div className="nav-buttons">
        {isLoggedIn ? (
          <>
            <span className="welcome-text">Welcome, {displayName}</span>
            <button className="profile-icon-btn" onClick={handleProfileClick} title="View Profile">
              👤
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
           
            {user?.role === 'police' && (
              <Link to="/police-portal" className="police-btn-link">
                <button className="police-btn">👮 Police Portal</button>
              </Link>
            )}
          </>
        ) : (
          <>
            <button className="login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
            <Link to="/admin" className="admin-btn-link">
              <button className="admin-btn">Admin Access</button>
            </Link>
            <Link to="/police-login" className="police-btn-link">
              <button className="police-btn">👮 Police Portal</button>
            </Link>
          </>
        )}
      </div>
      
      {isLoggedIn && (
        <ProfilePopup 
          isOpen={showProfilePopup} 
          onClose={() => setShowProfilePopup(false)} 
        />
      )}
    </header>
  );
}
