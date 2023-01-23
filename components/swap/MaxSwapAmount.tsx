import MaxAmountButton from '@components/shared/MaxAmountButton'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import { floorToDecimal } from 'utils/numbers'
import { useTokenMax } from './useTokenMax'

const MaxSwapAmount = ({
  setAmountIn,
  useMargin,
}: {
  setAmountIn: (x: string) => void
  useMargin: boolean
}) => {
  const { t } = useTranslation('common')
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const { mangoAccount } = useMangoAccount()
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const {
    amount: tokenMax,
    amountWithBorrow,
    decimals,
  } = useTokenMax(useMargin)

  const tokenBalance = useMemo(() => {
    if (!inputBank || !mangoAccount) return '0'
    const balance = mangoAccount.getTokenBalanceUi(inputBank)
    return balance > 0
      ? floorToDecimal(balance, inputBank.mintDecimals).toFixed()
      : '0'
  }, [inputBank])

  const maxBalance = floorToDecimal(tokenMax.toNumber(), decimals).toFixed()
  const maxWithBorrow = floorToDecimal(amountWithBorrow, decimals).toFixed()
  const max = useMargin ? maxWithBorrow : maxBalance

  if (mangoAccountLoading) return null

  return (
    <div className="flex flex-wrap justify-end pl-6 text-xs">
      {Number(tokenBalance) < Number(max) ? (
        <MaxAmountButton
          className="mb-0.5"
          label={t('bal')}
          onClick={() => setAmountIn(tokenBalance)}
          value={tokenBalance}
        />
      ) : null}
      <MaxAmountButton
        className="mb-0.5 ml-2"
        label={t('max')}
        onClick={() => setAmountIn(max)}
        value={max}
      />
    </div>
  )
}

export default MaxSwapAmount
