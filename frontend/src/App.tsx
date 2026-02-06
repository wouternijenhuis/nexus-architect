import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { connectWebSocket, disconnectWebSocket } from './lib/websocket'
import { useAuthStore } from './lib/store'
import HomePage from './features/home/HomePage'
import ProjectPage from './features/project/ProjectPage'
import SchemaEditor from './features/schema/SchemaEditor'
import LoginPage from './features/auth/LoginPage'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    // Only connect WebSocket when authenticated
    if (isAuthenticated) {
      connectWebSocket()
    }

    return () => {
      disconnectWebSocket()
    }
  }, [isAuthenticated])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <>
                  <Header />
                  <main className="container mx-auto px-4 py-8">
                    <Routes>
                      <Route path="/" element={<HomePage />} />
                      <Route path="/project/:projectId" element={<ProjectPage />} />
                      <Route path="/schema/:projectId/:schemaId" element={<SchemaEditor />} />
                    </Routes>
                  </main>
                </>
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
