import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import Image from 'next/legacy/image'
import useMangoGroup from 'hooks/useMangoGroup'
import useJupiterMints from 'hooks/useJupiterMints'
import { Bank } from '@blockworks-foundation/mango-v4'

type TokenSelectProps = {
  bank: Bank | undefined
  showTokenList: (x: any) => void
  type: 'input' | 'output'
}

const TokenSelect = ({ bank, showTokenList, type }: TokenSelectProps) => {
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()

  if (!group) return null

  let logoURI
  if (mangoTokens.length) {
    logoURI = mangoTokens.find(
      (t) => t.address === bank?.mint.toString()
    )!.logoURI
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
        <div className="text-xl font-bold text-th-fgd-1">{bank?.name}</div>
        <ChevronDownIcon className="h-6 w-6" />
      </div>
    </div>
  )
}

export default TokenSelect
