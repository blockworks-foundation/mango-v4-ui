import { ChevronDownIcon } from '@heroicons/react/20/solid'
import Image from 'next/image'
import { formatTokenSymbol } from 'utils/tokens'

const TokenListButton = ({
  logoUri,
  token,
  setShowList,
}: {
  logoUri: string | undefined
  token: string
  setShowList: (x: boolean) => void
}) => {
  return (
    <button
      onClick={() => setShowList(true)}
      className="flex h-full w-full items-center rounded-lg rounded-r-none border border-th-input-border bg-th-input-bkg py-2 px-3 text-th-fgd-2 hover:cursor-pointer hover:bg-th-bkg-2 hover:text-th-fgd-1 focus-visible:border-th-fgd-4"
    >
      <div className="mr-2.5 flex min-w-[24px] items-center">
        <Image
          alt=""
          width="24"
          height="24"
          src={logoUri || `/icons/${token.toLowerCase()}.svg`}
        />
      </div>
      <div className="flex w-full items-center justify-between">
        <div className="text-xl font-bold">{formatTokenSymbol(token)}</div>
        <ChevronDownIcon className="h-6 w-6" />
      </div>
    </button>
  )
}

export default TokenListButton
