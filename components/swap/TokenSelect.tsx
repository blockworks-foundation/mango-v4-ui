import { ChevronDownIcon } from '@heroicons/react/20/solid'
import useMangoGroup from 'hooks/useMangoGroup'
import { Bank } from '@blockworks-foundation/mango-v4'
import { Dispatch, SetStateAction, useMemo } from 'react'
import { formatTokenSymbol } from 'utils/tokens'
import TokenLogo from '@components/shared/TokenLogo'
import { SwapFormTokenListType } from './SwapFormTokenList'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'react-i18next'

type TokenSelectProps = {
  bank: Bank | undefined
  showTokenList: Dispatch<SetStateAction<SwapFormTokenListType>>
  tokenType: SwapFormTokenListType
}

const TokenSelect = ({ bank, showTokenList, tokenType }: TokenSelectProps) => {
  const { t } = useTranslation('trade')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()

  const posType = useMemo(() => {
    if (!bank || !mangoAccount || tokenType !== 'reduce-input') return ''
    const uiPos = mangoAccount.getTokenBalanceUi(bank)
    if (uiPos > 0) {
      return 'long'
    } else if (uiPos < 0) {
      return 'short'
    }
  }, [bank, mangoAccount, tokenType])

  if (!group) return null

  return bank ? (
    <button
      onClick={() => showTokenList(tokenType)}
      className="flex h-[56px] w-full items-center rounded-lg rounded-r-none bg-th-input-bkg px-3 py-2 text-th-fgd-2 focus-visible:bg-th-bkg-3 md:hover:cursor-pointer md:hover:bg-th-bkg-1 md:hover:text-th-fgd-1"
    >
      <div className="mr-2.5 flex min-w-[24px] items-center">
        <TokenLogo bank={bank} />
      </div>
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center">
          <div className="text-lg font-bold text-th-fgd-1">
            {formatTokenSymbol(bank.name)}
          </div>
          {posType ? (
            <span
              className={`ml-2 inline-block rounded border px-1 text-xs uppercase ${
                posType === 'long'
                  ? 'border-th-up text-th-up'
                  : 'border-th-down text-th-down'
              }`}
            >
              {t(`trade:${posType}`)}
            </span>
          ) : null}
        </div>
        <ChevronDownIcon className="h-6 w-6" />
      </div>
    </button>
  ) : null
}

export default TokenSelect
