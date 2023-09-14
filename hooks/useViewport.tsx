import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import { breakpoints } from 'utils/theme'

export const useViewport = () => {
  const width = mangoStore((s) => s.window.width)
  const height = mangoStore((s) => s.window.height)

  const [isMobile, isTablet, isDesktop] = useMemo(() => {
    if (!width) return [false, false, false]
    const mobile = width < breakpoints.sm
    const tablet = width >= breakpoints.sm && width < breakpoints.md
    const desktop = width >= breakpoints.md
    return [mobile, tablet, desktop]
  }, [width])

  return { width, height, isMobile, isTablet, isDesktop }
}
