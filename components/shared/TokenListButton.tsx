import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { ReactNode } from 'react'
import { formatTokenSymbol } from 'utils/tokens'

const TokenListButton = ({
  logo,
  token,
  setShowList,
}: {
  logo: ReactNode
  token: string
  setShowList: (x: boolean) => void
}) => {
  return (
    <button
      onClick={() => setShowList(true)}
      className="flex h-full w-full items-center rounded-lg rounded-r-none border border-r-0 border-th-input-border bg-th-input-bkg px-3 py-2 text-th-fgd-2 focus-visible:bg-th-bkg-2 md:hover:cursor-pointer md:hover:bg-th-bkg-2 md:hover:text-th-fgd-1"
    >
      <div className="mr-2.5 flex min-w-[24px] items-center">{logo}</div>
      <div className="flex w-full items-center justify-between">
        <div className="text-xl font-bold">{formatTokenSymbol(token)}</div>
        <ChevronDownIcon className="h-6 w-6" />
      </div>
    </button>
  )
}

export default TokenListButton
