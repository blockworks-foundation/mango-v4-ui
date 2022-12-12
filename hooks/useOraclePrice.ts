import { Serum3Market } from '@blockworks-foundation/mango-v4'
import { getDecimalCount } from 'utils/numbers'
import useMangoGroup from './useMangoGroup'
import useSelectedMarket from './useSelectedMarket'

export default function useOraclePrice() {
  const { group } = useMangoGroup()
  const { selectedMarket } = useSelectedMarket()

  if (!group || !selectedMarket) return false

  let price
  let market
  if (selectedMarket instanceof Serum3Market) {
    price = group.getFirstBankByTokenIndex(
      selectedMarket?.baseTokenIndex
    ).uiPrice
    market = group.getSerum3ExternalMarket(selectedMarket.serumMarketExternal)
  } else {
    price = selectedMarket.uiPrice
    market = selectedMarket
  }
  return price && market ? price.toFixed(getDecimalCount(market.tickSize)) : ''
}
