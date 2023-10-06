import Change from '@components/shared/Change'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import TokenLogo from '@components/shared/TokenLogo'
import useListedMarketsWithMarketData, {
  SerumMarketWithMarketData,
} from 'hooks/useListedMarketsWithMarketData'
import useMangoGroup from 'hooks/useMangoGroup'
import { useRouter } from 'next/router'
import { ChangeEvent, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import SpotTable from './SpotTable'
import { goToTokenPage } from '@components/stats/tokens/TokenOverviewTable'
import {
  BoltIcon,
  ChevronRightIcon,
  FaceFrownIcon,
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  Squares2X2Icon,
  TableCellsIcon,
} from '@heroicons/react/20/solid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { AllowedKeys } from 'utils/markets'
import ButtonGroup from '@components/forms/ButtonGroup'
import SpotCards from './SpotCards'
import Input from '@components/forms/Input'
import EmptyState from '@components/nftMarket/EmptyState'
import { Bank } from '@blockworks-foundation/mango-v4'
import Link from 'next/link'
import useBanks from 'hooks/useBanks'
import SheenLoader from '@components/shared/SheenLoader'
import mangoStore from '@store/mangoStore'
dayjs.extend(relativeTime)

export type BankWithMarketData = {
  bank: Bank
  market: SerumMarketWithMarketData | undefined
}

const CALLOUT_TILES_WRAPPER_CLASSES =
  'col-span-12 flex flex-col rounded-lg border border-th-bkg-3 p-6 lg:col-span-4'

const generateSearchTerm = (item: BankWithMarketData, searchValue: string) => {
  const normalizedSearchValue = searchValue.toLowerCase()
  const value = item.bank.name.toLowerCase()

  const isMatchingWithName =
    item.bank.name.toLowerCase().indexOf(normalizedSearchValue) >= 0
  const matchingSymbolPercent = isMatchingWithName
    ? normalizedSearchValue.length / item.bank.name.length
    : 0

  return {
    token: item,
    matchingIdx: value.indexOf(normalizedSearchValue),
    matchingSymbolPercent,
  }
}

const startSearch = (items: BankWithMarketData[], searchValue: string) => {
  return items
    .map((item) => generateSearchTerm(item, searchValue))
    .filter((item) => item.matchingIdx >= 0)
    .sort((i1, i2) => i1.matchingIdx - i2.matchingIdx)
    .sort((i1, i2) => i2.matchingSymbolPercent - i1.matchingSymbolPercent)
    .map((item) => item.token)
}

const sortTokens = (tokens: BankWithMarketData[], sortByKey: AllowedKeys) => {
  return tokens.sort((a: BankWithMarketData, b: BankWithMarketData) => {
    let aValue: number | undefined
    let bValue: number | undefined
    if (sortByKey === 'change_24h') {
      const aPrice = a?.bank?.uiPrice || 0
      const bPrice = b?.bank?.uiPrice || 0
      const aPastPrice = a.market?.marketData?.price_24h
      const bPastPrice = b.market?.marketData?.price_24h
      const aVolume = a.market?.marketData?.quote_volume_24h || 0
      const bVolume = b.market?.marketData?.quote_volume_24h || 0
      aValue =
        aVolume > 0 && aPastPrice
          ? ((aPrice - aPastPrice) / aPastPrice) * 100
          : undefined
      bValue =
        bVolume > 0 && bPastPrice
          ? ((bPrice - bPastPrice) / bPastPrice) * 100
          : undefined
    } else {
      aValue = a?.market?.marketData?.[sortByKey]
      bValue = b?.market?.marketData?.[sortByKey]
    }
    // Handle marketData[sortByKey] is undefined
    if (typeof aValue === 'undefined' && typeof bValue === 'undefined') {
      return 0 // Consider them equal
    }
    if (typeof aValue === 'undefined') {
      return 1 // b should come before a
    }
    if (typeof bValue === 'undefined') {
      return -1 // a should come before b
    }

    return bValue - aValue
  })
}

const Spot = () => {
  const { t } = useTranslation(['common', 'explore', 'trade'])
  const router = useRouter()
  const { group } = useMangoGroup()
  const { banks } = useBanks()
  const { serumMarketsWithData, isLoading: loadingSerumMarkets } =
    useListedMarketsWithMarketData()
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const [sortByKey, setSortByKey] = useState<AllowedKeys>('quote_volume_24h')
  const [search, setSearch] = useState('')
  const [showTableView, setShowTableView] = useState(true)

  const banksWithMarketData = useMemo(() => {
    if (!banks.length || !group || !serumMarketsWithData.length) return []
    const banksWithMarketData = []
    const usdcQuoteMarkets = serumMarketsWithData.filter(
      (market) => market.quoteTokenIndex === 0,
    )
    for (const bank of banks) {
      const market = usdcQuoteMarkets.find(
        (market) => market.baseTokenIndex === bank.tokenIndex,
      )
      if (market) {
        banksWithMarketData.push({ bank, market })
      } else {
        banksWithMarketData.push({ bank, market: undefined })
      }
    }
    return banksWithMarketData
  }, [banks, group, serumMarketsWithData])

  const newlyListedMintInfo = useMemo(() => {
    if (!group) return []
    const mintInfos = Array.from(group.mintInfosMapByTokenIndex).map(
      ([, mintInfo]) => mintInfo,
    )
    const sortByRegistrationTime = mintInfos
      .sort((a, b) => {
        return b.registrationTime.toNumber() - a.registrationTime.toNumber()
      })
      .slice(0, 3)
    return sortByRegistrationTime
  }, [group])

  const newlyListed = useMemo(() => {
    if (!newlyListedMintInfo.length || !banks.length) return []
    const newlyListed = []
    for (const listing of newlyListedMintInfo) {
      const bank = banks.find((bank) => bank.tokenIndex === listing.tokenIndex)
      if (bank) {
        newlyListed.push(bank)
      }
    }
    return newlyListed
  }, [newlyListedMintInfo, banks])

  const [gainers, losers] = useMemo(() => {
    if (!serumMarketsWithData.length) return [[], []]
    const sortByChange = serumMarketsWithData
      .filter((market) => market.quoteTokenIndex === 0)
      .sort((a, b) => {
        const rollingChangeA = a?.marketData?.change_24h || 0
        const rollingChangeB = b?.marketData?.change_24h || 0
        return rollingChangeB - rollingChangeA
      })
    const gainers = sortByChange.slice(0, 3).filter((item) => {
      const change = item?.marketData?.change_24h || 0
      return change > 0
    })
    const losers = sortByChange
      .slice(-3)
      .reverse()
      .filter((item) => {
        const change = item?.marketData?.change_24h || 0
        return change < 0
      })
    return [gainers, losers]
  }, [serumMarketsWithData])

  const sortedTokensToShow = useMemo(() => {
    if (!banksWithMarketData.length) return []
    return search
      ? startSearch(banksWithMarketData, search)
      : sortTokens(banksWithMarketData, sortByKey)
  }, [search, banksWithMarketData, sortByKey, showTableView])

  const handleUpdateSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-4 px-4 pb-8 md:px-6 2xl:px-12">
        <div className={CALLOUT_TILES_WRAPPER_CLASSES}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BoltIcon className="h-5 w-5" />
              <h2 className="text-base">{t('explore:recently-listed')}</h2>
            </div>
            <Link href="/governance/list" shallow>
              <span className="default-transition font-bold text-th-active md:hover:text-th-active-dark">
                {t('governance:list-token')}
              </span>
            </Link>
          </div>
          {groupLoaded ? (
            <div className="border-t border-th-bkg-3">
              {newlyListed.map((token) => {
                const mintInfo = newlyListedMintInfo.find(
                  (info) => info.tokenIndex === token.tokenIndex,
                )
                let timeSinceListing = ''
                if (mintInfo) {
                  timeSinceListing = dayjs().to(
                    mintInfo.registrationTime.toNumber() * 1000,
                  )
                }
                return (
                  <div
                    className="default-transition flex h-16 cursor-pointer items-center justify-between border-b border-th-bkg-3 px-4 md:hover:bg-th-bkg-2"
                    key={token.tokenIndex}
                    onClick={() =>
                      goToTokenPage(token.name.split(' ')[0], router)
                    }
                  >
                    <div className="flex items-center">
                      <TokenLogo bank={token} />
                      <p className="ml-3 font-body text-th-fgd-2">
                        {token.name}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="mr-3">
                        <span className="text-th-fgd-3">
                          {timeSinceListing}
                        </span>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <CalloutTilesLoader />
          )}
        </div>

        <div className={CALLOUT_TILES_WRAPPER_CLASSES}>
          <div className="mb-4 flex items-center space-x-2">
            <RocketLaunchIcon className="h-5 w-5" />
            <h2 className="text-base">{t('explore:gainers')}</h2>
          </div>
          {!loadingSerumMarkets && groupLoaded ? (
            <div className="h-full border-t border-th-bkg-3">
              {gainers.length ? (
                gainers.map((gainer) => {
                  const bank = group?.getFirstBankByTokenIndex(
                    gainer.baseTokenIndex,
                  )
                  if (!bank) return null
                  return (
                    <div
                      className="default-transition flex h-16 cursor-pointer items-center justify-between border-b border-th-bkg-3 px-4 md:hover:bg-th-bkg-2"
                      key={gainer.baseTokenIndex}
                      onClick={() =>
                        goToTokenPage(bank.name.split(' ')[0], router)
                      }
                    >
                      <div className="flex items-center">
                        <TokenLogo bank={bank} />
                        <p className="ml-3 font-body text-th-fgd-2">
                          {bank.name}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-3 flex flex-col items-end">
                          <span className="font-mono">
                            <FormatNumericValue value={bank.uiPrice} isUsd />
                          </span>
                          <Change
                            change={gainer?.marketData?.change_24h || 0}
                            suffix="%"
                          />
                        </div>
                        <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <FaceFrownIcon className="mb-1.5 h-5 w-5" />
                  <p>{t('explore:no-gainers')}</p>
                </div>
              )}
            </div>
          ) : (
            <CalloutTilesLoader />
          )}
        </div>

        <div className={CALLOUT_TILES_WRAPPER_CLASSES}>
          <div className="mb-4 flex items-center space-x-2">
            <FaceFrownIcon className="h-5 w-5" />
            <h2 className="text-base">{t('explore:losers')}</h2>
          </div>
          {!loadingSerumMarkets && groupLoaded ? (
            <div className="h-full border-t border-th-bkg-3">
              {losers.length ? (
                losers.map((loser) => {
                  const bank = group?.getFirstBankByTokenIndex(
                    loser.baseTokenIndex,
                  )
                  if (!bank) return null
                  return (
                    <div
                      className="default-transition flex h-16 cursor-pointer items-center justify-between border-b border-th-bkg-3 px-4 md:hover:bg-th-bkg-2"
                      key={loser.baseTokenIndex}
                      onClick={() =>
                        goToTokenPage(bank.name.split(' ')[0], router)
                      }
                    >
                      <div className="flex items-center">
                        <TokenLogo bank={bank} />
                        <p className="ml-3 font-body text-th-fgd-2">
                          {bank.name}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-3 flex flex-col items-end">
                          <span className="font-mono">
                            <FormatNumericValue value={bank.uiPrice} isUsd />
                          </span>
                          <Change
                            change={loser?.marketData?.change_24h || 0}
                            suffix="%"
                          />
                        </div>
                        <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex h-full flex-col items-center justify-center">
                  <RocketLaunchIcon className="mb-1.5 h-5 w-5" />
                  <p>{t('explore:no-losers')}</p>
                </div>
              )}
            </div>
          ) : (
            <CalloutTilesLoader />
          )}
        </div>
      </div>

      <div className="border-t border-th-bkg-3 pt-4">
        <div className="flex flex-col px-4 sm:flex-row sm:items-center sm:justify-between md:px-6 2xl:px-12">
          <h2 className="mb-4 text-base sm:mb-0">{t('tokens')}</h2>
          <div className="flex flex-col sm:flex-row sm:space-x-3">
            <div className="relative mb-3 w-full sm:mb-0 sm:w-40">
              <Input
                heightClass="h-10 pl-8"
                type="text"
                value={search}
                onChange={handleUpdateSearch}
              />
              <MagnifyingGlassIcon className="absolute left-2 top-3 h-4 w-4" />
            </div>
            <div className="flex space-x-3">
              <div className="w-full sm:w-48">
                <ButtonGroup
                  activeValue={sortByKey}
                  onChange={(v) => setSortByKey(v)}
                  names={[t('trade:24h-volume'), t('rolling-change')]}
                  values={['quote_volume_24h', 'change_24h']}
                />
              </div>
              <div className="flex">
                <button
                  className={`flex w-10 items-center justify-center rounded-l-md border border-th-bkg-3 focus:outline-none md:hover:bg-th-bkg-3 ${
                    showTableView ? 'bg-th-bkg-3 text-th-active' : ''
                  }`}
                  onClick={() => setShowTableView(!showTableView)}
                >
                  <TableCellsIcon className="h-5 w-5" />
                </button>
                <button
                  className={`flex w-10 items-center justify-center rounded-r-md border border-th-bkg-3 focus:outline-none md:hover:bg-th-bkg-3 ${
                    !showTableView ? 'bg-th-bkg-3 text-th-active' : ''
                  }`}
                  onClick={() => setShowTableView(!showTableView)}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
        {sortedTokensToShow.length ? (
          showTableView ? (
            <div className="mt-6 border-t border-th-bkg-3">
              <SpotTable tokens={sortedTokensToShow} />
            </div>
          ) : (
            <SpotCards tokens={sortedTokensToShow} />
          )
        ) : (
          <div className="px-4 pt-2 md:px-6 2xl:px-12">
            <EmptyState text="No results found..." />
          </div>
        )}
      </div>
    </>
  )
}

export default Spot

const CalloutTilesLoader = () => {
  return (
    <div className="space-y-1">
      {[...Array(3)].map((x, i) => (
        <SheenLoader className="flex flex-1" key={i}>
          <div className="h-16 w-full rounded-md bg-th-bkg-2" />
        </SheenLoader>
      ))}
    </div>
  )
}
