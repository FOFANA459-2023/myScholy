import React, { lazy } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";

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

const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage.jsx"));
const AdminScholarshipsPage = lazy(() => import("./pages/admin/AdminScholarshipsPage.jsx"));
const AdminArchivePage = lazy(() => import("./pages/admin/AdminArchivePage.jsx"));
const AdminUserDirectoryPage = lazy(() => import("./pages/admin/AdminUserDirectoryPage.jsx"));
const ScholarshipFormPage = lazy(() => import("./pages/admin/ScholarshipFormPage.jsx"));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage.jsx"));
const AdminMessagesPage = lazy(() => import("./pages/admin/AdminMessagesPage.jsx"));
const AdminConversationPage = lazy(() => import("./pages/admin/AdminConversationPage.jsx"));

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<LandingPage />} />

          {/* Public */}
          <Route path="scholarships" element={<ScholarshipListPage />} />
          {/* :slug is the scholarship name slug; the API also resolves a
              numeric id here so pre-slug bookmarks and emailed links work. */}
          <Route path="scholarships/:slug" element={<ScholarshipDetailPage />} />
          {/* The programs page was retired; the assessment covers its job. */}
          <Route path="programs" element={<Navigate to="/assessment" replace />} />
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

          {/* Admin: the dashboard fans out to every admin surface. User
              management is open to every admin (the API limits what a
              non-super admin can do there); the user directory is not. */}
          <Route path="admin" element={<ProtectedRoute require="admin" />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="scholarships" element={<AdminScholarshipsPage />} />
            <Route path="scholarships/archive" element={<AdminArchivePage />} />
            <Route path="scholarships/new" element={<ScholarshipFormPage mode="create" />} />
            <Route path="scholarships/:id/edit" element={<ScholarshipFormPage mode="edit" />} />
            <Route path="users" element={<AdminUsersPage />} />
          </Route>

          {/* Super admin only */}
          <Route path="admin/directory" element={<ProtectedRoute require="superadmin" />}>
            <Route index element={<AdminUserDirectoryPage />} />
          </Route>
          <Route path="admin/messages" element={<ProtectedRoute require="superadmin" />}>
            <Route index element={<AdminMessagesPage />} />
            <Route path=":email" element={<AdminConversationPage />} />
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
