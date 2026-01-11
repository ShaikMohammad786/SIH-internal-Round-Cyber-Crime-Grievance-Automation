import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../utils/auth";
import Header from "../components/Header";
import { Shield, Lock, User, AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      if (response.success) {
        if (response.user && response.user.role === 'admin') {
          // Admin users should only access admin dashboard
          navigate("/admin-dashboard");
        } else {
          // Non-admin users should not be able to access admin login
          setError("Access denied. Admin credentials required.");
        }
      }
    } catch (error) {
      console.error("Admin login error:", error);
      setError(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header Section */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
               <Shield className="h-8 w-8" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
              Admin Access
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Restricted portal for case management and oversight
            </p>
          </div>

          {/* Card */}
          <div className="bg-white py-8 px-4 shadow-xl ring-1 ring-slate-200 sm:rounded-xl sm:px-10">
            
            <div className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-amber-50 p-4 border border-amber-100">
               <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
               <div className="text-sm text-amber-800">
                  <p className="font-semibold">Authorized Personnel Only</p>
                  <p className="mt-0.5">All access is logged and monitored.</p>
               </div>
            </div>

            {error && (
               <div className="mb-6 rounded-lg bg-red-50 p-4 border border-red-200 flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                  <p className="text-sm font-medium text-red-800">{error}</p>
               </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Administrator Email
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Administrative Password
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                       <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                       Authenticating...
                    </>
                  ) : (
                    "Access Admin Portal"
                  )}
                </button>
              </div>

              <div className="text-center">
                 <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 hover:underline">
                    ← Back to User Login
                 </Link>
              </div>
            </form>
          </div>
          
          <p className="text-center text-xs text-slate-400">
             Secure System • 256-bit Encryption • Unauthorized Access Prohibited
          </p>

        </div>
      </main>
    </div>
  );
};

export default Admin;
