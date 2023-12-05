import ButtonGroup from '@components/forms/ButtonGroup'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useState } from 'react'
import { floorToDecimal } from 'utils/numbers'
import { usePerpMarketMax } from './PerpSlider'

const PerpButtonGroup = ({
  minOrderDecimals,
  tickDecimals,
}: {
  minOrderDecimals: number
  tickDecimals: number
}) => {
  const side = mangoStore((s) => s.tradeForm.side)
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccount } = useMangoAccount()
  const [sizePercentage, setSizePercentage] = useState('')
  const perpMax = usePerpMarketMax(mangoAccount, selectedMarket, side)

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      const set = mangoStore.getState().set
      setSizePercentage(percentage)
      const size = perpMax * (Number(percentage) / 100)

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
          s.tradeForm.baseSize = floorToDecimal(
            size,
            minOrderDecimals,
          ).toString()

          if (Number(s.tradeForm.price)) {
            s.tradeForm.quoteSize = floorToDecimal(
              size * Number(s.tradeForm.price),
              tickDecimals,
            ).toString()
          }
        }
      })
    },
    [perpMax, minOrderDecimals, tickDecimals],
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

export default PerpButtonGroup
