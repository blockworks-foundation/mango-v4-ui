import { Serum3Market } from '@blockworks-foundation/mango-v4'
import ButtonGroup from '@components/forms/ButtonGroup'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useCallback, useMemo, useState } from 'react'
// import { notify } from 'utils/notifications'

const SpotButtonGroup = () => {
  const side = mangoStore((s) => s.tradeForm.side)
  const { selectedMarket } = useSelectedMarket()
  const { mangoAccount } = useMangoAccount()
  const [sizePercentage, setSizePercentage] = useState('')

  const leverageMax = useMemo(() => {
    const group = mangoStore.getState().group
    if (!mangoAccount || !group || !selectedMarket) return 100
    if (!(selectedMarket instanceof Serum3Market)) return 100

    try {
      if (side === 'buy') {
        return mangoAccount.getMaxQuoteForSerum3BidUi(
          group,
          selectedMarket.serumMarketExternal
        )
      } else {
        return mangoAccount.getMaxBaseForSerum3AskUi(
          group,
          selectedMarket.serumMarketExternal
        )
      }
    } catch (e) {
      console.error('Error calculating max leverage: spot btn group: ', e)
      // notify({
      //   type: 'error',
      //   title: 'Error calculating max leverage.',
      // })
      return 0
    }
  }, [side, selectedMarket, mangoAccount])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      const set = mangoStore.getState().set
      setSizePercentage(percentage)
      const size = leverageMax * (Number(percentage) / 100)

      set((s) => {
        if (s.tradeForm.side === 'buy') {
          s.tradeForm.quoteSize = size.toString()

          if (Number(s.tradeForm.price)) {
            s.tradeForm.baseSize = (size / Number(s.tradeForm.price)).toString()
          } else {
            s.tradeForm.baseSize = ''
          }
        } else if (s.tradeForm.side === 'sell') {
          s.tradeForm.baseSize = size.toString()

          if (Number(s.tradeForm.price)) {
            s.tradeForm.quoteSize = (
              size * Number(s.tradeForm.price)
            ).toString()
          }
        }
      })
    },
    [side, selectedMarket, mangoAccount]
  )

  return (
    <div className="w-full px-4">
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
