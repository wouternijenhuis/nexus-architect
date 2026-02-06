import { Wifi, WifiOff } from 'lucide-react'

interface ConnectionStatusProps {
  isConnected: boolean
  showLabel?: boolean
}

export function ConnectionStatus({ isConnected, showLabel = true }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2" title={isConnected ? 'Connected' : 'Disconnected'}>
      <div className="relative flex items-center justify-center">
        {isConnected ? (
          <>
            <span className="absolute w-3 h-3 bg-green-400 rounded-full animate-ping opacity-75" />
            <span className="relative w-3 h-3 bg-green-500 rounded-full" />
          </>
        ) : (
          <span className="relative w-3 h-3 bg-red-500 rounded-full" />
        )}
      </div>
      {showLabel && (
        <div className="flex items-center gap-1 text-sm">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-600 dark:text-red-400">Disconnected</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default ConnectionStatus
