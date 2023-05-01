import {
  Bank,
  Group,
  OracleProvider,
  PerpMarket,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import { useMemo } from 'react'
import { formatTokenSymbol } from 'utils/tokens'
import useMangoGroup from './useMangoGroup'
import useSelectedMarket from './useSelectedMarket'

export const getOracleProvider = (
  marketOrBank: PerpMarket | Serum3Market | Bank,
  group: Group
) => {
  let marketOrBase: PerpMarket | Bank
  let name: string
  if (marketOrBank instanceof Bank) {
    marketOrBase = marketOrBank
    name = formatTokenSymbol(marketOrBank.name)
  } else if (marketOrBank instanceof PerpMarket) {
    marketOrBase = marketOrBank
    name = marketOrBank.name.split('-')[0]
  } else {
    const baseBank = group.getFirstBankByTokenIndex(marketOrBank.baseTokenIndex)
    marketOrBase = baseBank
    name = formatTokenSymbol(baseBank.name)
  }

  if (name === 'USDC') return ['N/A', '']

  switch (marketOrBase.oracleProvider) {
    case OracleProvider.Pyth:
      return [
        'Pyth',
        `https://pyth.network/price-feeds/crypto-${name.toLowerCase()}-usd`,
      ]
    case OracleProvider.Switchboard:
      return [
        'Switchboard',
        `https://switchboard.xyz/explorer/3/${marketOrBase.oracle.toString()}`,
      ]
    case OracleProvider.Stub:
      return ['Stub', '']
    default:
      return ['Unknown', '']
  }
}

const useOracleProvider = () => {
  const { selectedMarket } = useSelectedMarket()
  const { group } = useMangoGroup()

  const [oracleProvider, oracleLinkPath] = useMemo(() => {
    if (!group || !selectedMarket) return ['', '']
    return getOracleProvider(selectedMarket, group)
  }, [group, selectedMarket])

  return { oracleProvider, oracleLinkPath }
}

export default useOracleProvider
