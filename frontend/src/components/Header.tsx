import { Link } from 'react-router-dom'
import { FileCode2 } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <FileCode2 className="w-8 h-8 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nexus Architect
            </h1>
          </Link>
          <nav className="flex space-x-4">
            <Link
              to="/"
              className="text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400"
            >
              Projects
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
