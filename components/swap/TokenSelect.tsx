import { ChevronDownIcon } from '@heroicons/react/20/solid'
import useMangoGroup from 'hooks/useMangoGroup'
import { Bank } from '@blockworks-foundation/mango-v4'
import { Dispatch, SetStateAction } from 'react'
import { formatTokenSymbol } from 'utils/tokens'
import TokenLogo from '@components/shared/TokenLogo'
import { SwapFormTokenListType } from './SwapFormTokenList'
import useMangoAccount from 'hooks/useMangoAccount'

type TokenSelectProps = {
  bank: Bank | undefined
  showTokenList: Dispatch<SetStateAction<SwapFormTokenListType>>
  type: SwapFormTokenListType
}

const TokenSelect = ({ bank, showTokenList, type }: TokenSelectProps) => {
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()

  if (!group) return null

  let posType = ''
  if (type === 'reduce-input' && mangoAccount && bank) {
    const uiPos = mangoAccount.getTokenBalanceUi(bank)
    if (uiPos > 0) {
      posType = 'long'
    } else if (uiPos < 0) {
      posType = 'short'
    }
  }

  return (
    <button
      onClick={() => showTokenList(type)}
      className="flex h-[56px] w-full items-center rounded-lg rounded-r-none bg-th-input-bkg px-3 py-2 text-th-fgd-2 focus-visible:bg-th-bkg-3 md:hover:cursor-pointer md:hover:bg-th-bkg-1 md:hover:text-th-fgd-1"
    >
      <div className="mr-2.5 flex min-w-[24px] items-center">
        <TokenLogo bank={bank} />
      </div>
      <div className="flex w-full items-center justify-between">
        <div className="text-xl font-bold text-th-fgd-1">
          {formatTokenSymbol(bank!.name)} {posType}
        </div>
        <ChevronDownIcon className="h-6 w-6" />
      </div>
    </button>
  )
}

export default TokenSelect
