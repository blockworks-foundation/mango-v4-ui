import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { IconButton } from '@components/shared/Button'
import Change from '@components/shared/Change'
import { getOneDayPerpStats } from '@components/stats/PerpMarketsTable'
import { ChartBarIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import { useCoingecko } from 'hooks/useCoingecko'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useEffect, useMemo } from 'react'
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
  const perpStats = mangoStore((s) => s.perpStats.data)
  const { serumOrPerpMarket, baseSymbol, price } = useSelectedMarket()
  const selectedMarketName = mangoStore((s) => s.selectedMarket.name)
  const { data: tokenPrices } = useCoingecko()

  useEffect(() => {
    if (serumOrPerpMarket instanceof PerpMarket) {
      const actions = mangoStore.getState().actions
      actions.fetchPerpStats()
    }
  }, [serumOrPerpMarket])

  const changeData = useMemo(() => {
    if (serumOrPerpMarket instanceof PerpMarket) {
      return getOneDayPerpStats(perpStats, selectedMarketName)
    } else {
      return tokenPrices.find(
        (asset) => asset.symbol.toUpperCase() === baseSymbol?.toUpperCase()
      )
    }
  }, [baseSymbol, perpStats, serumOrPerpMarket, tokenPrices])

  const change = useMemo(() => {
    if (!changeData || !price || !serumOrPerpMarket) return 0
    if (serumOrPerpMarket instanceof PerpMarket) {
      return changeData.length
        ? ((price - changeData[0].price) / changeData[0].price) * 100
        : 0
    } else {
      return ((price - changeData.prices[0][1]) / changeData.prices[0][1]) * 100
    }
  }, [changeData, price, serumOrPerpMarket])

  return (
    <div className="flex flex-col bg-th-bkg-1 md:h-12 md:flex-row md:items-center">
      <div className="w-full px-4 md:w-auto md:px-6 md:py-0 lg:pb-0">
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
