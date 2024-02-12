import {
  PerpMarket,
  Serum3Market,
  OpenbookV2Market,
} from '@blockworks-foundation/mango-v4'
import mangoStore from '@store/mangoStore'
import { useMemo } from 'react'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import useJupiterMints from './useJupiterMints'
import useMangoGroup from './useMangoGroup'
import { CUSTOM_TOKEN_ICONS } from 'utils/constants'
import BigNumber from 'bignumber.js'
import { MarketAccount } from '@openbook-dex/openbook-v2'

export default function useSelectedMarket() {
  const { group } = useMangoGroup()
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const { mangoTokens } = useJupiterMints()

  const marketAddress = useMemo(() => {
    return selectedMarket?.publicKey.toString()
  }, [selectedMarket])

  const price: number = useMemo(() => {
    if (!group) return 0
    if (selectedMarket instanceof Serum3Market) {
      const baseBank = group.getFirstBankByTokenIndex(
        selectedMarket.baseTokenIndex,
      )
      const quoteBank = group.getFirstBankByTokenIndex(
        selectedMarket.quoteTokenIndex,
      )
      const market = group.getSerum3ExternalMarket(
        selectedMarket.serumMarketExternal,
      )

      return floorToDecimal(
        baseBank.uiPrice / quoteBank.uiPrice,
        getDecimalCount(market.tickSize),
      ).toNumber()
    } else if (selectedMarket instanceof PerpMarket) {
      return selectedMarket._uiPrice
    } else if (selectedMarket instanceof OpenbookV2Market) {
      // TODO-OB2
      const baseBank = group.getFirstBankByTokenIndex(
        selectedMarket.baseTokenIndex,
      )
      const quoteBank = group.getFirstBankByTokenIndex(
        selectedMarket.quoteTokenIndex,
      )
      const market = group.getOpenbookV2ExternalMarket(
        selectedMarket.openbookMarketExternal,
      )
      const tickSize = new BigNumber(10)
        .pow(market.baseDecimals - market.quoteDecimals)
        .times(new BigNumber(market.quoteLotSize.toString()))
        .div(new BigNumber(market.baseLotSize.toString()))
        .toNumber()
      return floorToDecimal(
        baseBank.uiPrice / quoteBank.uiPrice,
        getDecimalCount(tickSize),
      ).toNumber()
      // return 2
    } else return 0
  }, [selectedMarket, group])

  const serumOrPerpMarket = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return

    if (selectedMarket instanceof Serum3Market) {
      return group?.getSerum3ExternalMarket(selectedMarket.serumMarketExternal)
    } else if (selectedMarket instanceof OpenbookV2Market) {
      return group?.getOpenbookV2ExternalMarket(
        selectedMarket.openbookMarketExternal,
      ) as MarketAccount
    } else {
      return selectedMarket
    }
  }, [selectedMarket])

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split(/-|\//)[0]
  }, [selectedMarket])

  const baseLogoURI = useMemo(() => {
    if (!baseSymbol || !mangoTokens.length) return ''
    const lowerCaseBaseSymbol = baseSymbol.toLowerCase()
    const hasCustomIcon = CUSTOM_TOKEN_ICONS[lowerCaseBaseSymbol]
    if (hasCustomIcon) {
      return `/icons/${lowerCaseBaseSymbol}.svg`
    } else {
      const token =
        mangoTokens.find(
          (t) => t.symbol.toLowerCase() === lowerCaseBaseSymbol,
        ) ||
        mangoTokens.find(
          (t) => t.symbol.toLowerCase()?.includes(lowerCaseBaseSymbol),
        )
      if (token) {
        return token.logoURI
      }
    }
  }, [baseSymbol, mangoTokens])

  const quoteBank = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group || !selectedMarket) return
    const tokenIdx =
      selectedMarket instanceof PerpMarket
        ? selectedMarket?.settleTokenIndex
        : selectedMarket.quoteTokenIndex
    return group?.getFirstBankByTokenIndex(tokenIdx)
  }, [selectedMarket])

  const quoteSymbol = useMemo(() => {
    return quoteBank?.name
  }, [quoteBank])

  const quoteLogoURI = useMemo(() => {
    if (!quoteSymbol || !mangoTokens.length) return ''
    const lowerCaseQuoteSymbol = quoteSymbol.toLowerCase()
    const hasCustomIcon = CUSTOM_TOKEN_ICONS[lowerCaseQuoteSymbol]
    if (hasCustomIcon) {
      return `/icons/${lowerCaseQuoteSymbol}.svg`
    } else {
      const token = mangoTokens.find(
        (t) => t.symbol.toLowerCase() === lowerCaseQuoteSymbol,
      )
      if (token) {
        return token.logoURI
      }
    }
  }, [quoteSymbol, mangoTokens])

  return {
    selectedMarket,
    selectedMarketAddress: marketAddress,
    price,
    serumOrPerpMarket,
    baseSymbol,
    quoteBank,
    quoteSymbol,
    baseLogoURI,
    quoteLogoURI,
    marketAddress,
  }
}
