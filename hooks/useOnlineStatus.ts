import { useEffect, useState } from 'react'

const useOnlineStatus = () => {
  const [online, isOnline] = useState(navigator.onLine)

  const setOnline = () => {
    isOnline(true)
  }
  const setOffline = () => {
    isOnline(false)
  }

  // Register the event listeners
  useEffect(() => {
    window.addEventListener('offline', setOffline)
    window.addEventListener('online', setOnline)

    // cleanup if we unmount
    return () => {
      window.removeEventListener('offline', setOffline)
      window.removeEventListener('online', setOnline)
    }
  }, [])

  return online
}

export default useOnlineStatus
