import { Users } from 'lucide-react'
import { CollaborationUser } from '../lib/store'

interface ActiveUsersProps {
  users: CollaborationUser[]
  maxDisplay?: number
}

// Generate consistent colors for users based on their ID
const userColors = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-rose-500',
]

function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return userColors[Math.abs(hash) % userColors.length]
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function ActiveUsers({ users, maxDisplay = 3 }: ActiveUsersProps) {
  const displayUsers = users.slice(0, maxDisplay)
  const remainingCount = Math.max(0, users.length - maxDisplay)

  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Users className="w-4 h-4" />
        <span className="text-sm">No other users</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <div
            key={user.id}
            title={user.name}
            className={`w-8 h-8 rounded-full ${user.color || getUserColor(user.id)} border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium shadow-sm`}
          >
            {getInitials(user.name)}
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white dark:border-gray-800 flex items-center justify-center text-white text-xs font-medium shadow-sm"
            title={`${remainingCount} more user${remainingCount !== 1 ? 's' : ''}`}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {users.length} user{users.length !== 1 ? 's' : ''} online
      </span>
    </div>
  )
}

export default ActiveUsers
