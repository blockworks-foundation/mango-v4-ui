import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import { useViewport } from '../../hooks/useViewport'
import mangoStore from '@store/mangoStore'
import { COLORS } from '../../styles/colors'
import { breakpoints } from '../../utils/theme'
import ContentBox from '../shared/ContentBox'
import Change from '../shared/Change'
import MarketLogos from '@components/trade/MarketLogos'
import dynamic from 'next/dynamic'
import { useCoingecko } from 'hooks/useCoingecko'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { usePerpFundingRate } from '@components/trade/PerpFundingRate'
import { IconButton } from '@components/shared/Button'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import FormatNumericValue from '@components/shared/FormatNumericValue'
const SimpleAreaChart = dynamic(
  () => import('@components/shared/SimpleAreaChart'),
  { ssr: false }
)

const PerpMarketsTable = ({
  setShowPerpDetails,
}: {
  setShowPerpDetails: (x: string) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { isLoading: loadingPrices, data: coingeckoPrices } = useCoingecko()
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const { theme } = useTheme()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const rate = usePerpFundingRate()

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

              const coingeckoData = coingeckoPrices.find(
                (asset) => asset.symbol.toUpperCase() === symbol.toUpperCase()
              )

              const change = coingeckoData
                ? ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
                    coingeckoData.prices[0][1]) /
                    coingeckoData.prices[0][1]) *
                  100
                : 0

              const chartData = coingeckoData ? coingeckoData.prices : undefined

              let fundingRate
              if (rate.isSuccess && market instanceof PerpMarket) {
                const marketRate = rate?.data?.find(
                  (r) => r.market_index === market.perpMarketIndex
                )
                fundingRate = marketRate
                  ? `${marketRate.funding_rate_hourly.toFixed(4)}%`
                  : '–'
              } else {
                fundingRate = '–'
              }

              return (
                <TrBody key={market.publicKey.toString()}>
                  <Td>
                    <div className="flex items-center">
                      <MarketLogos market={market} />
                      <p className="font-body">{market.name}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        <FormatNumericValue value={market.uiPrice} isUsd />
                      </p>
                    </div>
                  </Td>
                  <Td>
                    {!loadingPrices ? (
                      chartData !== undefined ? (
                        <div className="h-10 w-24">
                          <SimpleAreaChart
                            color={
                              change >= 0
                                ? COLORS.UP[theme]
                                : COLORS.DOWN[theme]
                            }
                            data={chartData}
                            name={symbol}
                            xKey="0"
                            yKey="1"
                          />
                        </div>
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
                      <p>
                        {market.openInterest.toString()}{' '}
                        <span className="font-body text-th-fgd-3">
                          {market.name.slice(0, -5)}
                        </span>
                      </p>
                      <p className="text-xs text-th-fgd-4">
                        <FormatNumericValue
                          value={
                            market.openInterest.toNumber() * market.uiPrice
                          }
                          isUsd
                        />
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col items-end">
                      <Change change={change} suffix="%" />
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <IconButton
                        onClick={() => setShowPerpDetails(market.name)}
                        size="small"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </IconButton>
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

  const coingeckoData = coingeckoPrices.find((asset) => asset.symbol === symbol)

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
                <FormatNumericValue value={market.uiPrice} isUsd />
              </p>
              <Change change={change} suffix="%" />
            </div>
          </div>
        </div>
        {!loadingPrices ? (
          chartData !== undefined ? (
            <div className="h-10 w-24">
              <SimpleAreaChart
                color={change >= 0 ? COLORS.UP[theme] : COLORS.DOWN[theme]}
                data={chartData}
                name={market.name}
                xKey="0"
                yKey="1"
              />
            </div>
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
