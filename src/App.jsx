import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ScholarshipList from "./pages/ScholarshipList.jsx";
import ScholarshipDetail from "./pages/ScholarshipDetail.jsx";
import PostScholarship from "./Admin/PostScholarship.jsx";
import AdminScholarshipList from "./Admin/AdminScholarshipList.jsx";
import UpdateScholarship from "./Admin/UpdateScholarship.jsx";
import LandingPage from "./components/LandingPage.jsx";
import Contact from "./pages/Contact.jsx";
import Signup from "./student/Signup.jsx";
import Login from "./student/Login.jsx";
import WhatsAppInvite from "./components/WhatsAppInvite.jsx";
// AdminNavbar removed; use Navbar for all, with admin logic inside Navbar
import AccessDenied from "./pages/AccessDenied.jsx";
import UserManagement from "./Admin/UserManagement.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminDashboard from "./Admin/AdminDashboard.jsx";
import NotFound from "./pages/NotFound.jsx";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Default Route */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Routes */}
        <Route path="/contact" element={<Contact />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/whatsapp-invite" element={
          <ProtectedRoute requireLogin={true}>
            <WhatsAppInvite />
          </ProtectedRoute>
        } />
        <Route path="/access-denied" element={<AccessDenied />} />
        
        {/* Protected Routes - Require Login for Ordinary Users */}
        <Route path="/scholarship-list" element={<ScholarshipList />} />
        <Route path="/scholarship-detail/:id" element={<ScholarshipDetail />} />
        
        {/* Protected Admin Routes */}
        {/* AdminNavbar removed; use Navbar for all, with admin logic inside Navbar */}
        <Route path="/post-scholarship" element={
          <ProtectedRoute requiredRole="admin">
            <PostScholarship />
          </ProtectedRoute>
        } />
        <Route path="/admin-scholarship-list" element={
          <ProtectedRoute requiredRole="admin">
            <AdminScholarshipList />
          </ProtectedRoute>
        } />
        <Route path="/admin-dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/update-scholarship/:id" element={
          <ProtectedRoute requiredRole="admin">
            <UpdateScholarship />
          </ProtectedRoute>
        } />
        {/* User Management for admin */}
        <Route path="/user-management" element={
          <ProtectedRoute requiredRole="admin">
            <UserManagement />
          </ProtectedRoute>
        } />
        {/* Catch-all: render NotFound for any unknown route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
