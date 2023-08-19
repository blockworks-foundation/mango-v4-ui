import FavoriteMarketButton from '@components/shared/FavoriteMarketButton'
import { Popover } from '@headlessui/react'
import { ChevronDownIcon, MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  floorToDecimal,
  formatCurrencyValue,
  formatNumericValue,
  getDecimalCount,
  numberCompacter,
} from 'utils/numbers'
import MarketLogos from './MarketLogos'
import SoonBadge from '@components/shared/SoonBadge'
import TabButtons from '@components/shared/TabButtons'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import Loading from '@components/shared/Loading'
import MarketChange from '@components/shared/MarketChange'
import SheenLoader from '@components/shared/SheenLoader'
// import Select from '@components/forms/Select'
import useListedMarketsWithMarketData, {
  SerumMarketWithMarketData,
} from 'hooks/useListedMarketsWithMarketData'
import { AllowedKeys, sortPerpMarkets, sortSpotMarkets } from 'utils/markets'
import Input from '@components/forms/Input'

const MARKET_LINK_CLASSES =
  'grid grid-cols-3 md:grid-cols-4 flex items-center w-full py-2 px-4 rounded-r-md focus:outline-none focus-visible:text-th-active md:hover:cursor-pointer md:hover:bg-th-bkg-3 md:hover:text-th-fgd-1'

const MARKET_LINK_DISABLED_CLASSES =
  'flex w-full items-center justify-between py-2 px-4 md:hover:cursor-not-allowed'

// const SORT_KEYS = [
//   'quote_volume_24h',
//   'quote_volume_1h',
//   'change_24h',
//   'change_1h',
// ]

const generateSearchTerm = (
  item: SerumMarketWithMarketData,
  searchValue: string,
) => {
  const normalizedSearchValue = searchValue.toLowerCase()
  const value = item.name.toLowerCase()

  const isMatchingWithName =
    item.name.toLowerCase().indexOf(normalizedSearchValue) >= 0
  const matchingSymbolPercent = isMatchingWithName
    ? normalizedSearchValue.length / item.name.length
    : 0

  return {
    token: item,
    matchingIdx: value.indexOf(normalizedSearchValue),
    matchingSymbolPercent,
  }
}

const startSearch = (
  items: SerumMarketWithMarketData[],
  searchValue: string,
) => {
  return items
    .map((item) => generateSearchTerm(item, searchValue))
    .filter((item) => item.matchingIdx >= 0)
    .sort((i1, i2) => i1.matchingIdx - i2.matchingIdx)
    .sort((i1, i2) => i2.matchingSymbolPercent - i1.matchingSymbolPercent)
    .map((item) => item.token)
}

const MarketSelectDropdown = () => {
  const { t } = useTranslation('common')
  const { selectedMarket } = useSelectedMarket()
  const [spotOrPerp, setSpotOrPerp] = useState(
    selectedMarket instanceof PerpMarket ? 'perp' : 'spot',
  )
  const [sortByKey] = useState<AllowedKeys>('quote_volume_24h')
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { group } = useMangoGroup()
  const [spotBaseFilter, setSpotBaseFilter] = useState('All')
  const { perpMarketsWithData, serumMarketsWithData, isLoading, isFetching } =
    useListedMarketsWithMarketData()
  const focusRef = useRef<HTMLInputElement>(null)

  const perpMarketsToShow = useMemo(() => {
    if (!perpMarketsWithData.length) return []
    return sortPerpMarkets(perpMarketsWithData, sortByKey)
  }, [perpMarketsWithData, sortByKey])

  const spotBaseTokens: string[] = useMemo(() => {
    if (serumMarketsWithData.length) {
      const baseTokens: string[] = ['All']
      serumMarketsWithData.map((m) => {
        const base = m.name.split('/')[1]
        if (!baseTokens.includes(base)) {
          baseTokens.push(base)
        }
      })
      return baseTokens.sort((a, b) => a.localeCompare(b))
    }
    return ['All']
  }, [serumMarketsWithData])

  const serumMarketsToShow = useMemo(() => {
    if (!serumMarketsWithData.length) return []
    if (spotBaseFilter !== 'All') {
      const filteredMarkets = serumMarketsWithData.filter((m) => {
        const base = m.name.split('/')[1]
        return base === spotBaseFilter
      })
      return search
        ? startSearch(filteredMarkets, search)
        : sortSpotMarkets(filteredMarkets, sortByKey)
    } else {
      return search
        ? startSearch(serumMarketsWithData, search)
        : sortSpotMarkets(serumMarketsWithData, sortByKey)
    }
  }, [search, serumMarketsWithData, sortByKey, spotBaseFilter])

  const handleUpdateSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  useEffect(() => {
    if (focusRef?.current && spotOrPerp === 'spot') {
      focusRef.current.focus()
    }
  }, [focusRef, isOpen, spotOrPerp])

  const loadingMarketData = isLoading || isFetching

  return (
    <Popover>
      {({ open, close }) => (
        <div
          className="relative flex flex-col overflow-visible md:-ml-2"
          id="trade-step-one"
        >
          <Popover.Button
            className="-ml-4 flex h-12 items-center justify-between px-4 focus-visible:bg-th-bkg-3 disabled:cursor-not-allowed disabled:opacity-60 md:hover:bg-th-bkg-2 disabled:md:hover:bg-th-bkg-1"
            disabled={!group}
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="flex items-center">
              {selectedMarket ? (
                <MarketLogos market={selectedMarket} />
              ) : (
                <Loading className="mr-2 h-5 w-5 flex-shrink-0" />
              )}
              <div className="whitespace-nowrap text-xl font-bold text-th-fgd-1 md:text-base">
                {selectedMarket?.name || (
                  <span className="text-th-fgd-3">{t('loading')}</span>
                )}
              </div>
            </div>
            <ChevronDownIcon
              className={`${
                open ? 'rotate-180' : 'rotate-360'
              } ml-2 mt-0.5 h-6 w-6 flex-shrink-0 text-th-fgd-2`}
            />
          </Popover.Button>
          <Popover.Panel className="absolute -left-4 top-12 z-40 w-screen border-y border-th-bkg-3 bg-th-bkg-2 md:w-[560px] md:border-r">
            <div className="border-b border-th-bkg-3">
              <TabButtons
                activeValue={spotOrPerp}
                onChange={(v) => setSpotOrPerp(v)}
                values={[
                  ['perp', 0],
                  ['spot', 0],
                ]}
                fillWidth
              />
            </div>
            <div className="thin-scroll max-h-[calc(100vh-160px)] overflow-auto py-3">
              {spotOrPerp === 'perp' && perpMarketsToShow.length ? (
                <>
                  <div className="mb-2 grid grid-cols-3 border-b border-th-bkg-3 pb-1 pl-4 pr-14 text-xxs md:grid-cols-4">
                    <p className="col-span-1">{t('market')}</p>
                    <p className="col-span-1 text-right">{t('price')}</p>
                    <p className="col-span-1 text-right">
                      {t('rolling-change')}
                    </p>
                    <p className="col-span-1 hidden text-right md:block">
                      {t('daily-volume')}
                    </p>
                  </div>
                  {perpMarketsToShow.map((m) => {
                    const isComingSoon = m.oracleLastUpdatedSlot == 0

                    const volumeData = m?.marketData?.quote_volume_24h

                    const volume = volumeData ? volumeData : 0

                    return (
                      <div className="flex w-full items-center" key={m.name}>
                        {!isComingSoon ? (
                          <>
                            <Link
                              className={MARKET_LINK_CLASSES}
                              href={{
                                pathname: '/trade',
                                query: { name: m.name },
                              }}
                              onClick={() => {
                                close()
                                setSearch('')
                              }}
                              shallow={true}
                            >
                              <div className="col-span-1 flex items-center">
                                <MarketLogos market={m} size="small" />
                                <span className="text-xs text-th-fgd-2">
                                  {m.name}
                                </span>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <span className="font-mono text-xs text-th-fgd-2">
                                  {formatCurrencyValue(
                                    m.uiPrice,
                                    getDecimalCount(m.tickSize),
                                  )}
                                </span>
                              </div>
                              <div className="col-span-1 flex justify-end">
                                <MarketChange market={m} size="small" />
                              </div>
                              <div className="col-span-1 hidden justify-end md:flex">
                                {loadingMarketData ? (
                                  <SheenLoader className="mt-0.5">
                                    <div className="h-3.5 w-12 bg-th-bkg-2" />
                                  </SheenLoader>
                                ) : (
                                  <span>
                                    {volume ? (
                                      <span className="font-mono text-xs text-th-fgd-2">
                                        ${numberCompacter.format(volume)}
                                      </span>
                                    ) : (
                                      <span className="font-mono text-xs text-th-fgd-2">
                                        $0
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </Link>
                            <div className="px-3">
                              <FavoriteMarketButton market={m} />
                            </div>
                          </>
                        ) : (
                          <span className={MARKET_LINK_DISABLED_CLASSES}>
                            <div className="flex items-center">
                              <MarketLogos market={m} size="small" />
                              <span className="mr-2 text-xs">{m.name}</span>
                              <SoonBadge />
                            </div>
                          </span>
                        )}
                      </div>
                    )
                  })}
                </>
              ) : null}
              {spotOrPerp === 'spot' && serumMarketsToShow.length ? (
                <>
                  <div className="mb-3 flex items-center justify-between px-4">
                    <div className="relative w-1/2">
                      <Input
                        className="h-8 pl-8"
                        type="text"
                        value={search}
                        onChange={handleUpdateSearch}
                        ref={focusRef}
                      />
                      <MagnifyingGlassIcon className="absolute left-2 top-2 h-4 w-4" />
                    </div>
                    <div>
                      {spotBaseTokens.map((tab) => (
                        <button
                          className={`rounded-md px-2.5 py-1.5 text-sm font-medium focus-visible:bg-th-bkg-3 focus-visible:text-th-fgd-1 ${
                            spotBaseFilter === tab
                              ? 'bg-th-bkg-3 text-th-active md:hover:text-th-active'
                              : 'text-th-fgd-3 md:hover:text-th-fgd-2'
                          }`}
                          onClick={() => setSpotBaseFilter(tab)}
                          key={tab}
                        >
                          {t(tab)}
                        </button>
                      ))}
                    </div>
                    {/* need to sort out change before enabling more sorting options */}
                    {/* <div>
                      <Select
                        value={sortByKey}
                        onChange={(sortBy) => setSortByKey(sortBy)}
                        className="w-full"
                      >
                        {SORT_KEYS.map((sortBy) => {
                          return (
                            <Select.Option key={sortBy} value={sortBy}>
                              <div className="flex w-full items-center justify-between">
                                {sortBy}
                              </div>
                            </Select.Option>
                          )
                        })}
                      </Select>
                    </div> */}
                  </div>
                  <div className="mb-2 grid grid-cols-3 border-b border-th-bkg-3 pb-1 pl-4 pr-14 text-xxs md:grid-cols-4">
                    <p className="col-span-1">{t('market')}</p>
                    <p className="col-span-1 text-right">{t('price')}</p>
                    <p className="col-span-1 text-right">
                      {t('rolling-change')}
                    </p>
                    <p className="col-span-1 hidden text-right md:block">
                      {t('daily-volume')}
                    </p>
                  </div>
                  {serumMarketsToShow.map((m) => {
                    const baseBank = group?.getFirstBankByTokenIndex(
                      m.baseTokenIndex,
                    )
                    const quoteBank = group?.getFirstBankByTokenIndex(
                      m.quoteTokenIndex,
                    )
                    const market = group?.getSerum3ExternalMarket(
                      m.serumMarketExternal,
                    )
                    let price
                    if (baseBank && market && quoteBank) {
                      price = floorToDecimal(
                        baseBank.uiPrice / quoteBank.uiPrice,
                        getDecimalCount(market.tickSize),
                      ).toNumber()
                    }

                    const volumeData = m?.marketData?.quote_volume_24h

                    const volume = volumeData ? volumeData : 0

                    return (
                      <div className="flex w-full items-center" key={m.name}>
                        <Link
                          className={MARKET_LINK_CLASSES}
                          href={{
                            pathname: '/trade',
                            query: { name: m.name },
                          }}
                          onClick={() => {
                            close()
                            setSearch('')
                          }}
                          shallow={true}
                        >
                          <div className="col-span-1 flex items-center">
                            <MarketLogos market={m} size="small" />
                            <span className="text-xs text-th-fgd-2">
                              {m.name}
                            </span>
                          </div>
                          <div className="col-span-1 flex justify-end">
                            {price && market?.tickSize ? (
                              <span className="font-mono text-xs text-th-fgd-2">
                                {quoteBank?.name === 'USDC' ? '$' : ''}
                                {getDecimalCount(market.tickSize) <= 6
                                  ? formatNumericValue(
                                      price,
                                      getDecimalCount(market.tickSize),
                                    )
                                  : price.toExponential(3)}
                                {quoteBank?.name !== 'USDC' ? (
                                  <span className="font-body text-th-fgd-3">
                                    {' '}
                                    {quoteBank?.name}
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <MarketChange market={m} size="small" />
                          </div>
                          <div className="col-span-1 hidden justify-end md:flex">
                            {loadingMarketData ? (
                              <SheenLoader className="mt-0.5">
                                <div className="h-3.5 w-12 bg-th-bkg-2" />
                              </SheenLoader>
                            ) : (
                              <span className="font-mono text-xs text-th-fgd-2">
                                {quoteBank?.name === 'USDC' ? '$' : ''}
                                {volume ? numberCompacter.format(volume) : 0}
                                {quoteBank?.name !== 'USDC' ? (
                                  <span className="font-body text-th-fgd-3">
                                    {' '}
                                    {quoteBank?.name}
                                  </span>
                                ) : null}
                              </span>
                            )}
                          </div>
                        </Link>
                        <div className="px-3">
                          <FavoriteMarketButton market={m} />
                        </div>
                      </div>
                    )
                  })}
                </>
              ) : null}
            </div>
          </Popover.Panel>
        </div>
      )}
    </Popover>
  )
}

export default MarketSelectDropdown
