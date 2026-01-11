import { Link, useNavigate } from "react-router-dom";
import { authAPI, getUser } from "../utils/auth";
import ProfilePopup from "./ProfilePopup";
import { useState } from "react";
import { Shield, User, LogOut, Lock, LogIn } from "lucide-react";

export default function Header({ loggedIn = false, username = "" }) {
  const navigate = useNavigate();
  const user = getUser();
  const isLoggedIn = loggedIn || !!user;
  const displayName = user?.name || user?.username || username || "";
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo Section */}
        <div 
          className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80" 
          onClick={() => navigate("/")}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900">FraudLens</span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">Scam Reporter</span>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <span className="hidden text-sm font-medium text-slate-600 sm:block">
                Welcome, {displayName}
              </span>
              
              <button 
                onClick={() => setShowProfilePopup(true)}
                className="group flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200 hover:text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                title="View Profile"
              >
                <User className="h-5 w-5" />
              </button>

              {user?.role === 'police' && (
                <Link to="/police-portal">
                  <button className="flex items-center gap-2 rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-700">
                    <Shield className="h-4 w-4" />
                    <span>Police Portal</span>
                  </button>
                </Link>
              )}

              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-orange-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </button>
              </Link>
              
              <Link to="/police-login">
                <button className="hidden flex-center gap-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 sm:flex">
                  <Shield className="h-4 w-4" />
                  <span>Police Portal</span>
                </button>
              </Link>

              <Link to="/admin">
                <button className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white request-btn shadow-sm transition-transform hover:bg-indigo-700 hover:-translate-y-0.5">
                  <Lock className="h-4 w-4" />
                  <span>Admin Access</span>
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
      
      {isLoggedIn && (
        <ProfilePopup 
          isOpen={showProfilePopup} 
          onClose={() => setShowProfilePopup(false)} 
        />
      )}
    </header>
  );
}
