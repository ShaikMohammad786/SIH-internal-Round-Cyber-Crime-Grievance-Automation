import api from './auth';

// Case Management API
export const casesAPI = {
  // Create new case
  createCase: async (caseData) => {
    try {
      const response = await api.post('/cases/create', caseData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create case');
    }
  },

  // Get user's cases
  getMyCases: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/cases/my-cases?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch cases');
    }
  },

  // Get case details
  getCaseDetails: async (caseId) => {
    try {
      const response = await api.get(`/cases/${caseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch case details');
    }
  },

  // Get case statistics
  getCaseStats: async () => {
    try {
      const response = await api.get('/cases/stats/overview');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch case statistics');
    }
  },

  // Update case status (admin only)
  updateCaseStatus: async (caseId, status, notes) => {
    try {
      const response = await api.patch(`/cases/${caseId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update case status');
    }
  }
};

// Admin API
export const adminAPI = {
  // Get admin dashboard statistics
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard-stats');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch dashboard statistics');
    }
  },

  // Get all users
  getUsers: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/users?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
  },

  // Update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await api.patch(`/admin/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update user role');
    }
  },

  // Get all cases (admin view)
  getAllCases: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams(params).toString();
      const response = await api.get(`/admin/all-cases?${queryParams}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch all cases');
    }
  },

  // Get case details (admin view)
  getCaseDetails: async (caseId) => {
    try {
      const response = await api.get(`/admin/cases/${caseId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch case details');
    }
  },

  // Assign case to admin
  assignCase: async (caseId) => {
    try {
      const response = await api.patch(`/admin/cases/${caseId}/assign`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to assign case');
    }
  },

  // Get case analytics
  getCaseAnalytics: async (period = '30d') => {
    try {
      const response = await api.get(`/admin/analytics/cases?period=${period}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch case analytics');
    }
  }
};

// Case types and statuses
export const CASE_TYPES = [
  'UPI Fraud',
  'Credit Card Fraud',
  'Online Shopping Scam',
  'Investment Scam',
  'Romance Scam',
  'Phone Scam',
  'Email Phishing',
  'Identity Theft',
  'Cryptocurrency Scam',
  'Job Scam',
  'Loan Scam',
  'Other'
];

export const CASE_STATUSES = {
  submitted: { label: 'Submitted', color: 'blue' },
  under_review: { label: 'Under Review', color: 'yellow' },
  investigating: { label: 'Investigating', color: 'orange' },
  resolved: { label: 'Resolved', color: 'green' },
  closed: { label: 'Closed', color: 'gray' },
  rejected: { label: 'Rejected', color: 'red' }
};

export const CASE_PRIORITIES = {
  low: { label: 'Low', color: 'gray' },
  medium: { label: 'Medium', color: 'yellow' },
  high: { label: 'High', color: 'orange' },
  urgent: { label: 'Urgent', color: 'red' }
};

// Utility functions
export const formatAmount = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getStatusColor = (status) => {
  return CASE_STATUSES[status]?.color || 'gray';
};

export const getStatusLabel = (status) => {
  return CASE_STATUSES[status]?.label || status;
};

export const getPriorityColor = (priority) => {
  return CASE_PRIORITIES[priority]?.color || 'gray';
};

export const getPriorityLabel = (priority) => {
  return CASE_PRIORITIES[priority]?.label || priority;
};
