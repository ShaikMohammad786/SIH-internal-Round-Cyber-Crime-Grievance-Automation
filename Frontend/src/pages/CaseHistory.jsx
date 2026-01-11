import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser } from "../utils/auth";
import { userProfilesAPI } from "../utils/userProfilesAPI";
import Header from "../components/Header";
import jsPDF from "jspdf";
import { 
  Search, Filter, Download, ArrowUpDown, ChevronDown, 
  FileText, Eye, AlertCircle, CheckCircle, Clock, ShieldAlert,
  Calendar, DollarSign, LayoutList, RefreshCw
} from "lucide-react";

const CaseHistory = () => {
  const navigate = useNavigate();
  const username = useMemo(() => {
    const user = getUser();
    return user?.name || user?.username || "User";
  }, []);
  
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [selectedCases, setSelectedCases] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadCases();
    const interval = setInterval(loadCases, 30000); 
    return () => clearInterval(interval);
  }, []);

  const loadCases = async () => {
    try {
      if (!cases.length) setLoading(true); // Only show spinner on first load or manual refresh
      setError("");
      
      const response = await userProfilesAPI.getMyCases();
      
      if (response.success) {
        setCases(response.cases || []);
        setLastRefresh(new Date());
      } else {
        setError(response.message || "Failed to load cases");
      }
    } catch (error) {
      setError(error.message || "Failed to load cases. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      submitted: { label: "Submitted", color: "bg-slate-50 text-slate-700 ring-slate-600/20", icon: Clock },
      verified: { label: "Verified", color: "bg-blue-50 text-blue-700 ring-blue-600/20", icon: ShieldAlert },
      crpc_generated: { label: "91 CRPC Ready", color: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", icon: FileText },
      emails_sent: { label: "Notified", color: "bg-purple-50 text-purple-700 ring-purple-600/20", icon: Mail },
      authorized: { label: "Authorized", color: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", icon: CheckCircle },
      assigned_to_police: { label: "Investigating", color: "bg-orange-50 text-orange-700 ring-orange-600/20", icon: ShieldAlert },
      evidence_collected: { label: "Evidence Ready", color: "bg-cyan-50 text-cyan-700 ring-cyan-600/20", icon: FileText },
      resolved: { label: "Solved", color: "bg-green-50 text-green-700 ring-green-600/20", icon: CheckCircle },
      closed: { label: "Closed", color: "bg-slate-50 text-slate-700 ring-slate-600/20", icon: Lock }
    };
    return statusMap[status] || { label: status, color: "bg-slate-50 text-slate-700 ring-slate-600/20", icon: AlertCircle };
  };

  const filteredAndSortedCases = useMemo(() => {
    let filtered = [...cases];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      filtered = filtered.filter(caseItem => 
        (caseItem.caseId || '').toLowerCase().includes(query) ||
        (caseItem.caseType || '').toLowerCase().includes(query) ||
        (caseItem.status || '').toLowerCase().includes(query) ||
        (caseItem.location?.state || '').toLowerCase().includes(query) ||
        (caseItem.location?.city || '').toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') filtered = filtered.filter(c => c.status === statusFilter);
    if (typeFilter !== 'all') filtered = filtered.filter(c => c.caseType === typeFilter);

    if (dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') filtered = filtered.filter(c => new Date(c.createdAt).toDateString() === now.toDateString());
      else if (dateFilter === 'week') filtered = filtered.filter(c => new Date(c.createdAt) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
      else if (dateFilter === 'month') filtered = filtered.filter(c => new Date(c.createdAt) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    }

    if (amountFilter !== 'all') {
      filtered = filtered.filter(c => {
        const amount = Number(c.amount || 0);
        if (amountFilter === '0-1000') return amount <= 1000;
        if (amountFilter === '1000-10000') return amount > 1000 && amount <= 10000;
        if (amountFilter === '10000-50000') return amount > 10000 && amount <= 50000;
        if (amountFilter === '50000+') return amount > 50000;
        return true;
      });
    }

    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
        case 'amount':
          aVal = Number(a.amount || 0); bVal = Number(b.amount || 0); break;
        case 'status':
          aVal = a.status || ''; bVal = b.status || ''; break;
        default:
          aVal = 0; bVal = 0;
      }
      return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    return filtered;
  }, [cases, searchTerm, statusFilter, typeFilter, dateFilter, amountFilter, sortBy, sortDir]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedCases(filteredAndSortedCases.map(c => c.id));
    else setSelectedCases([]);
  };

  const handleCaseSelect = (id) => {
    setSelectedCases(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const downloadPDF = (caseItem) => {
    // Simplified PDF generation logic for brevity - keeping core functionality
    const doc = new jsPDF();
    doc.text(`Case Report: ${caseItem.caseId}`, 20, 20);
    doc.text(`Status: ${caseItem.status}`, 20, 30);
    doc.save(`Case-${caseItem.caseId}.pdf`);
  };

  const formatAmount = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount || 0);
  const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Case History</h1>
            <p className="mt-1 text-sm text-slate-500">Manage and track your reported incidents</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/register-case')} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              <ShieldAlert className="h-4 w-4" /> Report New Case
            </button>
            <button onClick={loadCases} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Sync
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                className="block w-full rounded-lg border-0 py-2 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Report Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="all">All Types</option>
              <option value="upi-fraud">UPI Fraud</option>
              <option value="phishing">Phishing</option>
              <option value="investment-scam">Investment Scam</option>
            </select>

            <select
              value={amountFilter}
              onChange={(e) => setAmountFilter(e.target.value)}
              className="block w-full rounded-lg border-0 py-2 pl-3 pr-10 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option value="all">Any Amount</option>
              <option value="0-1000">₹0 - ₹1,000</option>
              <option value="1000-10000">₹1,000 - ₹10,000</option>
              <option value="50000+">₹50,000+</option>
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="relative px-6 py-3">
                    <input
                      type="checkbox"
                      className="absolute left-6 top-1/2 -mt-2 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                      checked={selectedCases.length > 0 && selectedCases.length === filteredAndSortedCases.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 cursor-pointer" onClick={() => toggleSort('caseId')}>
                    Case ID
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 cursor-pointer" onClick={() => toggleSort('status')}>
                    Status {sortBy === 'status' && <ArrowUpDown className="inline h-3 w-3" />}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 cursor-pointer" onClick={() => toggleSort('amount')}>
                    Amount {sortBy === 'amount' && <ArrowUpDown className="inline h-3 w-3" />}
                  </th>
                  <th scope="col" className="px-3 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 cursor-pointer" onClick={() => toggleSort('createdAt')}>
                    Date {sortBy === 'createdAt' && <ArrowUpDown className="inline h-3 w-3" />}
                  </th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredAndSortedCases.length > 0 ? (
                  filteredAndSortedCases.map((caseItem) => {
                    const StatusIcon = getStatusInfo(caseItem.status).icon;
                    return (
                      <tr 
                        key={caseItem.id} 
                        className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedCases.includes(caseItem.id) ? 'bg-indigo-50 hover:bg-indigo-100' : ''}`}
                        onClick={() => navigate(`/case-status/${caseItem.id}`)}
                      >
                        <td className="relative px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedCases.includes(caseItem.id)}
                            onChange={() => handleCaseSelect(caseItem.id)}
                            className="absolute left-6 top-1/2 -mt-2 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-indigo-600">
                          {caseItem.caseId}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-700 capitalize">
                          {caseItem.caseType?.replace('-', ' ')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusInfo(caseItem.status).color}`}>
                            <StatusIcon className="h-3 w-3" />
                            {getStatusInfo(caseItem.status).label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-medium text-slate-900">
                          {formatAmount(caseItem.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm text-slate-500">
                          {formatDate(caseItem.createdAt)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => downloadPDF(caseItem)}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => navigate(`/case-status/${caseItem.id}`)}
                              className="text-indigo-400 hover:text-indigo-600 transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                        <LayoutList className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-medium text-slate-900">No cases found</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {cases.length === 0 ? "You haven't reported any cases yet." : "No cases match your filters."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CaseHistory;