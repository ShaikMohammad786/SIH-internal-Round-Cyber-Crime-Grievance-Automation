import React, { useState, useEffect, useRef } from 'react';
import { getUser } from '../utils/auth';
import './ProfilePopup.css';

const ProfilePopup = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const popupRef = useRef(null);

  useEffect(() => {
    const currentUser = getUser();
    setUser(currentUser);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return (
    <div className="profile-popup-overlay">
      <div className="profile-popup" ref={popupRef}>
        <div className="profile-popup-header">
          <h3>👤 User Profile</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="profile-popup-content">
          <div className="user-info-section">
            <div className="user-avatar">
              <span>👤</span>
            </div>
            <div className="user-details">
              <h4>{user.name}</h4>
              <p>{user.email}</p>
              <span className="role-badge">{user.role}</span>
            </div>
          </div>

          <div className="profile-info-section">
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
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;

