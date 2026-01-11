import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);

    if (error.response?.status === 401) {
      // Don't redirect if this is a login attempt
      if (error.config?.url?.includes('/auth/login')) {
        return Promise.reject(error);
      }

      console.log('Unauthorized access - token may be expired or invalid');

      // Check if token exists and is valid format
      const token = localStorage.getItem('token');
      if (!token || token === 'null' || token === 'undefined') {
        console.log('No valid token found, redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('fraudlens_session');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      } else {
        console.log('Token exists but is invalid/expired, clearing session');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('fraudlens_session');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    } else if (error.response?.status === 403) {
      console.log('Forbidden access');
      // Don't clear session for 403, just show error
    } else if (error.response?.status >= 500) {
      console.error('Server error:', error.response?.data);
    } else if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Token validation function
export const validateToken = () => {
  const token = localStorage.getItem('token');
  if (!token || token === 'null' || token === 'undefined') {
    return false;
  }

  try {
    // Basic JWT token validation (check if it's a valid JWT format)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Check if token is expired (basic check)
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;

    if (payload.exp && payload.exp < currentTime) {
      console.log('Token has expired');
      return false;
    }

    return true;
  } catch (error) {
    console.log('Invalid token format');
    return false;
  }
};

// Clear session and redirect to login
export const clearSessionAndRedirect = () => {
  console.log('Clearing session and redirecting to login...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('fraudlens_session');

  // Only redirect if not already on login page
  if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    window.location.href = '/login';
  }
};

// Auth functions
export const authAPI = {
  login: async (email, password, username = null) => {
    try {
      // Validate input
      if ((!email && !username) || !password) {
        return {
          success: false,
          message: 'Email/username and password are required'
        };
      }

      const response = await api.post('/auth/login', { email, username, password });

      if (response.data.success) {
        // Create session and track login
        createUserSession(response.data.user, response.data.token);
        addLoginHistory(response.data.user.id, {
          ip: 'client-side',
          userAgent: navigator.userAgent
        });
      }

      return response.data;
    } catch (error) {
      console.error('Login error:', error);

      let message = 'Login failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 401) {
        message = 'Invalid email or password';
      } else if (error.response?.status === 500) {
        message = 'Server error. Please try again later.';
      } else if (!error.response) {
        message = 'Network error. Please check your connection.';
      }

      return {
        success: false,
        message
      };
    }
  },

  register: async (userData) => {
    try {
      // Validate input
      if (!userData.email || !userData.password || !userData.name) {
        return {
          success: false,
          message: 'Name, email, and password are required'
        };
      }

      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        // Create session and track registration
        createUserSession(response.data.user, response.data.token);
        addLoginHistory(response.data.user.id, {
          ip: 'client-side',
          userAgent: navigator.userAgent
        });
      }

      return response.data;
    } catch (error) {
      console.error('Registration error:', error);

      let message = 'Registration failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 400) {
        message = 'Invalid registration data';
      } else if (error.response?.status === 409) {
        message = 'User already exists with this email';
      } else if (error.response?.status === 500) {
        message = 'Server error. Please try again later.';
      } else if (!error.response) {
        message = 'Network error. Please check your connection.';
      }

      return {
        success: false,
        message
      };
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);

      let message = 'Failed to get user data';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.status === 401) {
        message = 'Please log in again';
      } else if (error.response?.status === 500) {
        message = 'Server error. Please try again later.';
      } else if (!error.response) {
        message = 'Network error. Please check your connection.';
      }

      return {
        success: false,
        message
      };
    }
  },

  logout: () => {
    try {
      const user = getUser();
      if (user) {
        // Add logout activity to history
        addActivityHistory(user.id, {
          action: 'logout',
          details: 'User logged out',
          page: window.location.pathname
        });
      }

      clearUserSession();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear session and redirect even if there's an error
      clearUserSession();
      window.location.href = '/login';
    }
  },
};

// Session Management
const SESSION_KEY = 'fraudlens_session';
const USER_HISTORY_KEY = 'fraudlens_history';

// Utility functions
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  // Check if token is expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getToken = () => {
  return localStorage.getItem('token');
};

// Update stored user data
export const updateUser = (userData) => {
  if (!userData) return;

  localStorage.setItem('user', JSON.stringify(userData));

  // Also update session if it exists
  const session = getCurrentSession();
  if (session) {
    session.user = { ...session.user, ...userData };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};

// Session Management Functions
export const createUserSession = (userData, token) => {
  const session = {
    user: userData,
    token: token,
    loginTime: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    sessionId: generateSessionId()
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));

  // Initialize user history if not exists
  if (!getUserHistory(userData.id)) {
    initializeUserHistory(userData.id);
  }

  return session;
};

export const getCurrentSession = () => {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  return sessionStr ? JSON.parse(sessionStr) : null;
};

export const updateSessionActivity = () => {
  const session = getCurrentSession();
  if (session) {
    session.lastActivity = new Date().toISOString();
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
};

export const clearUserSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// User History Management
export const getUserHistory = (userId) => {
  const historyKey = `${USER_HISTORY_KEY}_${userId}`;
  const historyStr = localStorage.getItem(historyKey);
  return historyStr ? JSON.parse(historyStr) : null;
};

export const initializeUserHistory = (userId) => {
  const history = {
    userId: userId,
    loginHistory: [],
    activityHistory: [],
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en'
    },
    lastLogin: new Date().toISOString(),
    totalSessions: 0
  };

  const historyKey = `${USER_HISTORY_KEY}_${userId}`;
  localStorage.setItem(historyKey, JSON.stringify(history));
  return history;
};

export const addLoginHistory = (userId, loginData) => {
  const history = getUserHistory(userId) || initializeUserHistory(userId);

  history.loginHistory.push({
    timestamp: new Date().toISOString(),
    ip: loginData.ip || 'unknown',
    userAgent: loginData.userAgent || navigator.userAgent,
    success: true
  });

  // Keep only last 10 login attempts
  if (history.loginHistory.length > 10) {
    history.loginHistory = history.loginHistory.slice(-10);
  }

  history.lastLogin = new Date().toISOString();
  history.totalSessions += 1;

  const historyKey = `${USER_HISTORY_KEY}_${userId}`;
  localStorage.setItem(historyKey, JSON.stringify(history));
};

export const addActivityHistory = (userId, activity) => {
  const history = getUserHistory(userId);
  if (!history) return;

  history.activityHistory.push({
    timestamp: new Date().toISOString(),
    action: activity.action,
    details: activity.details,
    page: activity.page || window.location.pathname
  });

  // Keep only last 50 activities
  if (history.activityHistory.length > 50) {
    history.activityHistory = history.activityHistory.slice(-50);
  }

  const historyKey = `${USER_HISTORY_KEY}_${userId}`;
  localStorage.setItem(historyKey, JSON.stringify(history));
};

export const updateUserPreferences = (userId, preferences) => {
  const history = getUserHistory(userId);
  if (!history) return;

  history.preferences = { ...history.preferences, ...preferences };

  const historyKey = `${USER_HISTORY_KEY}_${userId}`;
  localStorage.setItem(historyKey, JSON.stringify(history));
};

// Helper Functions
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Auto-login on page load
export const checkAutoLogin = () => {
  if (isAuthenticated()) {
    const session = getCurrentSession();
    if (session) {
      updateSessionActivity();
      return true;
    }
  }
  return false;
};

export default api;