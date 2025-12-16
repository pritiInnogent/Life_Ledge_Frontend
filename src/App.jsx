

import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

import HomePage from './pages/Homepage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardLayout from './components/DashboardLayout'


import TransactionsPage from './pages/TransactionsPage'
import DashboardPage from './pages/DashboardPage'
import CategoriesPage from './pages/CategoriesPage'
import RecurringPage from './pages/RecurringPage'
import GoalsPage from './pages/GoalsPage'
import InsightsPage from './pages/InsightsPage'
import ImportPage from './pages/ImportPage'

import ProfilePage from './pages/ProfilePage'

import { useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading, checkingTransactions, checkTransactionsAndRedirect } = useAuth()
  const [redirectPath, setRedirectPath] = React.useState(null)
  const [initialCheck, setInitialCheck] = React.useState(false)
  
  React.useEffect(() => {
    if (user && !initialCheck) {
      setInitialCheck(true)
      checkTransactionsAndRedirect().then(path => {
        if (path) setRedirectPath(path)
      })
    }
  }, [user, initialCheck, checkTransactionsAndRedirect])
  
  if (loading || (user && checkingTransactions && !initialCheck)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (redirectPath && window.location.pathname === '/app') {
    return <Navigate to={redirectPath} replace />
  }
  
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* PROTECTED (SIDEBAR) ROUTES */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="import" element={<ImportPage />} />

          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
