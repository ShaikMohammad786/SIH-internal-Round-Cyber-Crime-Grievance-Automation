import React, { useState, useEffect } from 'react';
import { getUser, getCurrentSession, getUserHistory } from '../utils/auth';
import { Clock, Calendar, Activity, Shield, User, Globe, Laptop, CheckCircle, XCircle } from 'lucide-react';

const UserSessionOverview = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
       <div className="flex h-64 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500">
          Please log in to view session overview.
       </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
       dateStyle: 'medium',
       timeStyle: 'short'
    });
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

  const tabs = [
     { id: 'overview', label: 'Overview' },
     { id: 'current', label: 'Current Session' },
     { id: 'history', label: 'Login History' },
     { id: 'activity', label: 'Activity Log' }
  ];

  return (
    <div className="mx-auto max-w-5xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <div className="mb-8 border-b border-slate-100 pb-6 text-center">
        <h2 className="mb-4 flex items-center justify-center gap-2 text-2xl font-bold text-slate-900">
           <Shield className="h-6 w-6 text-indigo-600" /> Session Overview
        </h2>
        <div className="flex flex-col items-center">
          <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-2xl shadow-inner">
             👤
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
          <p className="text-sm text-slate-500">{user.email}</p>
          <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide
             ${user.role === 'admin' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' : ''}
             ${user.role === 'police' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/10' : ''}
             ${user.role === 'user' ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10' : ''}
          `}>
            {user.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex overflow-x-auto rounded-lg bg-slate-50 p-1 sm:justify-center">
         {tabs.map(tab => (
            <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={`flex-1 whitespace-nowrap rounded-md px-4 py-2.5 text-sm font-medium transition-all
                  ${activeTab === tab.id 
                     ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                     : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}
               `}
            >
               {tab.label}
            </button>
         ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             {/* Current Session Card */}
             <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                   <h4 className="font-semibold text-slate-900">Current Session</h4>
                   <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                      Active
                   </span>
                </div>
                <div className="space-y-4">
                   <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-sm text-slate-500">Duration</span>
                      <span className="text-sm font-medium text-emerald-600">{getSessionDuration()}</span>
                   </div>
                   <div className="flex justify-between pt-2">
                      <span className="text-sm text-slate-500">Login Time</span>
                      <span className="text-sm font-medium text-slate-900">{session ? formatDate(session.loginTime) : 'N/A'}</span>
                   </div>
                </div>
             </div>

             {/* Account Stats */}
             <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h4 className="mb-4 font-semibold text-slate-900">Account Statistics</h4>
                <div className="space-y-4">
                   <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-sm text-slate-500">Total Sessions</span>
                      <span className="text-sm font-bold text-slate-900">{history?.totalSessions || 0}</span>
                   </div>
                   <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-sm text-slate-500">Successful Logins</span>
                      <span className="text-sm font-bold text-slate-900">{history?.loginHistory?.filter(l => l.success).length || 0}</span>
                   </div>
                   <div className="flex justify-between pt-2">
                      <span className="text-sm text-slate-500">Last Login</span>
                      <span className="text-sm font-medium text-slate-900">{history ? formatDate(history.lastLogin) : 'N/A'}</span>
                   </div>
                </div>
             </div>

             {/* Recent Activity */}
             <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 lg:col-span-1">
                <h4 className="mb-4 font-semibold text-slate-900">Recent Activity</h4>
                <div className="space-y-3">
                   {history?.activityHistory?.slice(-5).map((activity, index) => (
                      <div key={index} className="flex items-start justify-between text-sm">
                         <span className="text-slate-500">{formatDate(activity.timestamp)}</span>
                         <span className="font-medium text-slate-900">{activity.action}</span>
                      </div>
                   ))}
                   {(!history?.activityHistory || history.activityHistory.length === 0) && (
                      <p className="text-sm text-slate-500 italic">No recent activity recorded.</p>
                   )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'current' && session && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
             <h4 className="mb-6 text-lg font-semibold text-slate-900 text-center">Session Details</h4>
             <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                   <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-indigo-600 shadow-sm"><Globe className="h-5 w-5" /></div>
                      <span className="text-sm font-medium text-slate-900">IP Address</span>
                   </div>
                   <span className="font-mono text-sm text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">{session.ipAddress || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                   <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-indigo-600 shadow-sm"><Laptop className="h-5 w-5" /></div>
                      <span className="text-sm font-medium text-slate-900">Device</span>
                   </div>
                   <span className="max-w-[150px] truncate text-sm text-slate-600" title={session.userAgent || 'Unknown'}>
                      {session.userAgent || 'Unknown'}
                   </span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                   <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-emerald-600 shadow-sm"><Clock className="h-5 w-5" /></div>
                      <span className="text-sm font-medium text-slate-900">Duration</span>
                   </div>
                   <span className="text-sm font-bold text-emerald-600">{getSessionDuration()}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                   <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-white p-2 text-indigo-600 shadow-sm"><Calendar className="h-5 w-5" /></div>
                      <span className="text-sm font-medium text-slate-900">Last Active</span>
                   </div>
                   <span className="text-sm text-slate-600">{formatDate(session.lastActivity)}</span>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'history' && history && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                   <thead className="bg-slate-50">
                      <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Time</th>
                         <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
                         <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">IP Address</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200 bg-white">
                      {history.loginHistory.slice(-15).map((login, index) => (
                         <tr key={index} className="hover:bg-slate-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{formatDate(login.timestamp)}</td>
                            <td className="whitespace-nowrap px-6 py-4">
                               <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${login.success ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'}`}>
                                  {login.success ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                  {login.success ? 'Success' : 'Failed'}
                               </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-mono text-slate-600">{login.ipAddress || 'N/A'}</td>
                         </tr>
                      ))}
                      {history.loginHistory.length === 0 && (
                         <tr><td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-500">No login history available.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'activity' && history && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                   <thead className="bg-slate-50">
                      <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Time</th>
                         <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Action</th>
                         <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Page</th>
                         <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Details</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-200 bg-white">
                      {history.activityHistory.slice(-20).map((activity, index) => (
                         <tr key={index} className="hover:bg-slate-50">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">{formatDate(activity.timestamp)}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{activity.action}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                               <span className="rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{activity.page}</span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 italic">{activity.details || '-'}</td>
                         </tr>
                      ))}
                      {history.activityHistory.length === 0 && (
                         <tr><td colSpan="4" className="px-6 py-8 text-center text-sm text-slate-500">No activity logs found.</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSessionOverview;
