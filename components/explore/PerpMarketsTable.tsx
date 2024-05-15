import { useTranslation } from 'next-i18next'
import MarketLogos from '@components/trade/MarketLogos'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import {
  formatFunding,
  usePerpFundingRate,
} from '@components/trade/PerpFundingRate'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { getDecimalCount, numberCompacter } from 'utils/numbers'
import Tooltip from '@components/shared/Tooltip'
import { useRouter } from 'next/router'
import SimpleAreaChart from '@components/shared/SimpleAreaChart'
import { Disclosure, Transition } from '@headlessui/react'
import { LinkButton } from '@components/shared/Button'
import SoonBadge from '@components/shared/SoonBadge'
import MarketChange from '@components/shared/MarketChange'
import useThemeWrapper from 'hooks/useThemeWrapper'
import useListedMarketsWithMarketData, {
  PerpMarketWithMarketData,
} from 'hooks/useListedMarketsWithMarketData'
import { sortPerpMarkets } from 'utils/markets'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import ContentBox from '@components/shared/ContentBox'
import { COLORS } from 'styles/colors'
import { goToPerpMarketDetails } from '@components/stats/perps/PerpMarketDetailsTable'

const PerpMarketsTable = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { theme } = useThemeWrapper()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const rate = usePerpFundingRate()
  const router = useRouter()
  const { perpMarketsWithData, isLoading } = useListedMarketsWithMarketData()

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <div className="thin-scroll overflow-x-auto">
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">{t('market')}</Th>
                <Th className="text-right">{t('price')}</Th>
                <Th className="text-right">{t('rolling-change')}</Th>
                <Th className="text-right"></Th>
                <Th className="text-right">{t('trade:24h-volume')}</Th>
                <Th className="text-right">{t('trade:funding-rate')}</Th>
                <Th className="text-right">{t('trade:open-interest')}</Th>
                <Th />
              </TrHead>
            </thead>
            <tbody>
              {sortPerpMarkets(perpMarketsWithData, 'quote_volume_24h').map(
                (market) => {
                  const symbol = market.name.split('-')[0]

                  const priceHistory = market?.marketData?.price_history

                  const volumeData = market?.marketData?.quote_volume_24h

                  const volume = volumeData ? volumeData : 0

                  let fundingRate
                  let fundingRateApr
                  if (rate.isSuccess) {
                    const marketRate = rate?.data?.find(
                      (r) => r.market_index === market.perpMarketIndex,
                    )
                    if (marketRate) {
                      fundingRate = formatFunding.format(
                        marketRate.funding_rate_hourly,
                      )
                      fundingRateApr = formatFunding.format(
                        marketRate.funding_rate_hourly * 8760,
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
                  const isComingSoon = market.oracleLastUpdatedSlot == 0
                  const isUp =
                    priceHistory && priceHistory.length
                      ? market.uiPrice >= priceHistory[0].price
                      : false

                  return (
                    <TrBody
                      className="default-transition md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                      key={market.publicKey.toString()}
                      onClick={() => goToPerpMarketDetails(market.name, router)}
                    >
                      <Td>
                        <div className="flex items-center">
                          <MarketLogos market={market} size="large" />
                          <p className="mr-2 whitespace-nowrap font-body">
                            {market.name}
                          </p>
                          {isComingSoon ? <SoonBadge /> : null}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-col text-right">
                          <p>
                            {market.uiPrice ? (
                              <FormatNumericValue
                                value={market.uiPrice}
                                isUsd
                              />
                            ) : (
                              '–'
                            )}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-col items-end">
                          <MarketChange market={market} />
                        </div>
                      </Td>
                      <Td>
                        {!isLoading ? (
                          priceHistory && priceHistory?.length ? (
                            <div className="h-10 w-24">
                              <SimpleAreaChart
                                color={
                                  isUp ? COLORS.UP[theme] : COLORS.DOWN[theme]
                                }
                                data={priceHistory.concat([
                                  {
                                    time: new Date().toString(),
                                    price: market.uiPrice,
                                  },
                                ])}
                                name={symbol}
                                xKey="time"
                                yKey="price"
                              />
                            </div>
                          ) : symbol === 'USDC' || symbol === 'USDT' ? null : (
                            <p className="mb-0 text-th-fgd-4">
                              {t('unavailable')}
                            </p>
                          )
                        ) : (
                          <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
                        )}
                      </Td>
                      <Td>
                        <div className="flex flex-col text-right">
                          <p>
                            {volume
                              ? `$${numberCompacter.format(volume)}`
                              : '$0'}
                          </p>
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center justify-end">
                          {fundingRate !== '–' ? (
                            <Tooltip
                              content={
                                <>
                                  {fundingRateApr ? (
                                    <div className="">
                                      The 1hr rate as an APR is{' '}
                                      <span className="font-mono text-th-fgd-2">
                                        {fundingRateApr}
                                      </span>
                                    </div>
                                  ) : null}
                                  <div className="mt-2">
                                    Funding is paid continuously. The 1hr rate
                                    displayed is a rolling average of the past
                                    60 mins.
                                  </div>
                                  <div className="mt-2">
                                    When positive, longs will pay shorts and
                                    when negative shorts pay longs.
                                  </div>
                                </>
                              }
                            >
                              <p className="tooltip-underline">{fundingRate}</p>
                            </Tooltip>
                          ) : (
                            <p>–</p>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex flex-col text-right">
                          {openInterest ? (
                            <>
                              <p>
                                <FormatNumericValue
                                  value={openInterest}
                                  decimals={getDecimalCount(
                                    market.minOrderSize,
                                  )}
                                />
                              </p>
                              <p className="text-th-fgd-4">
                                $
                                {numberCompacter.format(
                                  openInterest * market.uiPrice,
                                )}
                              </p>
                            </>
                          ) : (
                            <>
                              <p>–</p>
                              <p className="text-th-fgd-4">–</p>
                            </>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex justify-end">
                          <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                        </div>
                      </Td>
                    </TrBody>
                  )
                },
              )}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="border-b border-th-bkg-3">
          {sortPerpMarkets(perpMarketsWithData, 'quote_volume_24h').map(
            (market) => {
              return (
                <MobilePerpMarketItem
                  key={market.publicKey.toString()}
                  loadingMarketData={isLoading}
                  market={market}
                />
              )
            },
          )}
        </div>
      )}
    </ContentBox>
  )
}

export default PerpMarketsTable

const MobilePerpMarketItem = ({
  market,
  loadingMarketData,
}: {
  market: PerpMarketWithMarketData
  loadingMarketData: boolean
}) => {
  const { t } = useTranslation('common')
  const { theme } = useThemeWrapper()
  const router = useRouter()
  const rate = usePerpFundingRate()

  const priceHistory = market?.marketData?.price_history

  const volumeData = market?.marketData?.quote_volume_24h

  const volume = volumeData ? volumeData : 0

  const symbol = market.name.split('-')[0]

  const openInterest = market.baseLotsToUi(market.openInterest)
  const isComingSoon = market.oracleLastUpdatedSlot == 0
  const isUp =
    priceHistory && priceHistory.length
      ? market.uiPrice >= priceHistory[0].price
      : false

  let fundingRate: string
  let fundingRateApr: string
  if (rate.isSuccess) {
    const marketRate = rate?.data?.find(
      (r) => r.market_index === market.perpMarketIndex,
    )
    if (marketRate) {
      fundingRate = formatFunding.format(marketRate.funding_rate_hourly)
      fundingRateApr = formatFunding.format(
        marketRate.funding_rate_hourly * 8760,
      )
    } else {
      fundingRate = '–'
      fundingRateApr = '–'
    }
  } else {
    fundingRate = '–'
    fundingRateApr = '–'
  }

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`w-full border-t border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex shrink-0 items-center">
                  <MarketLogos market={market} />
                </div>
                <p className="mr-2 leading-none text-th-fgd-1">{market.name}</p>
                {isComingSoon ? <SoonBadge /> : null}
              </div>
              <div className="flex items-center space-x-3">
                {!loadingMarketData ? (
                  priceHistory && priceHistory.length ? (
                    <div className="ml-4 h-10 w-20">
                      <SimpleAreaChart
                        color={isUp ? COLORS.UP[theme] : COLORS.DOWN[theme]}
                        data={priceHistory.concat([
                          {
                            time: new Date().toString(),
                            price: market.uiPrice,
                          },
                        ])}
                        name={symbol}
                        xKey="time"
                        yKey="price"
                      />
                    </div>
                  ) : symbol === 'USDC' || symbol === 'USDT' ? null : (
                    <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                  )
                ) : (
                  <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
                )}
                <div className="flex flex-col items-end">
                  <p className="font-mono text-th-fgd-2">
                    {market.uiPrice ? (
                      <FormatNumericValue value={market.uiPrice} isUsd />
                    ) : (
                      '–'
                    )}
                  </p>
                  <MarketChange market={market} />
                </div>
                <ChevronDownIcon
                  className={`${
                    open ? 'rotate-180' : 'rotate-0'
                  } h-6 w-6 shrink-0 text-th-fgd-3`}
                />
              </div>
            </div>
          </Disclosure.Button>
          <Transition
            enter="transition ease-in duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
          >
            <Disclosure.Panel>
              <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 py-4">
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">{t('price')}</p>
                  <p className="font-mono text-th-fgd-2">
                    {market.uiPrice ? (
                      <FormatNumericValue value={market.uiPrice} isUsd />
                    ) : (
                      '–'
                    )}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:24h-volume')}
                  </p>
                  <p className="font-mono text-th-fgd-2">
                    {volume ? (
                      <span>{numberCompacter.format(volume)}</span>
                    ) : (
                      '$0'
                    )}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:funding-rate')}
                  </p>
                  {fundingRate !== '–' ? (
                    <Tooltip
                      content={
                        <>
                          {fundingRateApr ? (
                            <div className="">
                              The 1hr rate as an APR is{' '}
                              <span className="font-mono text-th-fgd-2">
                                {fundingRateApr}
                              </span>
                            </div>
                          ) : null}
                          <div className="mt-2">
                            Funding is paid continuously. The 1hr rate displayed
                            is a rolling average of the past 60 mins.
                          </div>
                          <div className="mt-2">
                            When positive, longs will pay shorts and when
                            negative shorts pay longs.
                          </div>
                        </>
                      }
                    >
                      <span className="tooltip-underline font-mono text-th-fgd-2">
                        {fundingRate}
                      </span>
                    </Tooltip>
                  ) : (
                    <p className="text-th-fgd-2">–</p>
                  )}
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:open-interest')}
                  </p>
                  {openInterest ? (
                    <p className="font-mono text-th-fgd-2">
                      <FormatNumericValue
                        value={openInterest}
                        decimals={getDecimalCount(market.minOrderSize)}
                      />
                      <span className="mx-1 text-th-fgd-4">|</span>$
                      {numberCompacter.format(openInterest * market.uiPrice)}
                    </p>
                  ) : (
                    <p className="text-th-fgd-2">–</p>
                  )}
                </div>
                <div className="col-span-1">
                  <LinkButton
                    className="flex items-center"
                    onClick={() => goToPerpMarketDetails(market.name, router)}
                  >
                    {t('token:token-stats', { token: market.name })}
                    <ChevronRightIcon className="ml-2 h-5 w-5" />
                  </LinkButton>
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
