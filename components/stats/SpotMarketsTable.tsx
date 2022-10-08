import { Serum3Market } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { useMemo } from 'react'
import { useViewport } from '../../hooks/useViewport'
import mangoStore from '@store/mangoStore'
import { COLORS } from '../../styles/colors'
import { formatFixedDecimals } from '../../utils/numbers'
import { breakpoints } from '../../utils/theme'
import ContentBox from '../shared/ContentBox'
import Change from '../shared/Change'
import SimpleAreaChart from '../shared/SimpleAreaChart'
import MarketLogos from '@components/trade/MarketLogos'

const SpotMarketsTable = () => {
  const { t } = useTranslation('common')
  const coingeckoPrices = mangoStore((s) => s.coingeckoPrices.data)
  const loadingCoingeckoPrices = mangoStore((s) => s.coingeckoPrices.loading)
  const group = mangoStore((s) => s.group)
  const serumMarkets = mangoStore((s) => s.serumMarkets)
  const { theme } = useTheme()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <table className="-mt-1 min-w-full">
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

              const coingeckoData = coingeckoPrices.find((asset) =>
                bank?.name === 'soETH'
                  ? asset.symbol === 'ETH'
                  : asset.symbol === bank?.name
              )

              const change = coingeckoData
                ? ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
                    coingeckoData.prices[0][1]) /
                    coingeckoData.prices[0][1]) *
                  100
                : 0

              const chartData = coingeckoData ? coingeckoData.prices : undefined

              return (
                <tr key={market.publicKey.toString()}>
                  <td>
                    <div className="flex items-center">
                      <MarketLogos serumMarket={market} />
                      <p className="font-body tracking-wide">{market.name}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col text-right">
                      <p>{formatFixedDecimals(oraclePrice!, true)}</p>
                    </div>
                  </td>
                  <td>
                    {!loadingCoingeckoPrices ? (
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
                          xKey="0"
                          yKey="1"
                        />
                      ) : bank?.name === 'USDC' ||
                        bank?.name === 'USDT' ? null : (
                        <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                      )
                    ) : (
                      <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col items-end">
                      <Change change={change} />
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
  const coingeckoPrices = mangoStore((s) => s.coingeckoPrices.data)
  const loadingCoingeckoPrices = mangoStore((s) => s.coingeckoPrices.loading)
  const group = mangoStore((s) => s.group)
  const { theme } = useTheme()
  const bank = group?.getFirstBankByTokenIndex(market.baseTokenIndex)

  const coingeckoData = useMemo(() => {
    if (!loadingCoingeckoPrices && bank) {
      return coingeckoPrices.find((asset) =>
        bank.name === 'soETH'
          ? asset.symbol === 'ETH'
          : asset.symbol === bank?.name
      )
    }
    return null
  }, [loadingCoingeckoPrices, bank])

  const change = useMemo(() => {
    if (coingeckoData) {
      return (
        ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
          coingeckoData.prices[0][1]) /
          coingeckoData.prices[0][1]) *
        100
      )
    }
    return 0
  }, [coingeckoData])

  const chartData = useMemo(() => {
    if (coingeckoData) {
      return coingeckoData.prices
    }
    return undefined
  }, [coingeckoData])

  return (
    <div className="border-b border-th-bkg-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MarketLogos serumMarket={market} />
          <div>
            <p className="text-th-fgd-1">{market.name}</p>
            <div className="flex items-center space-x-3">
              <p className="font-mono">
                {formatFixedDecimals(bank?.uiPrice!, true)}
              </p>
              <Change change={change} />
            </div>
          </div>
        </div>
        {!loadingCoingeckoPrices ? (
          chartData !== undefined ? (
            <SimpleAreaChart
              color={change >= 0 ? COLORS.GREEN[theme] : COLORS.RED[theme]}
              data={chartData}
              height={40}
              name={bank!.name}
              width={104}
              xKey="0"
              yKey="1"
            />
          ) : bank?.name === 'USDC' || bank?.name === 'USDT' ? null : (
            <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
          )
        ) : (
          <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
        )}
      </div>
    </div>
  )
}
