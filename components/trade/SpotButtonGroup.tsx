import ButtonGroup from '@components/forms/ButtonGroup'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useState } from 'react'
import { trimDecimals } from 'utils/numbers'
import { useSpotMarketMax } from './SpotSlider'

const SpotButtonGroup = ({
  minOrderDecimals,
  tickDecimals,
  useMargin,
}: {
  minOrderDecimals: number
  tickDecimals: number
  useMargin: boolean
}) => {
  const side = mangoStore((s) => s.tradeForm.side)
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccount } = useMangoAccount()
  const [sizePercentage, setSizePercentage] = useState('')
  const max = useSpotMarketMax(mangoAccount, selectedMarket, side, useMargin)

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      const set = mangoStore.getState().set
      setSizePercentage(percentage)
      const size = max * (Number(percentage) / 100)

      set((s) => {
        if (s.tradeForm.side === 'buy') {
          s.tradeForm.quoteSize = trimDecimals(size, tickDecimals).toFixed(
            tickDecimals
          )

          if (Number(s.tradeForm.price)) {
            s.tradeForm.baseSize = trimDecimals(
              size / Number(s.tradeForm.price),
              minOrderDecimals
            ).toFixed(minOrderDecimals)
          } else {
            s.tradeForm.baseSize = ''
          }
        } else if (s.tradeForm.side === 'sell') {
          s.tradeForm.baseSize = trimDecimals(size, tickDecimals).toFixed(
            minOrderDecimals
          )

          if (Number(s.tradeForm.price)) {
            s.tradeForm.quoteSize = trimDecimals(
              size * Number(s.tradeForm.price),
              tickDecimals
            ).toFixed(tickDecimals)
          }
        }
      })
    },
    [minOrderDecimals, tickDecimals, max]
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
