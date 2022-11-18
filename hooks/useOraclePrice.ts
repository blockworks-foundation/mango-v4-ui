import { Serum3Market } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'

export default function useOraclePrice() {
  const group = mangoStore((s) => s.group)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)

  if (!group || !selectedMarket) return false

  let price
  if (selectedMarket instanceof Serum3Market) {
    price = group.getFirstBankByTokenIndex(
      selectedMarket?.baseTokenIndex
    ).uiPrice
  } else {
    price = selectedMarket.uiPrice
  }
  return price
}
