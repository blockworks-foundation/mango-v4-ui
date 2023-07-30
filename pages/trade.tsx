import {
  Group,
  PerpMarket,
  Serum3Market,
} from '@blockworks-foundation/mango-v4'
import TradeAdvancedPage from '@components/trade/TradeAdvancedPage'
import mangoStore, { DEFAULT_TRADE_FORM } from '@store/mangoStore'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'common',
        'notifications',
        'onboarding',
        'onboarding-tours',
        'trade',
        'close-account',
        'tv-chart',
        'swap',
      ])),
    },
  }
}

const getOraclePriceForMarket = (
  group: Group,
  mkt: Serum3Market | PerpMarket,
): number => {
  let price: number
  if (mkt instanceof Serum3Market) {
    const baseBank = group.getFirstBankByTokenIndex(mkt.baseTokenIndex)
    const quoteBank = group.getFirstBankByTokenIndex(mkt.quoteTokenIndex)
    const market = group.getSerum3ExternalMarket(mkt.serumMarketExternal)
    price = floorToDecimal(
      baseBank.uiPrice / quoteBank.uiPrice,
      getDecimalCount(market.tickSize),
    ).toNumber()
  } else if (mkt) {
    price = mkt._uiPrice
  } else {
    price = 0
  }
  return price
}

const Trade: NextPage = () => {
  const router = useRouter()
  const { name: marketName } = router.query

  useEffect(() => {
    const set = mangoStore.getState().set
    const group = mangoStore.getState().group
    const serumMarkets = mangoStore.getState().serumMarkets
    const perpMarkets = mangoStore.getState().perpMarkets

    if (group && marketName && typeof marketName === 'string') {
      const mkt =
        serumMarkets.find((m) => m.name === marketName) ||
        perpMarkets.find((m) => m.name === marketName)

      if (mkt) {
        let tickSize = 4
        if (mkt instanceof Serum3Market) {
          const market = group.getSerum3ExternalMarket(mkt.serumMarketExternal)
          tickSize = market.tickSize
        } else {
          tickSize = mkt.tickSize
        }
        set((s) => {
          s.selectedMarket.name = marketName
          s.selectedMarket.current = mkt
          s.tradeForm = {
            ...DEFAULT_TRADE_FORM,
            price: getOraclePriceForMarket(group, mkt).toFixed(
              getDecimalCount(tickSize),
            ),
          }
        })
      }
    }
  }, [marketName])

  return (
    <div className="pb-16 md:pb-0">
      <TradeAdvancedPage />
    </div>
  )
}

export default Trade
