import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useOrgStore } from '../../store/orgStore'

// Public Page imports
import { LoginPage } from '../../pages/LoginPage'
import { RegisterPage } from '../../pages/RegisterPage'
import { ForgotPasswordPage } from '../../pages/ForgotPasswordPage'

// Protected Page imports
import { DashboardPage } from '../../pages/DashboardPage'
import { ReportsPage } from '../../pages/ReportsPage'
import { ReportDetailPage } from '../../pages/ReportDetailPage'
import { UploadPage } from '../../pages/UploadPage'
import { OrgSettingsPage } from '../../pages/OrgSettingsPage'
import { MembersPage } from '../../pages/MembersPage'
import { BillingPage } from '../../pages/BillingPage'
import { ProfilePage } from '../../pages/ProfilePage'
import { OnboardingPage } from '../../pages/OnboardingPage'

// Force authorization and workspace tenants
function ProtectedRoute({ children }) {
  const { session, loading } = useAuthStore()
  const { organizations } = useOrgStore()

  if (loading) return null

  if (!session) {
    return <Navigate to="/login" replace />
  }

  const hasOrgs = organizations && organizations.length > 0
  const isOnboardingRoute = window.location.pathname === '/onboarding'

  if (!hasOrgs && !isOnboardingRoute) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}

// Intercept logged in accounts attempting public screens
function PublicRoute({ children }) {
  const { session } = useAuthStore()

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
        path="/reports/:id"
        element={
          <ProtectedRoute>
            <ReportDetailPage />
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

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
export default AppRouter
