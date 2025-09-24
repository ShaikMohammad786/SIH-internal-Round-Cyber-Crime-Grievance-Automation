import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import PolicePortal from "./pages/PolicePortal";
import PoliceLogin from "./pages/PoliceLogin";
import Dashboard from "./pages/Dashboard";
import RegisterCase from "./pages/RegisterCase";
import CaseHistory from "./pages/CaseHistory";
import CaseStatus from "./pages/CaseStatus";
import TestFlow from "./pages/TestFlow";
import AdminFlowDashboard from "./pages/AdminFlowDashboard";
import PoliceFlowPortal from "./pages/PoliceFlowPortal";
import DebugTest from "./pages/DebugTest";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import UserProtectedRoute from "./components/UserProtectedRoute";
import PoliceProtectedRoute from "./components/PoliceProtectedRoute";
import SessionManager from "./components/SessionManager";

export default function App() {
  return (
    <BrowserRouter>
      <SessionManager />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin-dashboard" element={
          <AdminProtectedRoute>
            <AdminDashboard />
          </AdminProtectedRoute>
        } />
        <Route path="/police-login" element={<PoliceLogin />} />
        <Route path="/police-portal" element={
          <PoliceProtectedRoute>
            <PolicePortal />
          </PoliceProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <UserProtectedRoute>
            <Dashboard />
          </UserProtectedRoute>
        } />
        <Route path="/register-case" element={
          <UserProtectedRoute>
            <RegisterCase />
          </UserProtectedRoute>
        } />
        <Route path="/case-history" element={
          <ProtectedRoute>
            <CaseHistory />
          </ProtectedRoute>
        } />
        <Route path="/case-status" element={
          <ProtectedRoute>
            <CaseStatus />
          </ProtectedRoute>
        } />
        <Route path="/case-status/:caseId" element={
          <ProtectedRoute>
            <CaseStatus />
          </ProtectedRoute>
        } />
        <Route path="/test-flow" element={<TestFlow />} />
        <Route path="/debug-test" element={<DebugTest />} />
        <Route path="/admin-flow" element={
          <AdminProtectedRoute>
            <AdminFlowDashboard />
          </AdminProtectedRoute>
        } />
        <Route path="/police-flow" element={
          <PoliceProtectedRoute>
            <PoliceFlowPortal />
          </PoliceProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
