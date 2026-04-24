import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { PublicLayout } from '@/layouts/PublicLayout';

const LandingPage = lazy(() => import('@/pages/public/LandingPage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const LoginPage = lazy(() => import('@/pages/public/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPasswordPage'));
const UnauthorizedPage = lazy(() => import('@/pages/system/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('@/pages/system/NotFoundPage'));

const StudentDashboardPage = lazy(() => import('@/pages/student/StudentDashboardPage'));
const StudentProfilePage = lazy(() => import('@/pages/student/StudentProfilePage'));
const StudentApplicationsPage = lazy(() => import('@/pages/student/StudentApplicationsPage'));
const StudentSavedJobsPage = lazy(() => import('@/pages/student/StudentSavedJobsPage'));
const StudentNotificationsPage = lazy(() => import('@/pages/student/StudentNotificationsPage'));
const StudentChatPage = lazy(() => import('@/pages/student/StudentChatPage'));

const RecruiterDashboardPage = lazy(() => import('@/pages/recruiter/RecruiterDashboardPage'));
const CompanyProfilePage = lazy(() => import('@/pages/recruiter/CompanyProfilePage'));
const CreateInternshipPage = lazy(() => import('@/pages/recruiter/CreateInternshipPage'));
const ManageInternshipsPage = lazy(() => import('@/pages/recruiter/ManageInternshipsPage'));
const ApplicantsPage = lazy(() => import('@/pages/recruiter/ApplicantsPage'));
const RecruiterChatPage = lazy(() => import('@/pages/recruiter/RecruiterChatPage'));
const CompanyPublicProfilePage = lazy(() => import('@/pages/shared/CompanyPublicProfilePage'));

const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
const RolesPage = lazy(() => import('@/pages/admin/RolesPage'));
const PermissionsPage = lazy(() => import('@/pages/admin/PermissionsPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'));
const DataExchangePage = lazy(() => import('@/pages/admin/DataExchangePage'));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage'));

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/companies/:companyId" element={<CompanyPublicProfilePage />} />

          <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboardPage />} />
            <Route path="/student/profile" element={<StudentProfilePage />} />
            <Route path="/student/applications" element={<StudentApplicationsPage />} />
            <Route path="/student/saved-jobs" element={<StudentSavedJobsPage />} />
            <Route path="/student/notifications" element={<StudentNotificationsPage />} />
            <Route path="/student/chat" element={<StudentChatPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Recruiter']} />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboardPage />} />
            <Route path="/recruiter/company-profile" element={<CompanyProfilePage />} />
            <Route path="/recruiter/create-internship" element={<CreateInternshipPage />} />
            <Route path="/recruiter/manage-internships" element={<ManageInternshipsPage />} />
            <Route path="/recruiter/applicants" element={<ApplicantsPage />} />
            <Route path="/recruiter/chat" element={<RecruiterChatPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<UsersPage />} />
            <Route path="/admin/roles" element={<RolesPage />} />
            <Route path="/admin/permissions" element={<PermissionsPage />} />
            <Route path="/admin/reports" element={<ReportsPage />} />
            <Route path="/admin/settings" element={<SettingsPage />} />
            <Route path="/admin/data" element={<DataExchangePage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
