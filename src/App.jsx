import React, { lazy } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary.jsx";
import SiteLayout from "./components/layout/SiteLayout.jsx";
import ProtectedRoute, { GuestOnlyRoute } from "./routes/ProtectedRoute.jsx";
import LandingPage from "./pages/LandingPage.jsx";

/**
 * Everything except the landing page is code-split. The whole app used to ship
 * as a single bundle, so a first-time visitor downloaded the admin panel, the
 * super-admin panel and every form before seeing the hero image.
 */
const ScholarshipListPage = lazy(() => import("./pages/ScholarshipListPage.jsx"));
const ScholarshipDetailPage = lazy(() => import("./pages/ScholarshipDetailPage.jsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.jsx"));
const ProgramsPage = lazy(() => import("./pages/ProgramsPage.jsx"));
const AssessmentPage = lazy(() => import("./pages/AssessmentPage.jsx"));
const ConsultingPage = lazy(() => import("./pages/ConsultingPage.jsx"));
const AcademyPage = lazy(() => import("./pages/AcademyPage.jsx"));
const WhatsAppInvitePage = lazy(() => import("./pages/WhatsAppInvitePage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const SignupPage = lazy(() => import("./pages/SignupPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.jsx"));
const AccessDeniedPage = lazy(() => import("./pages/AccessDeniedPage.jsx"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage.jsx"));

const AdminScholarshipsPage = lazy(() => import("./pages/admin/AdminScholarshipsPage.jsx"));
const ScholarshipFormPage = lazy(() => import("./pages/admin/ScholarshipFormPage.jsx"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage.jsx"));

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<LandingPage />} />

          {/* Public */}
          <Route path="scholarships" element={<ScholarshipListPage />} />
          <Route path="scholarships/:id" element={<ScholarshipDetailPage />} />
          <Route path="programs" element={<ProgramsPage />} />
          <Route path="assessment" element={<AssessmentPage />} />
          <Route path="consulting" element={<ConsultingPage />} />
          <Route path="academy" element={<AcademyPage />} />
          <Route path="contact" element={<ContactPage />} />
          {/* The FAQ moved onto the landing page; keep old links working. */}
          <Route path="faq" element={<Navigate to="/#faq" replace />} />
          <Route path="whatsapp" element={<WhatsAppInvitePage />} />
          <Route path="access-denied" element={<AccessDeniedPage />} />

          {/* Guests only */}
          <Route element={<GuestOnlyRoute />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Admin */}
          <Route path="admin" element={<ProtectedRoute require="admin" />}>
            <Route index element={<Navigate to="/admin/scholarships" replace />} />
            <Route path="scholarships" element={<AdminScholarshipsPage />} />
            <Route path="scholarships/new" element={<ScholarshipFormPage mode="create" />} />
            <Route path="scholarships/:id/edit" element={<ScholarshipFormPage mode="edit" />} />
          </Route>

          {/* Super admin */}
          <Route path="admin/users" element={<ProtectedRoute require="superadmin" />}>
            <Route index element={<AdminUsersPage />} />
          </Route>

          {/* Legacy URLs from the previous routing scheme */}
          <Route path="scholarship-list" element={<Navigate to="/scholarships" replace />} />
          <Route
            path="scholarship-detail/:id"
            element={<LegacyScholarshipRedirect />}
          />
          <Route
            path="admin-scholarship-list"
            element={<Navigate to="/admin/scholarships" replace />}
          />
          <Route
            path="post-scholarship"
            element={<Navigate to="/admin/scholarships/new" replace />}
          />
          <Route path="update-scholarship/:id" element={<LegacyUpdateRedirect />} />
          <Route path="super-admin-panel" element={<Navigate to="/admin/users" replace />} />
          <Route path="admin-login" element={<Navigate to="/login" replace />} />
          <Route path="whatsapp-invite" element={<Navigate to="/whatsapp" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

/* Preserve bookmarked links from the old URL scheme. */
function LegacyScholarshipRedirect() {
  const { id } = useParams();
  return <Navigate to={`/scholarships/${id}`} replace />;
}

function LegacyUpdateRedirect() {
  const { id } = useParams();
  return <Navigate to={`/admin/scholarships/${id}/edit`} replace />;
}
