import { I80F48, PerpMarket } from '@blockworks-foundation/mango-v4'
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
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { usePerpFundingRate } from '@components/trade/PerpFundingRate'
import { IconButton } from '@components/shared/Button'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { getDecimalCount } from 'utils/numbers'
import Tooltip from '@components/shared/Tooltip'
import { PerpStatsItem } from 'types'
import useMangoGroup from 'hooks/useMangoGroup'
const SimpleAreaChart = dynamic(
  () => import('@components/shared/SimpleAreaChart'),
  { ssr: false }
)

export const getOneDayPerpStats = (
  stats: PerpStatsItem[] | null,
  marketName: string
) => {
  return stats
    ? stats
        .filter((s) => s.perp_market === marketName)
        .filter((f) => {
          const seconds = 86400
          const dataTime = new Date(f.date_hour).getTime() / 1000
          const now = new Date().getTime() / 1000
          const limit = now - seconds
          return dataTime >= limit
        })
        .reverse()
    : []
}

const PerpMarketsTable = ({
  setShowPerpDetails,
}: {
  setShowPerpDetails: (x: string) => void
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const { theme } = useTheme()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const rate = usePerpFundingRate()
  const { group } = useMangoGroup()

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('market')}</Th>
              <Th className="text-right">{t('price')}</Th>
              <Th className="text-right"></Th>
              <Th className="text-right">
                <Tooltip content={t('trade:tooltip-stable-price')}>
                  <span className="tooltip-underline">
                    {t('trade:stable-price')}
                  </span>
                </Tooltip>
              </Th>
              <Th className="text-right">{t('trade:funding-rate')}</Th>
              <Th className="text-right">{t('trade:open-interest')}</Th>
              <Th className="text-right">{t('rolling-change')}</Th>
              <Th />
            </TrHead>
          </thead>
          <tbody>
            {perpMarkets.map((market) => {
              const symbol = market.name.split('-')[0]
              const marketStats = getOneDayPerpStats(perpStats, market.name)

              const change = marketStats.length
                ? ((market.uiPrice - marketStats[0].price) /
                    marketStats[0].price) *
                  100
                : 0

              let fundingRate
              if (rate.isSuccess) {
                const marketRate = rate?.data?.find(
                  (r) => r.market_index === market.perpMarketIndex
                )
                fundingRate = marketRate
                  ? `${marketRate.funding_rate_hourly.toFixed(4)}%`
                  : '–'
              } else {
                fundingRate = '–'
              }

              const openInterest = market.baseLotsToUi(market.openInterest)

              return (
                <TrBody key={market.publicKey.toString()}>
                  <Td>
                    <div className="flex items-center">
                      <MarketLogos market={market} />
                      <p className="whitespace-nowrap font-body">
                        {market.name}
                      </p>
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
                    {!loadingPerpStats ? (
                      marketStats.length ? (
                        <div className="h-10 w-24">
                          <SimpleAreaChart
                            color={
                              change >= 0
                                ? COLORS.UP[theme]
                                : COLORS.DOWN[theme]
                            }
                            data={marketStats}
                            name={symbol}
                            xKey="date_hour"
                            yKey="price"
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
                      <p>
                        {group ? (
                          <FormatNumericValue
                            value={group.toUiPrice(
                              I80F48.fromNumber(
                                market.stablePriceModel.stablePrice
                              ),
                              market.baseDecimals
                            )}
                            isUsd
                          />
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>{fundingRate}</p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        <FormatNumericValue
                          value={openInterest}
                          decimals={getDecimalCount(market.minOrderSize)}
                        />
                      </p>
                      <p className="text-th-fgd-4">
                        <FormatNumericValue
                          value={openInterest * market.uiPrice}
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
                setShowPerpDetails={setShowPerpDetails}
              />
            )
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default PerpMarketsTable

const MobilePerpMarketItem = ({
  market,
  setShowPerpDetails,
}: {
  market: PerpMarket
  setShowPerpDetails: (x: string) => void
}) => {
  const { t } = useTranslation('common')
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const { theme } = useTheme()
  // const rate = usePerpFundingRate()

  const symbol = market.name.split('-')[0]

  const marketStats = getOneDayPerpStats(perpStats, market.name)

  const change = marketStats.length
    ? ((market.uiPrice - marketStats[0].price) / marketStats[0].price) * 100
    : 0

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
          {!loadingPerpStats ? (
            marketStats.length ? (
              <div className="ml-4 h-10 w-24">
                <SimpleAreaChart
                  color={change >= 0 ? COLORS.UP[theme] : COLORS.DOWN[theme]}
                  data={marketStats}
                  name={market.name}
                  xKey="date_hour"
                  yKey="price"
                />
              </div>
            ) : symbol === 'USDC' || symbol === 'USDT' ? null : (
              <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
            )
          ) : (
            <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
          )}
        </div>
        <IconButton
          onClick={() => setShowPerpDetails(market.name)}
          size="medium"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  )
}
