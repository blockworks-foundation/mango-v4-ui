import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

type ViewportContextProps = {
  width: number
  height: number
}

const ViewportContext = createContext({} as ViewportContextProps)

export const ViewportProvider = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false)
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

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <ViewportContext.Provider value={{ width, height }}>
      {children}
    </ViewportContext.Provider>
  )
}

export const useViewport = () => {
  const { width, height } = useContext(ViewportContext)
  return { width, height }
}
