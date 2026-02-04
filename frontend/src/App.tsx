import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { connectWebSocket, disconnectWebSocket } from './lib/websocket'
import HomePage from './features/home/HomePage'
import ProjectPage from './features/project/ProjectPage'
import SchemaEditor from './features/schema/SchemaEditor'
import Header from './components/Header'

function App() {
  useEffect(() => {
    // Connect WebSocket
    connectWebSocket()

    return () => {
      disconnectWebSocket()
    }
  }, [])

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/project/:projectId" element={<ProjectPage />} />
            <Route path="/schema/:projectId/:schemaId" element={<SchemaEditor />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
