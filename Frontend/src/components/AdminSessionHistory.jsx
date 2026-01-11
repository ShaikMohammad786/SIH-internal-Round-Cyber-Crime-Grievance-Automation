import React, { useState, useEffect } from 'react';
import { getUser, getUserHistory, getCurrentSession } from '../utils/auth';
import { 
  ShieldCheck, Clock, Activity, LogIn, Monitor, 
  CheckCircle, XCircle, Calendar, Hash, User
} from 'lucide-react';

const AdminSessionHistory = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('session');

  useEffect(() => {
    const currentUser = getUser();
    const currentSession = getCurrentSession();
    const userHistory = currentUser ? getUserHistory(currentUser.id) : null;

    setUser(currentUser);
    setSession(currentSession);
    setHistory(userHistory);
  }, []);

  if (!user) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm">
        Please log in to view session history.
      </div>
    );
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  const getSessionDuration = () => {
    if (!session) return 'Unknown';
    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const diffMs = now - loginTime;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}h ${diffMinutes}m`;
  };

  const tabs = [
    { id: 'session', label: 'Current Session', icon: Monitor },
    { id: 'history', label: 'Login History', icon: Clock },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header Card */}
      <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Admin Session & History</h2>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>{user.name}</span>
                <span>•</span>
                <span>{user.email}</span>
              </div>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
            {user.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'}
                `}
              >
                <Icon className={`-ml-0.5 mr-2 h-4 w-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">
        {activeTab === 'session' && session && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <h3 className="text-base font-semibold leading-7 text-slate-900 mb-4">Current Session Details</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-1 border-l-2 border-indigo-500 pl-4">
                  <dt className="text-sm font-medium text-slate-500">Session ID</dt>
                  <dd className="mt-1 text-sm text-slate-900 font-mono bg-slate-50 rounded px-2 py-0.5 inline-block">{session.sessionId}</dd>
                </div>
                <div className="sm:col-span-1 border-l-2 border-green-500 pl-4">
                  <dt className="text-sm font-medium text-slate-500">Login Time</dt>
                  <dd className="mt-1 text-sm text-slate-900">{formatDate(session.loginTime)}</dd>
                </div>
                <div className="sm:col-span-1 border-l-2 border-blue-500 pl-4">
                  <dt className="text-sm font-medium text-slate-500">Last Activity</dt>
                  <dd className="mt-1 text-sm text-slate-900">{formatDate(session.lastActivity)}</dd>
                </div>
                <div className="sm:col-span-1 border-l-2 border-amber-500 pl-4">
                  <dt className="text-sm font-medium text-slate-500">Duration</dt>
                  <dd className="mt-1 text-sm font-bold text-slate-900">{getSessionDuration()}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'history' && history && (
          <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">Recent Login History</h3>
            </div>
            <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
              {history.loginHistory.slice(-10).reverse().map((login, index) => (
                <div key={index} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {login.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {login.success ? 'Login Successful' : 'Login Failed'}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(login.timestamp)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 font-mono ring-1 ring-inset ring-slate-500/10">
                      {login.ipAddress || 'Unknown IP'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'activity' && history && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <dt className="truncate text-sm font-medium text-slate-500">Total Sessions</dt>
                <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{history.totalSessions}</dd>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <dt className="truncate text-sm font-medium text-slate-500">Last Login</dt>
                <dd className="mt-2 text-sm font-semibold tracking-tight text-slate-900">{formatDate(history.lastLogin)}</dd>
              </div>
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <dt className="truncate text-sm font-medium text-slate-500">Admin Actions</dt>
                <dd className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{history.activityHistory.filter(a => a.action.includes('admin')).length}</dd>
              </div>
            </div>

            {/* Log */}
            <div className="rounded-xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
                <h3 className="text-base font-semibold text-slate-900">Recent Activity Log</h3>
              </div>
              <div className="divide-y divide-slate-200 max-h-[500px] overflow-y-auto">
                {history.activityHistory.slice(-15).reverse().map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-indigo-700 uppercase tracking-wide text-[10px] bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{activity.action}</span>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{activity.page}</span>
                        </div>
                        <p className="text-sm text-slate-700">{activity.details}</p>
                      </div>
                      <time className="text-xs text-slate-400 whitespace-nowrap">{formatDate(activity.timestamp)}</time>
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

export default AdminSessionHistory;
