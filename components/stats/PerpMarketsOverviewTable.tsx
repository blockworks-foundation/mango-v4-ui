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
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import {
  formatFunding,
  usePerpFundingRate,
} from '@components/trade/PerpFundingRate'
import { ChevronRightIcon } from '@heroicons/react/20/solid'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { getDecimalCount } from 'utils/numbers'
import Tooltip from '@components/shared/Tooltip'
import { PerpStatsItem } from 'types'
import useMangoGroup from 'hooks/useMangoGroup'
import { NextRouter, useRouter } from 'next/router'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import SimpleAreaChart from '@components/shared/SimpleAreaChart'

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

const goToPerpMarketDetails = (market: PerpMarket, router: NextRouter) => {
  const query = { ...router.query, ['market']: market.name }
  router.push({ pathname: router.pathname, query })
}

const PerpMarketsOverviewTable = () => {
  const { t } = useTranslation(['common', 'trade'])
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const { theme } = useTheme()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const rate = usePerpFundingRate()
  const { group } = useMangoGroup()
  const router = useRouter()

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
              let fundingRateApr
              if (rate.isSuccess) {
                const marketRate = rate?.data?.find(
                  (r) => r.market_index === market.perpMarketIndex
                )
                if (marketRate) {
                  fundingRate = formatFunding.format(
                    marketRate.funding_rate_hourly
                  )
                  fundingRateApr = formatFunding.format(
                    marketRate.funding_rate_hourly * 8760
                  )
                } else {
                  fundingRate = '–'
                  fundingRateApr = '–'
                }
              } else {
                fundingRate = '–'
                fundingRateApr = '–'
              }

              const openInterest = market.baseLotsToUi(market.openInterest)

              return (
                <TrBody
                  className="md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                  key={market.publicKey.toString()}
                  onClick={() => goToPerpMarketDetails(market, router)}
                >
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
                            data={marketStats.concat([
                              {
                                ...marketStats[marketStats.length - 1],
                                date_hour: new Date().toString(),
                                price: market.uiPrice,
                              },
                            ])}
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
                    <div className="flex items-center justify-end">
                      <p className="">{fundingRate}</p>
                      <Tooltip
                        content={
                          <>
                            {fundingRateApr ? (
                              <div className="">
                                The 1hr rate as an APR is {fundingRateApr}.
                              </div>
                            ) : null}
                            <div className="mt-2">
                              Funding is paid continuously. The 1hr rate
                              displayed is a rolling average of the past 60
                              mins.
                            </div>
                            <div className="mt-2">
                              When positive, longs will pay shorts and when
                              negative shorts pay longs.
                            </div>
                          </>
                        }
                      >
                        <InformationCircleIcon className="ml-2 h-4 w-4" />
                      </Tooltip>
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
                      <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
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

export default PerpMarketsOverviewTable

const MobilePerpMarketItem = ({ market }: { market: PerpMarket }) => {
  const { t } = useTranslation('common')
  const loadingPerpStats = mangoStore((s) => s.perpStats.loading)
  const perpStats = mangoStore((s) => s.perpStats.data)
  const { theme } = useTheme()
  const router = useRouter()
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
    <button
      className="w-full border-b border-th-bkg-3 p-4 focus:outline-none"
      onClick={() => goToPerpMarketDetails(market, router)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <MarketLogos market={market} />
          <div>
            <p className="text-left text-th-fgd-1">{market.name}</p>
            <div className="flex items-center space-x-3">
              <p className="font-mono">
                <FormatNumericValue value={market.uiPrice} isUsd />
              </p>
              <Change change={change} suffix="%" />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
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
          <ChevronRightIcon className="h-5 w-5" />
        </div>
      </div>
    </button>
  )
}
