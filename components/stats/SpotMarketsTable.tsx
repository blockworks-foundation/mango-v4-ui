import { useTranslation } from 'next-i18next'
import { useMemo } from 'react'
import { useViewport } from '../../hooks/useViewport'
import { COLORS } from '../../styles/colors'
import { breakpoints } from '../../utils/theme'
import ContentBox from '../shared/ContentBox'
import MarketLogos from '@components/trade/MarketLogos'
import useMangoGroup from 'hooks/useMangoGroup'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { floorToDecimal, getDecimalCount, numberCompacter } from 'utils/numbers'
import SimpleAreaChart from '@components/shared/SimpleAreaChart'
import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import MarketChange from '@components/shared/MarketChange'
import useThemeWrapper from 'hooks/useThemeWrapper'
import useListedMarketsWithMarketData, {
  SerumMarketWithMarketData,
} from 'hooks/useListedMarketsWithMarketData'
import { sortSpotMarkets } from 'utils/markets'

const SpotMarketsTable = () => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { theme } = useThemeWrapper()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const { serumMarketsWithData, isLoading, isFetching } =
    useListedMarketsWithMarketData()

  const loadingMarketData = isLoading || isFetching

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('market')}</Th>
              <Th className="text-right">{t('price')}</Th>
              <Th className="text-right">{t('rolling-change')}</Th>
              <Th className="hidden text-right md:block"></Th>
              <Th className="text-right">{t('trade:24h-volume')}</Th>
            </TrHead>
          </thead>
          <tbody>
            {sortSpotMarkets(serumMarketsWithData, 'quote_volume_24h').map(
              (mkt) => {
                const baseBank = group?.getFirstBankByTokenIndex(
                  mkt.baseTokenIndex,
                )
                const quoteBank = group?.getFirstBankByTokenIndex(
                  mkt.quoteTokenIndex,
                )
                const market = group?.getSerum3ExternalMarket(
                  mkt.serumMarketExternal,
                )
                let price
                if (baseBank && market && quoteBank) {
                  price = floorToDecimal(
                    baseBank.uiPrice / quoteBank.uiPrice,
                    getDecimalCount(market.tickSize),
                  ).toNumber()
                }

                const priceHistory = mkt?.marketData?.price_history

                const volumeData = mkt?.marketData?.quote_volume_24h

                const volume = volumeData ? volumeData : 0

                const isUp =
                  price && priceHistory && priceHistory.length
                    ? price >= priceHistory[0].price
                    : false

                return (
                  <TrBody key={mkt.publicKey.toString()}>
                    <Td>
                      <div className="flex items-center">
                        <MarketLogos market={mkt} size="large" />
                        <p className="font-body">{mkt.name}</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col text-right">
                        <p>
                          {price ? (
                            <>
                              <FormatNumericValue
                                value={price}
                                isUsd={quoteBank?.name === 'USDC'}
                              />{' '}
                              {quoteBank?.name !== 'USDC' ? (
                                <span className="font-body text-th-fgd-4">
                                  {quoteBank?.name}
                                </span>
                              ) : null}
                            </>
                          ) : (
                            '–'
                          )}
                        </p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex flex-col items-end">
                        <MarketChange market={mkt} />
                      </div>
                    </Td>
                    <Td>
                      {!loadingMarketData ? (
                        priceHistory && priceHistory.length ? (
                          <div className="h-10 w-24">
                            <SimpleAreaChart
                              color={
                                isUp ? COLORS.UP[theme] : COLORS.DOWN[theme]
                              }
                              data={priceHistory}
                              name={baseBank!.name + quoteBank!.name}
                              xKey="time"
                              yKey="price"
                            />
                          </div>
                        ) : baseBank?.name === 'USDC' ||
                          baseBank?.name === 'USDT' ? null : (
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
                          {volume ? (
                            <span>
                              {numberCompacter.format(volume)}{' '}
                              <span className="font-body text-th-fgd-4">
                                {quoteBank?.name}
                              </span>
                            </span>
                          ) : (
                            <span>
                              0{' '}
                              <span className="font-body text-th-fgd-4">
                                {quoteBank?.name}
                              </span>
                            </span>
                          )}
                        </p>
                      </div>
                    </Td>
                  </TrBody>
                )
              },
            )}
          </tbody>
        </Table>
      ) : (
        <div className="border-b border-th-bkg-3">
          {sortSpotMarkets(serumMarketsWithData, 'quote_volume_24h').map(
            (market) => {
              return (
                <MobileSpotMarketItem
                  key={market.publicKey.toString()}
                  loadingMarketData={loadingMarketData}
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

export default SpotMarketsTable

const MobileSpotMarketItem = ({
  market,
  loadingMarketData,
}: {
  market: SerumMarketWithMarketData
  loadingMarketData: boolean
}) => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { theme } = useThemeWrapper()
  const baseBank = group?.getFirstBankByTokenIndex(market.baseTokenIndex)
  const quoteBank = group?.getFirstBankByTokenIndex(market.quoteTokenIndex)
  const serumMarket = group?.getSerum3ExternalMarket(market.serumMarketExternal)

  const price = useMemo(() => {
    if (!baseBank || !quoteBank || !serumMarket) return 0
    return floorToDecimal(
      baseBank.uiPrice / quoteBank.uiPrice,
      getDecimalCount(serumMarket.tickSize),
    ).toNumber()
  }, [baseBank, quoteBank, serumMarket])

  const priceHistory = market?.marketData?.price_history

  const volueData = market?.marketData?.quote_volume_24h

  const volume = volueData ? volueData : 0

  const isUp =
    price && priceHistory && priceHistory.length
      ? price >= priceHistory[0].price
      : false

  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`w-full border-t border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex flex-shrink-0 items-center">
                  <MarketLogos market={market} />
                </div>
                <p className="leading-none text-th-fgd-1">{market.name}</p>
              </div>
              <div className="flex items-center space-x-3">
                {!loadingMarketData ? (
                  priceHistory && priceHistory.length ? (
                    <div className="h-10 w-20">
                      <SimpleAreaChart
                        color={isUp ? COLORS.UP[theme] : COLORS.DOWN[theme]}
                        data={priceHistory}
                        name={baseBank!.name + quoteBank!.name}
                        xKey="time"
                        yKey="price"
                      />
                    </div>
                  ) : (
                    <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                  )
                ) : (
                  <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
                )}
                <MarketChange market={market} />
                <ChevronDownIcon
                  className={`${
                    open ? 'rotate-180' : 'rotate-360'
                  } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
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
              <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pt-4 pb-4">
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">{t('price')}</p>
                  <p className="font-mono text-th-fgd-2">
                    {price ? (
                      <>
                        <FormatNumericValue
                          value={price}
                          isUsd={quoteBank?.name === 'USDC'}
                        />{' '}
                        {quoteBank?.name !== 'USDC' ? (
                          <span className="font-body text-th-fgd-4">
                            {quoteBank?.name}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      '-'
                    )}
                  </p>
                </div>
                <div className="col-span-1">
                  <p className="text-xs text-th-fgd-3">
                    {t('trade:24h-volume')}
                  </p>
                  <p className="font-mono text-th-fgd-2">
                    {volume ? (
                      <span>
                        {numberCompacter.format(volume)}{' '}
                        <span className="font-body text-th-fgd-4">
                          {quoteBank?.name}
                        </span>
                      </span>
                    ) : (
                      <span>
                        0{' '}
                        <span className="font-body text-th-fgd-4">
                          {quoteBank?.name}
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </Disclosure.Panel>
          </Transition>
        </>
      )}
    </Disclosure>
  )
}
