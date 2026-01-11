import React, { useEffect, useState } from "react";
import { getUser } from "../utils/auth";
import { userProfilesAPI } from "../utils/userProfilesAPI";
import { caseFlowAPI } from "../utils/caseFlowAPI";
import Header from "../components/Header";
import CaseDetailsModal from "../components/CaseDetailsModal";
import AdminSessionHistory from "../components/AdminSessionHistory";
import { 
  ShieldAlert, RefreshCcw, Users, Clock, CheckCircle, 
  Lock, Search, Eye, UserPlus, AlertTriangle, FileText,
  Loader2, Shield, Activity, Download
} from "lucide-react";

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState("pending");
  const [cases, setCases] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [policeOfficers, setPoliceOfficers] = useState([]);
  const [showSessionHistory, setShowSessionHistory] = useState(false);

  useEffect(() => {
    loadDashboardData(true);
    loadPoliceOfficers();
    const interval = setInterval(() => loadDashboardData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async (isInitial = true) => {
    try {
      if (isInitial) setLoading(true);
      const response = await userProfilesAPI.getAdminDashboard();
      if (response.success && response.stats) {
        setDashboardData(response.stats.overview);
        setCases(response.stats.recentCases || []);
        setLastUpdated(new Date());
      } else {
        setError(response.message || "Failed to load dashboard data");
      }
    } catch (error) {
      setError("Failed to load dashboard data. Please check your connection.");
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { label: "Submitted", color: "bg-slate-100 text-slate-700", icon: Clock },
      under_review: { label: "Under Review", color: "bg-amber-100 text-amber-700", icon: Clock },
      verified: { label: "Verified", color: "bg-blue-100 text-blue-700", icon: Shield },
      crpc_generated: { label: "91 CRPC Ready", color: "bg-indigo-100 text-indigo-700", icon: FileText },
      emails_sent: { label: "Notified", color: "bg-purple-100 text-purple-700", icon: Activity },
      authorized: { label: "Authorized", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
      assigned_to_police: { label: "Investigation", color: "bg-orange-100 text-orange-700", icon: Users },
      evidence_collected: { label: "Evidence Ready", color: "bg-cyan-100 text-cyan-700", icon: ShieldAlert },
      resolved: { label: "Solved", color: "bg-green-100 text-green-700", icon: CheckCircle },
      closed: { label: "Closed", color: "bg-slate-100 text-slate-700", icon: Lock }
    };
    return statusMap[status] || { label: status, color: "bg-slate-100 text-slate-700", icon: FileText };
  };

  const getPriorityInfo = (priority) => {
    const priorityMap = {
      high: { label: "High Priority", color: "bg-red-100 text-red-700", icon: AlertTriangle },
      medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      low: { label: "Low", color: "bg-green-100 text-green-700", icon: CheckCircle }
    };
    return priorityMap[priority] || { label: "Medium", color: "bg-yellow-100 text-yellow-700", icon: Clock };
  };

  const formatAmount = (amount) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);
  
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredCases = cases.filter(caseItem => {
    const victimName = caseItem.user?.name || 'Unknown';
    const caseId = caseItem.caseId || '';
    const matchesSearch = caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         victimName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = selectedTab === "pending" ? 
      !['resolved', 'closed'].includes(caseItem.status) : 
      ['resolved', 'closed'].includes(caseItem.status);
    return matchesSearch && matchesTab;
  });

  const pendingCases = cases.filter(caseItem => !['resolved', 'closed'].includes(caseItem.status));
  const solvedCases = cases.filter(caseItem => ['resolved', 'closed'].includes(caseItem.status));

  const handleViewCase = (caseId) => {
    setSelectedCaseId(caseId);
    setShowCaseModal(true);
  };

  const loadPoliceOfficers = async () => {
    try {
      const response = await userProfilesAPI.getPoliceOfficers();
      if (response.success) setPoliceOfficers(response.data);
    } catch (error) {
      console.error('Error loading police officers:', error);
    }
  };

  const handleAssignToPolice = async (policeId, policeName) => {
    try {
      const response = await userProfilesAPI.assignCaseToPolice(selectedCaseId, policeId, policeName);
      if (response.success) {
        alert('Case assigned successfully');
        setShowAssignModal(false);
        loadDashboardData();
      } else {
        alert('Failed: ' + response.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header loggedIn={true} username={getUser()?.name} />
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
          <p className="mt-4 text-sm text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header loggedIn={true} username={getUser()?.name} />
      
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {/* Authority Header */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Authority Dashboard</h1>
              <p className="text-slate-500">Manage and review assigned scam cases</p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="hidden rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 sm:inline-block">
                Cyber Crime Division • Authorized Personnel Access
              </span>
              <div className="flex flex-col items-end gap-1">
                {lastUpdated && (
                  <span className="text-xs text-slate-400">
                    Updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <div className="flex gap-2">

                  <button 
                    onClick={loadDashboardData}
                    className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    <RefreshCcw className="h-3 w-3" />
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {[
            { label: 'Total Cases', value: dashboardData?.totalCases || 0, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Cases Solved', value: dashboardData?.resolvedCases || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Ongoing Cases', value: dashboardData?.activeCases || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map((stat, idx) => (
            <div key={idx} className="flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Case Management */}
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">Case Management</h2>
            <p className="text-sm text-slate-500">Review and manage your assigned cases</p>
          </div>

          <div className="border-b border-slate-200 px-6">
            <div className="flex gap-6">
              {['pending', 'solved'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedTab(tab)}
                  className={`border-b-2 py-4 text-sm font-medium transition-colors ${
                    selectedTab === tab 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)} Cases 
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {tab === 'pending' ? pendingCases.length : solvedCases.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <div className="mb-6 relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search cases by ID or victim..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border-slate-200 pl-10 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 bg-white">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Case ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Victim</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Priority</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCases.map((item, idx) => {
                    const status = getStatusInfo(item.status);
                    const priority = getPriorityInfo(item.priority);
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-slate-900">
                          {item.caseId || `SCR-${String(idx + 1).padStart(3, '0')}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {item.user?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800 capitalize">
                            {item.caseType?.replace(/_/g, ' ') || 'Fraud'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${status.color}`}>
                            <status.icon className="h-3 w-3" />
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${priority.color}`}>
                            <priority.icon className="h-3 w-3" />
                            {priority.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                          {formatAmount(item.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => handleViewCase(item.id || item._id)}
                              className="text-indigo-600 hover:text-indigo-900 p-1 rounded-md hover:bg-indigo-50"
                              title="View Details"
                            >
                              <Eye className="h-5 w-5" />
                            </button>
                            
                            {(item.crpcDocumentId || ['crpc_generated', 'emails_sent', 'authorized'].includes(item.status)) && (
                              <button
                                onClick={() => caseFlowAPI.downloadCRPCDocument(item.crpcDocumentId || item.id || item._id)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded-md hover:bg-blue-50"
                                title="Download 91 CRPC"
                              >
                                <Download className="h-5 w-5" />
                              </button>
                            )}

                            {!item.assignedTo && !['resolved', 'closed'].includes(item.status) && (
                              <button
                                  onClick={() => {
                                    setSelectedCaseId(item.id || item._id);
                                    setShowAssignModal(true);
                                  }}
                                  className="text-emerald-600 hover:text-emerald-900 p-1 rounded-md hover:bg-emerald-50"
                                  title="Assign to Police"
                              >
                                  <UserPlus className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCases.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-sm text-slate-500">
                        No cases found based on current filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modals placed outside main flow */}
      <CaseDetailsModal
        caseId={selectedCaseId}
        isOpen={showCaseModal}
        onClose={() => setShowCaseModal(false)}
        isAdmin={true}
        onAdminActionComplete={() => {
          loadDashboardData();
          setShowCaseModal(false);
        }}
        onAssignPolice={() => {
          setShowAssignModal(true);
          // Keep case modal open or close it? User probably wants to stay in context, but assignment is a modal on top.
          // The current implementation of AssignModal is fixed inset-0 z-50.
          // CaseDetailsModal is also z-50. This might cause z-index conflict.
          // Better to perhaps close CaseDetailsModal or ensure AssignModal is z-[60].
        }}
      />

        {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-900">Assign Case to Police Officer</h3>
              <button 
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {policeOfficers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {policeOfficers.map((officer) => (
                    <button
                      key={officer._id}
                      onClick={() => handleAssignToPolice(officer._id, officer.name)}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 text-left transition-all hover:bg-indigo-50 hover:border-indigo-200 group"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-600">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{officer.name}</p>
                        <p className="text-xs text-slate-500">{officer.department || 'General Dept'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No police officers found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;