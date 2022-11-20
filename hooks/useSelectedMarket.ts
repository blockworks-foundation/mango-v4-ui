import { Serum3Market } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useMangoGroup from './useMangoGroup'

export default function useSelectedMarket() {
  const { group } = useMangoGroup()
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)

  const price: number = useMemo(() => {
    if (!group) return 0
    if (selectedMarket instanceof Serum3Market) {
      const baseBank = group.getFirstBankByTokenIndex(
        selectedMarket.baseTokenIndex
      )

      return baseBank.uiPrice
    } else if (selectedMarket) {
      return selectedMarket._uiPrice
    } else return 0
  }, [selectedMarket, group])

  return { selectedMarket, price }
}
