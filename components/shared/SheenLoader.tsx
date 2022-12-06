import { ReactNode } from 'react'

// Children should be a shape or set of shapes with a bg color to animate over

const SheenLoader = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => {
  return (
    <div className="flex items-center">
      <div
        className={`relative rounded-md ${className} overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_4s_infinite] before:bg-gradient-to-r before:from-transparent before:via-th-bkg-4 before:to-transparent before:opacity-50`}
      >
        {children}
      </div>
    </div>
  )
}

export default SheenLoader
