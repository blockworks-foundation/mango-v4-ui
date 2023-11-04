import ButtonGroup from '@components/forms/ButtonGroup'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useMemo, useState } from 'react'
import { floorToDecimal } from 'utils/numbers'
import { useSpotMarketMax } from './SpotSlider'
import { PerpMarket } from '@blockworks-foundation/mango-v4'

const SpotButtonGroup = ({
  minOrderDecimals,
  tickDecimals,
  useMargin,
  isTriggerOrder,
}: {
  minOrderDecimals: number
  tickDecimals: number
  useMargin: boolean
  isTriggerOrder: boolean
}) => {
  const { side } = mangoStore((s) => s.tradeForm)
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccount } = useMangoAccount()
  const [sizePercentage, setSizePercentage] = useState('')
  const standardOrderMax = useSpotMarketMax(
    mangoAccount,
    selectedMarket,
    side,
    useMargin,
  )

  const max = useMemo(() => {
    if (!isTriggerOrder) return standardOrderMax
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const { group } = mangoStore.getState()
    if (
      !group ||
      !mangoAccount ||
      !selectedMarket ||
      selectedMarket instanceof PerpMarket
    )
      return 0
    const positionBank = group.getFirstBankByTokenIndex(
      selectedMarket.baseTokenIndex,
    )
    let max = 0
    const balance = mangoAccount.getTokenBalanceUi(positionBank)
    const roundedBalance = floorToDecimal(balance, minOrderDecimals).toNumber()
    if (side === 'buy') {
      max = roundedBalance < 0 ? roundedBalance : 0
    } else {
      max = roundedBalance > 0 ? roundedBalance : 0
    }
    return max
  }, [isTriggerOrder, selectedMarket, side, standardOrderMax])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      const set = mangoStore.getState().set
      setSizePercentage(percentage)
      const size = max * (Number(percentage) / 100)

      set((s) => {
        if (s.tradeForm.side === 'buy') {
          s.tradeForm.quoteSize = floorToDecimal(size, tickDecimals).toString()

          if (Number(s.tradeForm.price)) {
            s.tradeForm.baseSize = floorToDecimal(
              size / Number(s.tradeForm.price),
              minOrderDecimals,
            ).toString()
          } else {
            s.tradeForm.baseSize = ''
          }
        } else if (s.tradeForm.side === 'sell') {
          s.tradeForm.baseSize = floorToDecimal(size, tickDecimals).toString()

          if (Number(s.tradeForm.price)) {
            s.tradeForm.quoteSize = floorToDecimal(
              size * Number(s.tradeForm.price),
              tickDecimals,
            ).toString()
          }
        }
      })
    },
    [minOrderDecimals, tickDecimals, max],
  )

  return (
    <div className="w-full px-3 md:px-4">
      <ButtonGroup
        activeValue={sizePercentage}
        onChange={(p) => handleSizePercentage(p)}
        values={['25', '50', '75', '100']}
        unit="%"
      />
    </div>
  )
}

export default SpotButtonGroup
