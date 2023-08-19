import { useCallback, useEffect, useState } from 'react'

export const useViewport = () => {
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)

  const handleWindowResize = useCallback(() => {
    if (typeof window !== 'undefined') {
      setWidth(window.innerWidth)
      setHeight(window.innerHeight)
    }
  }, [])

  useEffect(() => {
    handleWindowResize()
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  return { width, height }
}
