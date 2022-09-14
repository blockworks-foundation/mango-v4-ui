import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import Image from 'next/image'
import mangoStore from '@store/mangoStore'

type TokenSelectProps = {
  tokenSymbol: string | undefined
  showTokenList: (x: any) => void
  type: 'input' | 'output'
}

const TokenSelect = ({
  tokenSymbol,
  showTokenList,
  type,
}: TokenSelectProps) => {
  const group = mangoStore((s) => s.group)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  if (!group) return null

  let logoURI
  if (jupiterTokens.length) {
    logoURI = jupiterTokens.find((t) => t.symbol === tokenSymbol)!.logoURI
  }

  return (
    <div
      onClick={() => showTokenList(type)}
      className="default-transition flex h-full items-center rounded-lg rounded-r-none p-3 text-th-fgd-2 hover:cursor-pointer hover:bg-th-bkg-2 hover:text-th-fgd-1"
      role="button"
    >
      <div className="mr-2.5 flex min-w-[24px] items-center">
        {logoURI ? (
          <Image alt="" width="24" height="24" src={logoURI} />
        ) : (
          <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
        )}
      </div>
      <div className="flex w-full items-center justify-between">
        <div className="text-xl font-bold text-th-fgd-1">{tokenSymbol}</div>
        <ChevronDownIcon className="h-6 w-6" />
      </div>
    </div>
  )
}

export default TokenSelect
