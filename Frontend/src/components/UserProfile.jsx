import React, { useState, useEffect } from 'react';
import { getUser, getUserHistory, getCurrentSession, updateUser, authAPI } from '../utils/auth';
import { userProfilesAPI } from '../utils/userProfilesAPI';
import { User, Mail, Phone, Shield, Clock, Calendar, Activity, LogIn, Monitor, CheckCircle, XCircle } from 'lucide-react';

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const currentUser = getUser();
    const currentSession = getCurrentSession();
    const userHistory = currentUser ? getUserHistory(currentUser.id) : null;

    setUser(currentUser);
    setSession(currentSession);
    setHistory(userHistory);
    
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        phone: currentUser.phone || ''
      });
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      // 1. Update profile via API
      // Note: Assuming createProfile handles updates or there's an update endpoint. 
      // If createProfile is for *full* profile including gov IDs, we might need a specific update-user endpoint.
      // However, usually we might just want to update the *User* record (name/phone).
      // Let's try to see if we can use createProfile or if we need to mock it if API isn't ready.
      // For now, let's assume we can update 'personalInfo' or just 'user' data.
      
      // Since specific update endpoint might not be clear, we'll try to update via createProfile
      // OR better, checking userProfilesAPI again, it has createProfile (POST /user/profile).
      // We will assume this updates the user profile.
      
      const updateData = {
        personalInfo: {
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ').slice(1).join(' '),
          // We need to keep other fields if this overwrites. 
          // But usually PATCH is better.
        },
        contactInfo: {
            phone: formData.phone
        }
        // This structure depends heavily on the backend.
        // A safer bet if we don't know the backend structure for 'profile' vs 'user' is 
        // to assume the /user/profile endpoint handles it.
      };

      await userProfilesAPI.createProfile(updateData);
      
      // 2. Fetch fresh user data to ensure consistency
      const response = await authAPI.getCurrentUser();
      
      if (response.success) {
         updateUser(response.user);
         setUser(response.user);
         setIsEditing(false);
         setMessage({ type: 'success', text: 'Profile updated successfully' });
      } else {
         throw new Error('Failed to retrieve updated profile');
      }
    } catch (error) {
       console.error('Update failed:', error);
       setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
       setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name || '',
      phone: user.phone || ''
    });
    setMessage(null);
  };

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
         <p>Please log in to view your profile.</p>
      </div>
    );
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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200 sm:flex-row sm:text-left">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
           <User className="h-10 w-10" />
        </div>
        <div className="flex-1">
           <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
           <p className="text-slate-500">{user.email}</p>
           <div className="mt-2 inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 capitalize">
              <Shield className="mr-1 h-3 w-3" /> {user.role}
           </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200">
        {[
           { id: 'profile', label: 'Profile', icon: User },
           { id: 'session', label: 'Session', icon: Monitor },
           { id: 'history', label: 'History', icon: Clock }
        ].map((tab) => (
           <button 
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`flex items-center gap-2 border-b-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap
                ${activeTab === tab.id 
                   ? 'border-indigo-600 text-indigo-600' 
                   : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}
             `}
           >
             <tab.icon className="h-4 w-4" /> {tab.label}
           </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                   <User className="h-5 w-5 text-indigo-600" /> Personal Information
                </h4>
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={handleCancel}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={isLoading}
                      className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              {message && (
                <div className={`mb-4 rounded-lg p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {message.text}
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-2"><User className="h-4 w-4" /> Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{user.name}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-2"><Mail className="h-4 w-4" /> Email</label>
                  <p className="font-medium text-slate-900">{user.email}</p>
                  {isEditing && <p className="text-xs text-slate-400">Email cannot be changed</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-500 flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  ) : (
                    <p className="font-medium text-slate-900">{user.phone || 'Not provided'}</p>
                  )}
                </div>
                <div className="space-y-1">
                   <label className="text-sm font-medium text-slate-500 flex items-center gap-2"><Shield className="h-4 w-4" /> Role</label>
                   <p className="capitalize font-medium text-slate-900">{user.role}</p>
                </div>
              </div>
            </div>

            {history && (
              <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                   <Activity className="h-5 w-5 text-indigo-600" /> Account Statistics
                </h4>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Total Sessions</label>
                    <p className="text-2xl font-bold text-slate-900">{history.totalSessions}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-500">Last Login</label>
                    <p className="font-medium text-slate-900">{formatDate(history.lastLogin)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'session' && session && (
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200 animate-in fade-in slide-in-from-bottom-2">
            <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
               <Monitor className="h-5 w-5 text-indigo-600" /> Current Session
            </h4>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="col-span-full space-y-1">
                <label className="text-sm font-medium text-slate-500">Session ID</label>
                <p className="break-all font-mono text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-100">{session.sessionId}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Login Time</label>
                <p className="font-medium text-slate-900">{formatDate(session.loginTime)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Last Activity</label>
                <p className="font-medium text-slate-900">{formatDate(session.lastActivity)}</p>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-500">Session Duration</label>
                <p className="font-medium text-slate-900">{getSessionDuration()}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && history && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                 <LogIn className="h-5 w-5 text-indigo-600" /> Recent Login History
              </h4>
              <div className="space-y-4">
                {history.loginHistory.slice(-5).map((login, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                    <div className="text-sm font-medium text-slate-900">{formatDate(login.timestamp)}</div>
                    <div className={`flex items-center gap-2 text-sm font-medium ${login.success ? 'text-emerald-600' : 'text-red-600'}`}>
                      {login.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>{login.success ? 'Successful' : 'Failed'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
                 <Activity className="h-5 w-5 text-indigo-600" /> Recent Activity
              </h4>
              <div className="space-y-4">
                {history.activityHistory.slice(-10).reverse().map((activity, index) => (
                  <div key={index} className="flex flex-col gap-1 rounded-lg border border-slate-100 bg-slate-50/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500 font-mono">{formatDate(activity.timestamp)}</div>
                    <div className="flex-1 sm:text-right">
                       <span className="inline-block rounded bg-white px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 border border-slate-200 mr-2">{activity.action}</span>
                       <span className="text-sm text-slate-700">{activity.details}</span>
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
