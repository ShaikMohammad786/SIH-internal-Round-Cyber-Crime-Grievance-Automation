import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  updateSessionActivity, 
  addActivityHistory, 
  getUser, 
  checkAutoLogin 
} from '../utils/auth';

const SessionManager = () => {
  const location = useLocation();
  const user = getUser();

  useEffect(() => {
    // Check auto-login on component mount
    checkAutoLogin();
  }, []);

  useEffect(() => {
    // Track page navigation
    if (user) {
      updateSessionActivity();
      
      // Add navigation activity to history
      addActivityHistory(user.id, {
        action: 'navigation',
        details: `Navigated to ${location.pathname}`,
        page: location.pathname
      });
    }
  }, [location, user]);

  useEffect(() => {
    // Track user activity (mouse movement, clicks, etc.)
    const trackActivity = () => {
      if (user) {
        updateSessionActivity();
      }
    };

    // Add event listeners for user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    // Cleanup event listeners
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, [user]);

  // This component doesn't render anything
  return null;
};

export default SessionManager;
