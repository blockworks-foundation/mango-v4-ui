import { IconButton } from '@components/shared/Button'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { useIsWhiteListed } from 'hooks/useIsWhiteListed'
import Link from 'next/link'
import { useState } from 'react'

const PromoBanner = () => {
  const [showBanner, setShowBanner] = useState(true)
  const { data: isWhiteListed } = useIsWhiteListed()
  return isWhiteListed && showBanner ? (
    <div className="relative">
      <div className="flex flex-wrap items-center justify-center border-b border-th-bkg-3 bg-th-bkg-2 px-10 py-3">
        <p className="mr-2  text-center text-th-fgd-1 lg:text-base">
          Season 1 of Mango Mints is starting soon.
        </p>
        <Link
          className="bg-gradient-to-b from-mango-classic-theme-active to-mango-classic-theme-down bg-clip-text font-bold text-transparent lg:text-base"
          href="/rewards"
        >
          Get Ready
        </Link>
      </div>
      <IconButton
        className="absolute right-0 top-1/2 -translate-y-1/2 sm:right-2"
        hideBg
        onClick={() => setShowBanner(false)}
        size="medium"
      >
        <XMarkIcon className="h-5 w-5 text-th-fgd-3" />
      </IconButton>
    </div>
  ) : null
}

export default PromoBanner
