import LeverageSlider from '@components/swap/LeverageSlider'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import { useCallback, useMemo, useState } from 'react'

const SpotSlider = () => {
  const [amount, setAmount] = useState<string>()
  const side = mangoStore((s) => s.tradeForm.side)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)

  const leverageMax = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const group = mangoStore.getState().group
    const set = mangoStore.getState().set
    if (!mangoAccount || !group || !selectedMarket) return 100

    if (side === 'buy') {
      const maxQuote = mangoAccount.getMaxQuoteForSerum3BidUi(
        group,
        selectedMarket.serumMarketExternal
      )
      return new Decimal(maxQuote.toString()).toNumber()
    } else {
      const maxBase = mangoAccount.getMaxBaseForSerum3AskUi(
        group,
        selectedMarket.serumMarketExternal
      )

      return new Decimal(maxBase.toString()).toNumber()
    }
  }, [side, selectedMarket])

  const handleSlide = useCallback((val: string) => {
    const set = mangoStore.getState().set

    set((s) => {
      s.tradeForm.baseSize = val
    })
  }, [])

  return (
    <div className="w-full px-4">
      <LeverageSlider
        amount={0}
        leverageMax={leverageMax}
        onChange={handleSlide}
      />
    </div>
  )
}

export default SpotSlider
