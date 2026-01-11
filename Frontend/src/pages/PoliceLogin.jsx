import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/auth';
import { Shield, Lock, User, AlertTriangle, CheckCircle, ArrowLeft, Loader2 } from 'lucide-react';

const PoliceLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(null, formData.password, formData.username);
      
      if (response.success) {
        if (response.user.role === 'police') {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          navigate('/police-portal');
        } else {
          setError('Access denied. Police login required.');
        }
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (credentials) => {
    setFormData({
      username: credentials.username,
      password: credentials.password
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-3xl"></div>
         <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-indigo-900/20 blur-3xl"></div>
      </div>

      <div className="w-full max-w-lg space-y-8 relative z-10">
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg ring-4 ring-blue-900/50">
             <Shield className="h-10 w-10" />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
            Police Portal Access
          </h2>
          <p className="mt-2 text-sm text-blue-200">
            Secure login for authorized law enforcement personnel
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-200">
          <div className="p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md bg-red-50 p-4 border border-red-100 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                    Badge ID or Username
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Shield className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="Enter ID"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full rounded-lg border-0 py-2.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-lg bg-blue-600 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                   <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Authenticating...
                   </>
                ) : (
                   "Sign In to Portal"
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 text-center">
                Demo Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Inspector Rajesh', user: 'inspector_rajesh', rank: 'Inspector' },
                  { name: 'Priya Sharma', user: 'si_priya', rank: 'Sub Inspector' },
                  { name: 'Amit Singh', user: 'asi_amit', rank: 'ASI' }
                ].map((cred, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleDemoLogin({ username: cred.user, password: 'police123' })}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                  > 
                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 mb-2 group-hover:bg-blue-100 group-hover:text-blue-600">
                       <User className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-900">{cred.name}</span>
                    <span className="text-[10px] text-slate-500">{cred.rank}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-200 text-center">
             <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" /> Back to Main Site
             </Link>
          </div>
        </div>
        
        <p className="text-center text-xs text-slate-500">
          Restricted System. Unauthorized access is a criminal offense.
        </p>
      </div>
    </div>
  );
};

export default PoliceLogin;
