import {
  Bank,
  OracleProvider,
  PerpMarket,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import { formatTokenSymbol } from 'utils/tokens'
import useSelectedMarket from './useSelectedMarket'

export const getOracleProvider = (
  marketOrBank: PerpMarket | Serum3Market | Bank,
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
    const group = mangoStore.getState().group
    if (!group) return ['Unavailable', '']
    const baseBank = group.getFirstBankByTokenIndex(marketOrBank.baseTokenIndex)
    marketOrBase = baseBank
    name = formatTokenSymbol(baseBank.name)
  }

  if (name === 'USDC') return ['N/A', '']
  if (name === 'RENDER') {
    name = 'RNDR'
  }

  switch (marketOrBase.oracleProvider) {
    case OracleProvider.Pyth:
      return [
        'Pyth',
        `https://pyth.network/price-feeds/crypto-${name.toLowerCase()}-usd`,
      ]
    case OracleProvider.Switchboard:
      return [
        'Switchboard',
        `https://app.switchboard.xyz/solana/mainnet-beta/feed/${marketOrBase.oracle.toString()}`,
      ]
    case OracleProvider.Stub:
      return ['Stub', '']
    default:
      return ['Unknown', '']
  }
}

//will use selected market from mango store if no bank provided
const useOracleProvider = (bank?: Bank) => {
  const { selectedMarket } = useSelectedMarket()

  const [oracleProvider, oracleLinkPath] = useMemo(() => {
    if (!selectedMarket) return ['', '']
    return getOracleProvider(bank || selectedMarket)
  }, [selectedMarket, bank])

  return { oracleProvider, oracleLinkPath }
}

export default useOracleProvider
