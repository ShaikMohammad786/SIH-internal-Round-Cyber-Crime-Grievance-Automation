import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getUser } from '../utils/auth';
import { X, User, Mail, Phone, Shield } from 'lucide-react';

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
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
      <div 
        ref={popupRef}
        className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-slate-800">User Profile</h3>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto p-6">
          <div className="flex flex-col items-center pb-6">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-3xl shadow-inner">
              <span role="img" aria-label="user">👤</span>
            </div>
            <h4 className="text-xl font-bold text-slate-900">{user.name}</h4>
            <p className="text-sm text-slate-500">{user.email}</p>
            <span className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
              {user.role}
            </span>
          </div>

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Personal Information</h4>
            
            <div className="grid gap-4">
              <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 shadow-sm hover:border-slate-200 hover:shadow-md transition-shadow bg-white">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Full Name</label>
                  <span className="text-sm font-medium text-slate-700">{user.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 shadow-sm hover:border-slate-200 hover:shadow-md transition-shadow bg-white">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Email</label>
                  <span className="text-sm font-medium text-slate-700">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 shadow-sm hover:border-slate-200 hover:shadow-md transition-shadow bg-white">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50 text-slate-400">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Phone</label>
                  <span className="text-sm font-medium text-slate-700">{user.phone || 'Not provided'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 shadow-sm hover:border-slate-200 hover:shadow-md transition-shadow bg-white">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-slate-50 text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400">Role</label>
                  <span className="text-sm font-medium capitalize text-slate-700">{user.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfilePopup;
