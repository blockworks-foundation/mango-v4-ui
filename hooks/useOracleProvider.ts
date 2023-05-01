import {
  Bank,
  OracleProvider,
  PerpMarket,
} from '@blockworks-foundation/mango-v4'
import { useMemo } from 'react'
import { formatTokenSymbol } from 'utils/tokens'
import useMangoGroup from './useMangoGroup'
import useSelectedMarket from './useSelectedMarket'

const useOracleProvider = () => {
  const { selectedMarket } = useSelectedMarket()
  const { group } = useMangoGroup()

  const [oracleProvider, oracleLinkPath] = useMemo(() => {
    if (!group || !selectedMarket) return ['', '']
    let marketOrBank: PerpMarket | Bank
    let name: string
    if (selectedMarket instanceof PerpMarket) {
      marketOrBank = selectedMarket
      name = selectedMarket.name.split('-')[0]
    } else {
      const baseBank = group.getFirstBankByTokenIndex(
        selectedMarket.baseTokenIndex
      )
      marketOrBank = baseBank
      name = formatTokenSymbol(baseBank.name)
    }

    switch (marketOrBank.oracleProvider) {
      case OracleProvider.Pyth:
        return [
          'Pyth',
          `https://pyth.network/price-feeds/crypto-${name.toLowerCase()}-usd`,
        ]
      case OracleProvider.Switchboard:
        return [
          'Switchboard',
          `https://switchboard.xyz/explorer/3/${marketOrBank.oracle.toString()}`,
        ]
      case OracleProvider.Stub:
        return ['Stub', '']
      default:
        return ['Unknown', '']
    }
  }, [group, selectedMarket])

  return { oracleProvider, oracleLinkPath }
}

export default useOracleProvider
