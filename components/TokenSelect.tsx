import { ChevronDownIcon } from '@heroicons/react/solid'
import Image from 'next/image'
import mangoStore from '../store/state'

type TokenSelectProps = {
  token: string
  showTokenList: (x: any) => void
  type: 'input' | 'output'
}

const TokenSelect = ({ token, showTokenList, type }: TokenSelectProps) => {
  const group = mangoStore((s) => s.group)

  if (!group) return null

  return (
    <div
      onClick={() => showTokenList(type)}
      className="default-transition flex h-full items-center rounded-lg rounded-r-none p-3 text-th-fgd-2 hover:cursor-pointer hover:bg-th-bkg-2 hover:text-th-fgd-1"
      role="button"
    >
      <div className="mr-2.5 flex min-w-[24px] items-center">
        <Image
          alt=""
          width="24"
          height="24"
          src={`/icons/${token.toLowerCase()}.svg`}
        />
      </div>
      <div className="flex w-full items-center justify-between">
        <div className="text-xl font-bold">{token}</div>
        <ChevronDownIcon className="h-6 w-6" />
      </div>
    </div>
  )
}

export default TokenSelect
