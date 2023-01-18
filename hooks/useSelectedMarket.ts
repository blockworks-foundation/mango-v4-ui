import { Serum3Market } from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import useJupiterMints from './useJupiterMints'
import useMangoGroup from './useMangoGroup'

export default function useSelectedMarket() {
  const { group } = useMangoGroup()
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const { mangoTokens } = useJupiterMints()

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

  const serumOrPerpMarket = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return

    if (selectedMarket instanceof Serum3Market) {
      return group?.getSerum3ExternalMarket(selectedMarket.serumMarketExternal)
    } else {
      return selectedMarket
    }
  }, [selectedMarket])

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split(/-|\//)[0]
  }, [selectedMarket])

  const baseLogoURI = useMemo(() => {
    if (!baseSymbol || !mangoTokens.length) return ''
    const token =
      mangoTokens.find((t) => t.symbol === baseSymbol) ||
      mangoTokens.find((t) => t.symbol?.includes(baseSymbol))
    if (token) {
      return token.logoURI
    }
    return ''
  }, [baseSymbol, mangoTokens])

  const quoteBank = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return
    const tokenIdx =
      selectedMarket instanceof Serum3Market
        ? selectedMarket.quoteTokenIndex
        : selectedMarket?.settleTokenIndex
    return group?.getFirstBankByTokenIndex(tokenIdx)
  }, [selectedMarket])

  const quoteSymbol = useMemo(() => {
    return quoteBank?.name
  }, [quoteBank])

  const quoteLogoURI = useMemo(() => {
    if (!quoteSymbol || !mangoTokens.length) return ''
    const token = mangoTokens.find((t) => t.symbol === quoteSymbol)
    if (token) {
      return token.logoURI
    }
    return ''
  }, [quoteSymbol, mangoTokens])

  return {
    selectedMarket,
    price,
    serumOrPerpMarket,
    baseSymbol,
    quoteBank,
    quoteSymbol,
    baseLogoURI,
    quoteLogoURI,
  }
}
