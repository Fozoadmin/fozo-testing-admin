import { Navigate, Route, Routes } from "react-router-dom"
import { useState, useEffect } from "react"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  
  // Add a small delay to ensure localStorage is read before checking auth
  const [isReady, setIsReady] = useState(false)
  
  useEffect(() => {
    // Small delay to ensure AuthContext has initialized from localStorage
    const timer = setTimeout(() => setIsReady(true), 100)
    return () => clearTimeout(timer)
  }, [])
  
  if (!isReady) {
    return <div>Loading...</div> // Or a proper loading component
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </AuthProvider>
  )
}
