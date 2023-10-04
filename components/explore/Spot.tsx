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
dayjs.extend(relativeTime)

export type BankWithMarketData = {
  bank: Bank
  market: SerumMarketWithMarketData | undefined
}

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
    const aValue: number | undefined = a?.market?.marketData?.[sortByKey]
    const bValue: number | undefined = b?.market?.marketData?.[sortByKey]

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
  const { serumMarketsWithData } = useListedMarketsWithMarketData()
  const [sortByKey, setSortByKey] = useState<AllowedKeys>('quote_volume_24h')
  const [search, setSearch] = useState('')
  const [showTableView, setShowTableView] = useState(false)

  const banksWithMarketData = useMemo(() => {
    if (!group || !serumMarketsWithData.length) return []
    const banksWithMarketData = []
    const banks = Array.from(group.banksMapByMint)
      .map(([_mintAddress, banks]) => banks)
      .map((b) => b[0])
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
  }, [group, serumMarketsWithData])

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
    if (!newlyListedMintInfo.length || !serumMarketsWithData.length) return []
    const newlyListed = []
    for (const listing of newlyListedMintInfo) {
      const market = serumMarketsWithData.find(
        (market) => market.baseTokenIndex === listing.tokenIndex,
      )
      if (market) {
        newlyListed.push(market)
      }
    }
    return newlyListed
  }, [newlyListedMintInfo, serumMarketsWithData])

  const [gainers, losers] = useMemo(() => {
    if (!serumMarketsWithData.length) return [[], []]
    const sortByChange = serumMarketsWithData
      .filter((market) => market.quoteTokenIndex === 0)
      .sort((a, b) => {
        const rollingChangeA = a.rollingChange || 0
        const rollingChangeB = b.rollingChange || 0
        return rollingChangeB - rollingChangeA
      })
    const gainers = sortByChange.slice(0, 3).filter((item) => {
      const change = item.rollingChange || 0
      return change > 0
    })
    const losers = sortByChange
      .slice(-3)
      .reverse()
      .filter((item) => {
        const change = item.rollingChange || 0
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
        <div className="col-span-12 rounded-lg border border-th-bkg-3 p-6 lg:col-span-4">
          <div className="mb-4 flex items-center space-x-2">
            <BoltIcon className="h-5 w-5" />
            <h2 className="text-base">{t('explore:recently-listed')}</h2>
          </div>
          <div className="border-t border-th-bkg-3">
            {newlyListed.map((listing) => {
              const bank = group?.getFirstBankByTokenIndex(
                listing.baseTokenIndex,
              )
              const mintInfo = newlyListedMintInfo.find(
                (info) => info.tokenIndex === listing.baseTokenIndex,
              )
              let timeSinceListing = ''
              if (mintInfo) {
                timeSinceListing = dayjs().to(
                  mintInfo.registrationTime.toNumber() * 1000,
                )
              }
              if (!bank) return null
              return (
                <div
                  className="default-transition flex h-16 cursor-pointer items-center justify-between border-b border-th-bkg-3 px-4 md:hover:bg-th-bkg-2"
                  key={listing.baseTokenIndex}
                  onClick={() => goToTokenPage(bank.name.split(' ')[0], router)}
                >
                  <div className="flex items-center">
                    <TokenLogo bank={bank} />
                    <p className="ml-3 font-body text-th-fgd-2">{bank.name}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3">
                      <span className="text-th-fgd-3">{timeSinceListing}</span>
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="col-span-12 rounded-lg border border-th-bkg-3 p-6 lg:col-span-4">
          <div className="mb-4 flex items-center space-x-2">
            <RocketLaunchIcon className="h-5 w-5" />
            <h2 className="text-base">{t('explore:gainers')}</h2>
          </div>
          <div className="border-t border-th-bkg-3">
            {gainers.map((gainer) => {
              const bank = group?.getFirstBankByTokenIndex(
                gainer.baseTokenIndex,
              )
              if (!bank) return null
              return (
                <div
                  className="default-transition flex h-16 cursor-pointer items-center justify-between border-b border-th-bkg-3 px-4 md:hover:bg-th-bkg-2"
                  key={gainer.baseTokenIndex}
                  onClick={() => goToTokenPage(bank.name.split(' ')[0], router)}
                >
                  <div className="flex items-center">
                    <TokenLogo bank={bank} />
                    <p className="ml-3 font-body text-th-fgd-2">{bank.name}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 flex flex-col items-end">
                      <span className="font-mono">
                        <FormatNumericValue value={bank.uiPrice} isUsd />
                      </span>
                      <Change change={gainer.rollingChange || 0} suffix="%" />
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="col-span-12 rounded-lg border border-th-bkg-3 p-6 lg:col-span-4">
          <div className="mb-4 flex items-center space-x-2">
            <FaceFrownIcon className="h-5 w-5" />
            <h2 className="text-base">{t('explore:losers')}</h2>
          </div>
          <div className="border-t border-th-bkg-3">
            {losers.map((loser) => {
              const bank = group?.getFirstBankByTokenIndex(loser.baseTokenIndex)
              if (!bank) return null
              return (
                <div
                  className="default-transition flex h-16 cursor-pointer items-center justify-between border-b border-th-bkg-3 px-4 md:hover:bg-th-bkg-2"
                  key={loser.baseTokenIndex}
                  onClick={() => goToTokenPage(bank.name.split(' ')[0], router)}
                >
                  <div className="flex items-center">
                    <TokenLogo bank={bank} />
                    <p className="ml-3 font-body text-th-fgd-2">{bank.name}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 flex flex-col items-end">
                      <span className="font-mono">
                        <FormatNumericValue value={bank.uiPrice} isUsd />
                      </span>
                      <Change change={loser.rollingChange || 0} suffix="%" />
                    </div>
                    <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                  </div>
                </div>
              )
            })}
          </div>
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
                    !showTableView ? 'bg-th-bkg-3 text-th-active' : ''
                  }`}
                  onClick={() => setShowTableView(!showTableView)}
                >
                  <Squares2X2Icon className="h-5 w-5" />
                </button>
                <button
                  className={`flex w-10 items-center justify-center rounded-r-md border border-th-bkg-3 focus:outline-none md:hover:bg-th-bkg-3 ${
                    showTableView ? 'bg-th-bkg-3 text-th-active' : ''
                  }`}
                  onClick={() => setShowTableView(!showTableView)}
                >
                  <TableCellsIcon className="h-5 w-5" />
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
