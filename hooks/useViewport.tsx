import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import { breakpoints } from 'utils/theme'

export const useViewport = () => {
  const width = mangoStore((s) => s.window.width)
  const height = mangoStore((s) => s.window.height)

  const isMobile = useMemo(() => {
    return width ? width < breakpoints.sm : false
  }, [width])

  return { width, height, isMobile }
}
