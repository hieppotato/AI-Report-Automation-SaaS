import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useOrgStore } from '../../store/orgStore'

// Public Page imports
import { LoginPage } from '../../pages/LoginPage'
import { RegisterPage } from '../../pages/RegisterPage'
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage'
import { InvitationAcceptPage } from '../../pages/InvitationAcceptPage'

// Protected Page imports
import { DashboardPage } from '../../pages/DashboardPage'
import { ReportsPage } from '../../pages/reports/ReportsPage'
import { CreateReportPage } from '../../pages/reports/CreateReportPage'
import { ReportDetailsPage } from '../../pages/reports/ReportDetailsPage'
import { UploadPage } from '../../pages/UploadPage'
import { OrgSettingsPage } from '../../pages/OrgSettingsPage'
import { MembersPage } from '../../pages/MembersPage'
import { BillingPage } from '../../pages/BillingPage'
import { ProfilePage } from '../../pages/ProfilePage'
import { OnboardingPage } from '../../pages/OnboardingPage'
import { AuditLogsPage } from '../../pages/AuditLogsPage'

// Force authorization and workspace tenants
function ProtectedRoute({ children }) {
  const location = useLocation()
  const { session, loading: authLoading } = useAuthStore()
  const { organizations, loading: orgLoading } = useOrgStore()

  if (authLoading || orgLoading) return null

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const hasOrgs = organizations && organizations.length > 0
  const isOnboardingRoute = location.pathname === '/onboarding'

  if (hasOrgs && isOnboardingRoute) {
    return <Navigate to="/dashboard" replace />
  }

  if (!hasOrgs && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

// Intercept logged in accounts attempting public screens
function PublicRoute({ children }) {
  const { session, loading: authLoading } = useAuthStore()
  const { loading: orgLoading } = useOrgStore()

  if (authLoading || orgLoading) return null

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export function AppRouter() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path="/invitations/accept"
        element={<InvitationAcceptPage />}
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/create"
        element={
          <ProtectedRoute>
            <CreateReportPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports/:id"
        element={
          <ProtectedRoute>
            <ReportDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <UploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organization"
        element={
          <ProtectedRoute>
            <OrgSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <MembersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <ProtectedRoute>
            <BillingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
export default AppRouter
