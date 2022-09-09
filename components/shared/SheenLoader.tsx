import { useTheme } from 'next-themes'
import { ReactNode } from 'react'

// Children should be a shape or set of shapes with a bg color to animate over

const SheenLoader = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  const { theme } = useTheme()
  return (
    <div className="flex items-center">
      <div
        className={`relative ${className} overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_4s_infinite] before:bg-gradient-to-r before:from-transparent ${
          theme === 'Light'
            ? 'before:via-[rgba(0,0,0,0.1)]'
            : 'before:via-[rgba(255,255,255,0.1)]'
        } before:to-transparent`}
      >
        {children}
      </div>
    </div>
  )
}

export default SheenLoader
