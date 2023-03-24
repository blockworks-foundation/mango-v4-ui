import {
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import Image from 'next/legacy/image'
import useMangoGroup from 'hooks/useMangoGroup'
import useJupiterMints from 'hooks/useJupiterMints'
import { Bank } from '@blockworks-foundation/mango-v4'
import { Dispatch, SetStateAction } from 'react'

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
      className="default-transition flex h-full w-full items-center rounded-lg rounded-r-none border border-th-input-border bg-th-input-bkg py-2 px-3 text-th-fgd-2 hover:cursor-pointer hover:bg-th-bkg-2 hover:text-th-fgd-1 focus:border-th-fgd-4 focus:ring-0"
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
    </button>
  )
}

export default TokenSelect
