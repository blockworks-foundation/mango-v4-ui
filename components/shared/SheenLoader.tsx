import { ReactNode } from 'react'

// Children should be a shape or set of shapes with a bg color to animate over

const SheenLoader = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex items-center justify-center">
      <div className="w-full">
        <div className="relative overflow-hidden rounded-lg before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-th-bkg-4 before:to-transparent">
          {children}
        </div>
      </div>
    </div>
  )
}

export default SheenLoader
