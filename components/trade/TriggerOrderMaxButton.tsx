import { PerpMarket } from '@blockworks-foundation/mango-v4'
import MaxAmountButton from '@components/shared/MaxAmountButton'
import { FadeInFadeOut } from '@components/shared/Transitions'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo } from 'react'
import { floorToDecimal } from 'utils/numbers'

const TriggerOrderMaxButton = ({
  minOrderDecimals,
  tickDecimals,
  large,
}: {
  minOrderDecimals: number
  tickDecimals: number
  large?: boolean
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { selectedMarket } = useSelectedMarket()
  const { price, side } = mangoStore((s) => s.tradeForm)
  const { isUnownedAccount } = useUnownedAccount()
  const { connected } = useWallet()

  const positionBank = useMemo(() => {
    const { group } = mangoStore.getState()
    if (!group || !selectedMarket || selectedMarket instanceof PerpMarket)
      return
    const bank = group.getFirstBankByTokenIndex(selectedMarket.baseTokenIndex)
    return bank
  }, [selectedMarket])

  const max = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!positionBank || !mangoAccount) return 0
    let max = 0
    const balance = mangoAccount.getTokenBalanceUi(positionBank)
    const roundedBalance = floorToDecimal(balance, minOrderDecimals).toNumber()
    if (side === 'buy') {
      max = roundedBalance < 0 ? roundedBalance : 0
    } else {
      max = roundedBalance > 0 ? roundedBalance : 0
    }
    return max
  }, [positionBank, side, minOrderDecimals])

  const handleMax = useCallback(() => {
    const set = mangoStore.getState().set
    const baseSize = floorToDecimal(Math.abs(max), minOrderDecimals)
    const quoteSize = price
      ? floorToDecimal(baseSize.mul(price), tickDecimals)
      : 0
    set((state) => {
      state.tradeForm.baseSize = baseSize.toFixed()
      state.tradeForm.quoteSize = quoteSize.toFixed()
    })
  }, [minOrderDecimals, price, tickDecimals])

  return (
    <FadeInFadeOut show={!!price && !isUnownedAccount && connected}>
      <MaxAmountButton
        className={large ? 'text-sm' : 'text-xs'}
        decimals={minOrderDecimals}
        label={t('trade:position')}
        onClick={handleMax}
        value={max}
      />
    </FadeInFadeOut>
  )
}

export default TriggerOrderMaxButton
