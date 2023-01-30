import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { IconButton } from '@components/shared/Button'
import Change from '@components/shared/Change'
import { ChartBarIcon } from '@heroicons/react/20/solid'
import { useCoingecko } from 'hooks/useCoingecko'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import { getDecimalCount } from 'utils/numbers'
import MarketSelectDropdown from './MarketSelectDropdown'
import PerpFundingRate from './PerpFundingRate'

const AdvancedMarketHeader = ({
  showChart,
  setShowChart,
}: {
  showChart?: boolean
  setShowChart?: (x: boolean) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { serumOrPerpMarket, baseSymbol, price } = useSelectedMarket()
  const { data: tokenPrices } = useCoingecko()

  const coingeckoData = useMemo(() => {
    return tokenPrices.find(
      (asset) => asset.symbol.toUpperCase() === baseSymbol?.toUpperCase()
    )
  }, [baseSymbol, tokenPrices])

  const change = useMemo(() => {
    return coingeckoData
      ? ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
          coingeckoData.prices[0][1]) /
          coingeckoData.prices[0][1]) *
          100
      : 0
  }, [coingeckoData])

  return (
    <div className="flex flex-col bg-th-bkg-1 md:h-12 md:flex-row md:items-center">
      <div className=" w-full px-5 md:w-auto md:py-0 md:pr-6 lg:pb-0">
        <MarketSelectDropdown />
      </div>
      <div className="border-t border-th-bkg-3 py-2 px-5 md:border-t-0 md:py-0 md:px-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div id="trade-step-two" className="flex-col md:ml-6">
              <div className="text-xs text-th-fgd-4">
                {t('trade:oracle-price')}
              </div>
              <div className="font-mono text-xs text-th-fgd-2">
                {price ? (
                  `$${price.toFixed(
                    getDecimalCount(serumOrPerpMarket?.tickSize || 0.01)
                  )}`
                ) : (
                  <span className="text-th-fgd-4">–</span>
                )}
              </div>
            </div>
            <div className="ml-6 flex-col">
              <div className="text-xs text-th-fgd-4">{t('rolling-change')}</div>
              <Change change={change} size="small" suffix="%" />
            </div>
            {serumOrPerpMarket instanceof PerpMarket ? (
              <div className="ml-6 flex-col">
                <div className="text-xs text-th-fgd-4">
                  {t('trade:funding-rate')}
                </div>
                <PerpFundingRate />
              </div>
            ) : null}
          </div>
          {setShowChart ? (
            <IconButton
              className={showChart ? 'text-th-active' : 'text-th-fgd-2'}
              onClick={() => setShowChart(!showChart)}
              hideBg
            >
              <ChartBarIcon className="h-5 w-5" />
            </IconButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AdvancedMarketHeader
