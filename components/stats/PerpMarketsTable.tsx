import { BookSide, PerpMarket } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { useViewport } from '../../hooks/useViewport'
import mangoStore from '@store/mangoStore'
import { COLORS } from '../../styles/colors'
import { formatFixedDecimals } from '../../utils/numbers'
import { breakpoints } from '../../utils/theme'
import ContentBox from '../shared/ContentBox'
import Change from '../shared/Change'
import MarketLogos from '@components/trade/MarketLogos'
import dynamic from 'next/dynamic'
import { useCoingecko } from 'hooks/useCoingecko'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { usePerpFundingRate } from '@components/trade/PerpFundingRate'
import { useEffect } from 'react'
import useMangoGroup from 'hooks/useMangoGroup'
const SimpleAreaChart = dynamic(
  () => import('@components/shared/SimpleAreaChart'),
  { ssr: false }
)

const PerpMarketsTable = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { isLoading: loadingPrices, data: coingeckoPrices } = useCoingecko()
  const actions = mangoStore((s) => s.actions)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const { group } = useMangoGroup()
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const { theme } = useTheme()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const bids = mangoStore((s) => s.selectedMarket.bidsAccount)
  const asks = mangoStore((s) => s.selectedMarket.asksAccount)
  const rate = usePerpFundingRate()

  useEffect(() => {
    if (group) {
      actions.fetchPerpStats()
    }
  }, [group])

  console.log(perpStats)

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('market')}</Th>
              <Th className="text-right">{t('price')}</Th>
              <Th className="hidden text-right lg:block"></Th>
              <Th className="text-right">{t('trade:funding-rate')}</Th>
              <Th className="text-right">{t('trade:open-interest')}</Th>
              <Th className="text-right">{t('rolling-change')}</Th>
            </TrHead>
          </thead>
          <tbody>
            {perpMarkets.map((market) => {
              const symbol = market.name.split('-')[0]

              const coingeckoData = coingeckoPrices.find((asset) =>
                symbol === 'soETH'
                  ? asset.symbol === 'ETH'
                  : asset.symbol === symbol
              )

              const change = coingeckoData
                ? ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
                    coingeckoData.prices[0][1]) /
                    coingeckoData.prices[0][1]) *
                  100
                : 0

              const chartData = coingeckoData ? coingeckoData.prices : undefined

              let fundingRate
              if (
                rate.isSuccess &&
                bids instanceof BookSide &&
                asks instanceof BookSide
              ) {
                console.log(rate)
                const marketRate = rate.data.find(
                  (r) => r.market_index === market.perpMarketIndex
                )
                fundingRate = `${marketRate?.funding_apr.toFixed(2)}%`
              } else {
                fundingRate = '–'
              }

              return (
                <TrBody key={market.publicKey.toString()}>
                  <Td>
                    <div className="flex items-center">
                      <MarketLogos market={market} />
                      <p className="font-body tracking-wide">{market.name}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>{formatFixedDecimals(market.uiPrice, true)}</p>
                    </div>
                  </Td>
                  <Td>
                    {!loadingPrices ? (
                      chartData !== undefined ? (
                        <SimpleAreaChart
                          color={
                            change >= 0 ? COLORS.UP[theme] : COLORS.DOWN[theme]
                          }
                          data={chartData}
                          height={40}
                          name={symbol}
                          width={104}
                          xKey="0"
                          yKey="1"
                        />
                      ) : symbol === 'USDC' || symbol === 'USDT' ? null : (
                        <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                      )
                    ) : (
                      <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
                    )}
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>{fundingRate}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>${market.openInterest.toString()}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col items-end">
                      <Change change={change} suffix="%" />
                    </div>
                  </Td>
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <div>
          {perpMarkets.map((market) => {
            return (
              <MobilePerpMarketItem
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

export default PerpMarketsTable

const MobilePerpMarketItem = ({ market }: { market: PerpMarket }) => {
  const { t } = useTranslation('common')
  const { isLoading: loadingPrices, data: coingeckoPrices } = useCoingecko()
  const { theme } = useTheme()
  // const rate = usePerpFundingRate()

  const symbol = market.name.split('-')[0]

  const coingeckoData = coingeckoPrices.find((asset) =>
    symbol === 'soETH' ? asset.symbol === 'ETH' : asset.symbol === symbol
  )

  const change = coingeckoData
    ? ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
        coingeckoData.prices[0][1]) /
        coingeckoData.prices[0][1]) *
      100
    : 0

  const chartData = coingeckoData ? coingeckoData.prices : undefined

  // let fundingRate
  // if (
  //   rate.isSuccess
  //   // && bids instanceof BookSide &&
  //   // asks instanceof BookSide
  // ) {
  //   const marketRate = rate.data.find(
  //     (r) => r.market_index === market.perpMarketIndex
  //   )
  //   fundingRate = `${marketRate?.funding_apr.toFixed(2)}%`
  // } else {
  //   fundingRate = '–'
  // }

  return (
    <div className="border-b border-th-bkg-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MarketLogos market={market} />
          <div>
            <p className="text-th-fgd-1">{market.name}</p>
            <div className="flex items-center space-x-3">
              <p className="font-mono">
                {formatFixedDecimals(market.uiPrice, true)}
              </p>
              <Change change={change} suffix="%" />
            </div>
          </div>
        </div>
        {!loadingPrices ? (
          chartData !== undefined ? (
            <SimpleAreaChart
              color={change >= 0 ? COLORS.UP[theme] : COLORS.DOWN[theme]}
              data={chartData}
              height={40}
              name={market.name}
              width={104}
              xKey="0"
              yKey="1"
            />
          ) : symbol === 'USDC' || symbol === 'USDT' ? null : (
            <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
          )
        ) : (
          <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
        )}
      </div>
    </div>
  )
}
