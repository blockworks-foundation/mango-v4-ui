import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

const ViewportContext = createContext({
  width: 0,
  height: 0,
})

export function useViewport() {
  return useContext(ViewportContext)
}

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [dimensions, setDimensions] = useState({
    width: 0,
    height: 0,
  })

  const handleWindowResize = useCallback(() => {
    if (typeof window !== 'undefined') {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }
  }, [])

  useEffect(() => {
    handleWindowResize()
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  return (
    <ViewportContext.Provider value={dimensions}>
      {children}
    </ViewportContext.Provider>
  )
}
