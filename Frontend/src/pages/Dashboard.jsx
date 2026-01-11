import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getUser } from "../utils/auth";
import { userProfilesAPI } from "../utils/userProfilesAPI";
import { formatAmount, formatDate, getStatusColor, getStatusLabel } from "../utils/casesAPI";
import Header from "../components/Header";
import CaseFlowTracker from "../components/CaseFlowTracker";
import { LayoutDashboard, FileText, Search, Plus, RotateCw, CheckCircle, Clock } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cases, setCases] = useState([]);
  const [stats, setStats] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [previousCases, setPreviousCases] = useState([]);
  const [showPreviousCases, setShowPreviousCases] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [flowStarted, setFlowStarted] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const dashboardResponse = await userProfilesAPI.getDashboardFresh();
        
        if (dashboardResponse.success) {
          const { user: userData, recentCases, statistics } = dashboardResponse.dashboard;
          setUser(userData);
          setCases(recentCases || []);
          setStats(statistics || null);
          
          try {
            const myCasesResponse = await userProfilesAPI.getMyCases();
            if (myCasesResponse.success) {
              setPreviousCases(myCasesResponse.cases || []);
            }
          } catch (error) {
            console.log('Error loading my cases:', error.message);
          }
        }
        
        if (location.state?.message) {
          setSuccessMessage(location.state.message);
          setTimeout(() => setSuccessMessage(null), 5000);
        }

        if (location.state?.flowStarted && location.state?.caseId) {
          setFlowStarted(true);
          setSelectedCaseId(location.state.caseId);
        }
        
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        setUser(getUser());
      }
    };

    loadDashboardData();
  }, [location.state]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header loggedIn={true} username={user?.name || user?.username} />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {successMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700 shadow-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span className="font-medium">{successMessage}</span>
            {location.state?.caseId && (
              <span className="ml-auto rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800">
                Case ID: {location.state.caseId}
              </span>
            )}
          </div>
        )}
        
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, <span className="text-indigo-600">{user?.name || 'User'}</span>
          </h1>
          <p className="mt-2 text-lg text-slate-600">
            Manage your scam reports and track case progress from your dashboard.
          </p>
        </section>

        {/* Stats Grid */}
        <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Cases', value: stats?.totalCases || 0, icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-100' },
            { label: 'Total Amount', value: formatAmount(stats?.totalAmount || 0), icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' },
            { label: 'Active Cases', value: stats?.activeCases || 0, icon: Search, color: 'text-amber-600', bg: 'bg-amber-100' },
            { label: 'Resolved Cases', value: (stats?.statusBreakdown?.resolved || 0) + (stats?.statusBreakdown?.closed || 0), icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
          ].map((stat, index) => (
            <div key={index} className="relative overflow-hidden rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Action Cards */}
        <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-indigo-200">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Plus className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Register New Case</h3>
            <p className="mb-6 text-sm text-slate-500">Report a new scam incident with our guided step-by-step process</p>
            <button 
              onClick={() => navigate('/register-case')}
              className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500"
            >
              Start Report
            </button>
          </div>

          <div className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-emerald-200">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <Search className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Case Status</h3>
            <p className="mb-6 text-sm text-slate-500">Track the progress of your reported cases and view updates</p>
            <button 
              onClick={() => navigate('/case-status')}
              className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500"
            >
              Check Status
            </button>
          </div>

          <div className="group rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:shadow-md hover:ring-slate-300">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50 text-slate-600 group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <RotateCw className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-slate-900">Previous Cases</h3>
            <p className="mb-6 text-sm text-slate-500">View your complete case history and download reports</p>
            <button 
              onClick={() => navigate('/case-history')}
              className="flex w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              View History
            </button>
          </div>
        </section>

        {/* Previous Cases List */}
        {previousCases.length > 0 && (
          <section className="mb-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Previous Cases Found</h2>
                <p className="text-sm text-slate-500">Cases linked to your Aadhaar/PAN number</p>
              </div>
              <button 
                onClick={() => setShowPreviousCases(!showPreviousCases)}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                {showPreviousCases ? 'Hide' : 'Show'} ({previousCases.length})
              </button>
            </div>
            
            {showPreviousCases && (
              <div className="space-y-4">
                {previousCases.map((caseItem) => (
                  <div key={caseItem.id} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{caseItem.caseType}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>ID: {caseItem.caseId}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span>{formatDate(caseItem.createdAt)}</span>
                          <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                          <span className="font-medium text-slate-700">{formatAmount(caseItem.amount)}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      caseItem.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                      caseItem.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {getStatusLabel(caseItem.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Case Flow Tracker */}
        {flowStarted && selectedCaseId && (
          <section className="mb-10">
            <CaseFlowTracker 
              caseId={selectedCaseId} 
              onStatusUpdate={(caseData) => {
                setCases(prevCases => prevCases.map(c => c.id === selectedCaseId ? { ...c, status: caseData.status } : c));
              }}
            />
          </section>
        )}

        {/* Recent Cases */}
        <section className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Recent Cases</h2>
              <p className="text-sm text-slate-500">Your latest case submissions</p>
            </div>
            <button 
              onClick={() => navigate('/case-history')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {cases.length > 0 ? (
              cases.slice(0, 3).map((caseItem) => (
                <div 
                  key={caseItem.id} 
                  onClick={() => navigate('/case-status', { state: { caseId: caseItem.id } })}
                  className="flex cursor-pointer items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{caseItem.caseType?.replace(/_/g, ' ') || 'Fraud Case'}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{caseItem.caseId}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span>{formatDate(caseItem.createdAt)}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span className="font-medium text-emerald-600">{formatAmount(caseItem.amount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    caseItem.status === 'resolved' ? 'bg-green-100 text-green-700' :
                    caseItem.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {getStatusLabel(caseItem.status)}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 rounded-full bg-slate-100 p-3">
                  <LayoutDashboard className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-medium text-slate-900">No cases yet</h3>
                <p className="mt-1 text-sm text-slate-500">Click "Register New Case" to get started.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
