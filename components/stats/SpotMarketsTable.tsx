import { Serum3Market } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { useEffect, useMemo } from 'react'
import { useViewport } from '../../hooks/useViewport'
import mangoStore from '@store/mangoStore'
import { COLORS } from '../../styles/colors'
import { formatFixedDecimals } from '../../utils/numbers'
import { breakpoints } from '../../utils/theme'
import ContentBox from '../shared/ContentBox'
import Change from '../shared/Change'
import MarketLogos from '@components/trade/MarketLogos'
import dynamic from 'next/dynamic'
import SheenLoader from '@components/shared/SheenLoader'
const SimpleAreaChart = dynamic(
  () => import('@components/shared/SimpleAreaChart'),
  { ssr: false }
)

const SpotMarketsTable = () => {
  const { t } = useTranslation('common')
  const actions = mangoStore((s) => s.actions)
  const group = mangoStore((s) => s.group)
  const serumMarkets = mangoStore((s) => s.serumMarkets)
  const serumMarketPrices = mangoStore((s) => s.serumMarketPrices.data)
  const loadingSerumMarketPrices = mangoStore(
    (s) => s.serumMarketPrices.loading
  )
  const { theme } = useTheme()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  useEffect(() => {
    actions.fetchSerumMarketPrices()
  }, [actions])

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left">{t('market')}</th>
              <th className="text-right">{t('price')}</th>
              <th className="hidden text-right lg:block"></th>
              <th className="text-right">{t('rolling-change')}</th>
            </tr>
          </thead>
          <tbody>
            {serumMarkets.map((market) => {
              const bank = group?.getFirstBankByTokenIndex(
                market.baseTokenIndex
              )
              const oraclePrice = bank?.uiPrice

              const chartData = serumMarketPrices.find(
                (m) =>
                  m.length &&
                  m[0].address === market.serumMarketExternal.toString()
              )

              const change = chartData
                ? ((chartData[chartData.length - 1].value -
                    chartData[0].value) /
                    chartData[0].value) *
                  100
                : 'unavailable'

              return (
                <tr key={market.publicKey.toString()}>
                  <td>
                    <div className="flex items-center">
                      <MarketLogos market={market} />
                      <p className="font-body tracking-wide">{market.name}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col text-right">
                      <p>{formatFixedDecimals(oraclePrice!, true)}</p>
                    </div>
                  </td>
                  <td>
                    {!loadingSerumMarketPrices ? (
                      chartData !== undefined ? (
                        <SimpleAreaChart
                          color={
                            change >= 0
                              ? COLORS.GREEN[theme]
                              : COLORS.RED[theme]
                          }
                          data={chartData}
                          height={40}
                          name={bank!.name}
                          width={104}
                          xKey="unixTime"
                          yKey="value"
                        />
                      ) : (
                        <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                      )
                    ) : (
                      <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col items-end">
                      {change !== 'unavailable' ? (
                        loadingSerumMarketPrices ? (
                          <SheenLoader>
                            <div className="h-5 w-12 rounded bg-th-bkg-2" />
                          </SheenLoader>
                        ) : (
                          <Change change={change} />
                        )
                      ) : (
                        <p className="text-th-fgd-4">{t('unavailable')}</p>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <div>
          {serumMarkets.map((market) => {
            return (
              <MobileSpotMarketItem
                key={market.publicKey.toString()}
                market={market}
              />
            )
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default SpotMarketsTable

const MobileSpotMarketItem = ({ market }: { market: Serum3Market }) => {
  const { t } = useTranslation('common')
  const serumMarketPrices = mangoStore((s) => s.serumMarketPrices.data)
  const loadingSerumMarketPrices = mangoStore(
    (s) => s.serumMarketPrices.loading
  )
  const group = mangoStore((s) => s.group)
  const { theme } = useTheme()
  const bank = group?.getFirstBankByTokenIndex(market.baseTokenIndex)

  const chartData = useMemo(() => {
    if (!loadingSerumMarketPrices) {
      return serumMarketPrices.find(
        (m) =>
          m.length && m[0].address === market.serumMarketExternal.toString()
      )
    }
    return null
  }, [loadingSerumMarketPrices])

  const change = useMemo(() => {
    if (chartData) {
      return (
        ((chartData[chartData.length - 1].value - chartData[0].value) /
          chartData[0].value) *
        100
      )
    }
    return 0
  }, [chartData])

  return (
    <div className="border-b border-th-bkg-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MarketLogos market={market} />
          <div>
            <p className="text-th-fgd-1">{market.name}</p>
            <div className="flex items-center space-x-3">
              <p className="font-mono">
                {formatFixedDecimals(bank?.uiPrice!, true)}
              </p>
              {change ? (
                <Change change={change} />
              ) : (
                <p className="text-th-fgd-4">{t('unavailable')}</p>
              )}
            </div>
          </div>
        </div>
        {!loadingSerumMarketPrices ? (
          chartData ? (
            <SimpleAreaChart
              color={change >= 0 ? COLORS.GREEN[theme] : COLORS.RED[theme]}
              data={chartData}
              height={40}
              name={bank!.name}
              width={104}
              xKey="unixTime"
              yKey="value"
            />
          ) : (
            <p className="text-th-fgd-4">{t('unavailable')}</p>
          )
        ) : (
          <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
        )}
      </div>
    </div>
  )
}
