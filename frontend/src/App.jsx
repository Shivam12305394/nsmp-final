import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Chatbot from './components/Chatbot';
import SplashScreen from './components/SplashScreen';

import Landing from './pages/Landing';
import { Login, Register } from './pages/Auth';
import Dashboard from './pages/student/Dashboard';
import BrowseScholarships from './pages/student/Browse';
import { SmartMatches, StudentApplications, StudentProfile, Documents } from './pages/student/StudentPages';
import { AdminDashboard, AdminScholarships, AdminApplications, AdminStudents, Analytics, FraudDetection } from './pages/admin/AdminPages';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div style={{ minHeight: '100vh', background: '#080C14' }} />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', background: '#080C14' }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function StudentRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ minHeight: '100vh', background: '#080C14' }} />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function SmartDashboard() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminDashboard /> : <Dashboard />;
}
function SmartScholarships() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminScholarships /> : <BrowseScholarships />;
}
function SmartApplications() {
  const { user } = useAuth();
  return user?.role === 'admin' ? <AdminApplications /> : <StudentApplications />;
}

// Public pages ko loading ka wait nahi karna — hamesha dikhao
// Agar user already logged in hai (aur loading done hai) tabhi redirect karo
function PublicPage({ children }) {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/" element={<PublicPage><Landing /></PublicPage>} />
        <Route path="/login" element={<PublicPage><Login /></PublicPage>} />
        <Route path="/register" element={<PublicPage><Register /></PublicPage>} />
        <Route path="/dashboard" element={<PrivateRoute><SmartDashboard /></PrivateRoute>} />
        <Route path="/scholarships" element={<PrivateRoute><SmartScholarships /></PrivateRoute>} />
        <Route path="/applications" element={<PrivateRoute><SmartApplications /></PrivateRoute>} />
        <Route path="/matches" element={<StudentRoute><SmartMatches /></StudentRoute>} />
        <Route path="/profile" element={<StudentRoute><StudentProfile /></StudentRoute>} />
        <Route path="/documents" element={<StudentRoute><Documents /></StudentRoute>} />
        <Route path="/students" element={<AdminRoute><AdminStudents /></AdminRoute>} />
        <Route path="/analytics" element={<AdminRoute><Analytics /></AdminRoute>} />
        <Route path="/fraud" element={<AdminRoute><FraudDetection /></AdminRoute>} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
      </Routes>
      {user && <Chatbot />}
    </>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  return (
    <AuthProvider>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {splashDone && <AppRoutes />}
    </AuthProvider>
  );
}
