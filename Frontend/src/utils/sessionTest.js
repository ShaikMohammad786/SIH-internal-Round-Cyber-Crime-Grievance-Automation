// Session Management Test Utility
import { 
  createUserSession, 
  getCurrentSession, 
  getUserHistory, 
  addActivityHistory,
  updateSessionActivity,
  clearUserSession 
} from './auth';

export const testSessionManagement = () => {
  console.log('🧪 Testing Session Management...');
  
  // Test 1: Create a mock user session
  const mockUser = {
    id: 'test_user_123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user'
  };
  
  const mockToken = 'mock_jwt_token_123';
  
  console.log('1️⃣ Creating user session...');
  const session = createUserSession(mockUser, mockToken);
  console.log('✅ Session created:', session);
  
  // Test 2: Get current session
  console.log('2️⃣ Getting current session...');
  const currentSession = getCurrentSession();
  console.log('✅ Current session:', currentSession);
  
  // Test 3: Get user history
  console.log('3️⃣ Getting user history...');
  const history = getUserHistory(mockUser.id);
  console.log('✅ User history:', history);
  
  // Test 4: Add activity history
  console.log('4️⃣ Adding activity history...');
  addActivityHistory(mockUser.id, {
    action: 'test_action',
    details: 'Testing session management',
    page: '/test'
  });
  
  const updatedHistory = getUserHistory(mockUser.id);
  console.log('✅ Updated history:', updatedHistory);
  
  // Test 5: Update session activity
  console.log('5️⃣ Updating session activity...');
  updateSessionActivity();
  
  const updatedSession = getCurrentSession();
  console.log('✅ Updated session:', updatedSession);
  
  // Test 6: Clear session
  console.log('6️⃣ Clearing session...');
  clearUserSession();
  
  const clearedSession = getCurrentSession();
  console.log('✅ Session cleared:', clearedSession === null ? 'Yes' : 'No');
  
  console.log('🎉 Session management test completed!');
};

// Auto-run test if this file is imported
if (typeof window !== 'undefined') {
  // Only run in browser environment
  window.testSessionManagement = testSessionManagement;
}
