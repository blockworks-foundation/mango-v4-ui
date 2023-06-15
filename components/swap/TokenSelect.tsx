import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import Image from 'next/legacy/image'
import useMangoGroup from 'hooks/useMangoGroup'
import useJupiterMints from 'hooks/useJupiterMints'
import { Bank } from '@blockworks-foundation/mango-v4'
import { Dispatch, SetStateAction } from 'react'
import { formatTokenSymbol } from 'utils/tokens'

type TokenSelectProps = {
  bank: Bank | undefined
  showTokenList: Dispatch<SetStateAction<'input' | 'output' | undefined>>
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
    )?.logoURI
  }

  return (
    <button
      onClick={() => showTokenList(type)}
      className="flex h-[54px] w-full items-center rounded-lg rounded-r-none bg-th-input-bkg py-2 px-3 text-th-fgd-2 focus-visible:bg-th-bkg-3 md:hover:cursor-pointer md:hover:bg-th-bkg-1 md:hover:text-th-fgd-1"
    >
      <div className="mr-2.5 flex min-w-[24px] items-center">
        {logoURI ? (
          <Image alt="" width="24" height="24" src={logoURI} />
        ) : (
          <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
        )}
      </div>
      <div className="flex w-full items-center justify-between">
        <div className="text-xl font-bold text-th-fgd-1">
          {formatTokenSymbol(bank!.name)}
        </div>
        <ChevronDownIcon className="h-6 w-6" />
      </div>
    </button>
  )
}

export default TokenSelect
