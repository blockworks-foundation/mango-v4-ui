import { PerpMarket } from '@blockworks-foundation/mango-v4'
import Change from '@components/shared/Change'
import { useCoingecko } from 'hooks/useCoingecko'
import useOraclePrice from 'hooks/useOraclePrice'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import MarketSelectDropdown from './MarketSelectDropdown'
import PerpFundingRate from './PerpFundingRate'

const AdvancedMarketHeader = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { selectedMarket } = useSelectedMarket()
  const { data: tokenPrices } = useCoingecko()
  const oraclePrice = useOraclePrice()

  const baseSymbol = useMemo(() => {
    return selectedMarket?.name.split('/')[0]
  }, [selectedMarket])

  const coingeckoData = tokenPrices.find((asset) =>
    baseSymbol === 'soETH'
      ? asset.symbol === 'ETH'
      : asset.symbol === baseSymbol
  )

  const change = coingeckoData
    ? ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
        coingeckoData.prices[0][1]) /
        coingeckoData.prices[0][1]) *
      100
    : 0

  return (
    <div className="flex flex-col bg-th-bkg-1 md:h-12 md:flex-row md:items-center">
      <div className=" w-full px-5 md:w-auto md:py-0 md:pr-6 lg:pb-0">
        <MarketSelectDropdown />
      </div>
      <div className="flex items-center border-t border-th-bkg-3 py-2 px-5 md:border-t-0 md:py-0 md:px-0">
        <div id="trade-step-two" className="flex-col md:ml-6">
          <div className="text-xs text-th-fgd-4">{t('trade:oracle-price')}</div>
          <div className="font-mono text-xs text-th-fgd-2">
            {oraclePrice ? (
              `$${oraclePrice}`
            ) : (
              <span className="text-th-fgd-4">–</span>
            )}
          </div>
        </div>
        <div className="ml-6 flex-col">
          <div className="text-xs text-th-fgd-4">{t('rolling-change')}</div>
          <Change change={change} size="small" suffix="%" />
        </div>
        {selectedMarket instanceof PerpMarket ? (
          <div className="ml-6 flex-col">
            <div className="text-xs text-th-fgd-4">
              {t('trade:funding-rate')}
            </div>
            <PerpFundingRate />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default AdvancedMarketHeader
