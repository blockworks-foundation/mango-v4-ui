import Change from '@components/shared/Change'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import useListedMarketsWithMarketData, {
  SerumMarketWithMarketData,
} from 'hooks/useListedMarketsWithMarketData'
import useMangoGroup from 'hooks/useMangoGroup'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { goToTokenPage } from '@components/stats/tokens/TokenOverviewTable'
import {
  ArrowDownTrayIcon,
  BoltIcon,
  ChevronRightIcon,
  FaceFrownIcon,
  RocketLaunchIcon,
} from '@heroicons/react/20/solid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { Bank } from '@blockworks-foundation/mango-v4'
import Link from 'next/link'
import useBanks from 'hooks/useBanks'
import SheenLoader from '@components/shared/SheenLoader'
import mangoStore from '@store/mangoStore'
import { goToPerpMarketDetails } from '@components/stats/perps/PerpMarketDetailsTable'
import MarketLogos from '@components/trade/MarketLogos'
import { TOKEN_REDUCE_ONLY_OPTIONS } from 'utils/constants'
import TableTokenName from '@components/shared/TableTokenName'
import { IconButton } from '@components/shared/Button'
import DepositWithdrawModal from '@components/modals/DepositWithdrawModal'
import useMangoAccount from 'hooks/useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import CreateAccountModal from '@components/modals/CreateAccountModal'
import Tooltip from '@components/shared/Tooltip'
dayjs.extend(relativeTime)

export type BankWithMarketData = {
  bank: Bank
  market: SerumMarketWithMarketData | undefined
}

const CALLOUT_TILES_WRAPPER_CLASSES =
  'col-span-12 flex flex-col rounded-lg border border-th-bkg-3 p-6 lg:col-span-4'

const RecentGainersLosers = () => {
  const { t } = useTranslation(['common', 'explore', 'trade'])
  const router = useRouter()
  const { group } = useMangoGroup()
  const { mangoAccountAddress } = useMangoAccount()
  const { connected } = useWallet()
  const { banks } = useBanks()
  const {
    serumMarketsWithData,
    perpMarketsWithData,
    isLoading: loadingSerumMarkets,
  } = useListedMarketsWithMarketData()
  const groupLoaded = mangoStore((s) => s.groupLoaded)
  const [showDepositModal, setShowDepositModal] = useState('')
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)

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
    const group = mangoStore.getState().group
    if (!banksWithMarketData.length || !perpMarketsWithData || !group)
      return [[], []]
    const tradeableAssets = []
    const filterReduceOnlyBanks = banksWithMarketData.filter(
      (b) => b.bank.reduceOnly !== TOKEN_REDUCE_ONLY_OPTIONS.ENABLED,
    )
    for (const token of filterReduceOnlyBanks) {
      if (token.market?.quoteTokenIndex === 0) {
        let change = token.market?.rollingChange || 0
        if (change === Infinity) {
          change = 0
        }
        tradeableAssets.push({ bank: token.bank, change, type: 'spot' })
      }
    }
    for (const market of perpMarketsWithData) {
      const volume = market.marketData?.quote_volume_24h || 0
      if (volume > 0) {
        const pastPrice = market.marketData?.price_24h
        const change = pastPrice
          ? ((market.uiPrice - pastPrice) / pastPrice) * 100
          : 0
        const perpMarket = group.getPerpMarketByMarketIndex(
          market.perpMarketIndex,
        )
        tradeableAssets.push({ market: perpMarket, change, type: 'perp' })
      }
    }
    const sortedAssets = tradeableAssets.sort((a, b) => b.change - a.change)
    const gainers = sortedAssets.slice(0, 3).filter((item) => {
      return item.change > 0
    })
    const losers = sortedAssets
      .slice(-3)
      .filter((item) => {
        return item.change < 0
      })
      .reverse()
    return [gainers, losers]
  }, [banksWithMarketData, perpMarketsWithData])

  const handleDepositModal = (token: string) => {
    if (mangoAccountAddress) {
      setShowDepositModal(token)
    } else {
      setShowCreateAccountModal(true)
    }
  }

  return (
    <>
      <div className="grid grid-cols-12 gap-4 px-4 md:px-6">
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
                return (
                  <div className="relative" key={token.tokenIndex}>
                    <div
                      className="default-transition flex h-16 cursor-pointer items-center justify-between border-b border-th-bkg-3 px-4 md:hover:bg-th-bkg-2"
                      onClick={() =>
                        goToTokenPage(token.name.split(' ')[0], router)
                      }
                    >
                      <div className="flex items-center">
                        <TableTokenName
                          bank={token}
                          symbol={token.name}
                          showLeverage
                          hideReduceDesc
                        />
                      </div>
                      <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                    </div>
                    {connected ? (
                      <div className="absolute right-12 top-4">
                        <Tooltip content={`${t('deposit')} ${token.name}`}>
                          <IconButton
                            onClick={() => handleDepositModal(token.name)}
                            size="small"
                          >
                            <ArrowDownTrayIcon className="h-4 w-4" />
                          </IconButton>
                        </Tooltip>
                      </div>
                    ) : null}
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
                gainers.map((gainer, i) => {
                  const bank = gainer?.bank

                  const onClick = bank
                    ? () => goToTokenPage(bank.name.split(' ')[0], router)
                    : () => goToPerpMarketDetails(gainer?.market?.name, router)

                  const price = bank
                    ? bank.uiPrice
                    : gainer?.market?.uiPrice || 0
                  return (
                    <div
                      className="default-transition flex h-16 cursor-pointer items-center justify-between border-b border-th-bkg-3 px-4 md:hover:bg-th-bkg-2"
                      key={
                        `${bank?.tokenIndex}${bank?.name}${i}` ||
                        `${gainer?.market?.perpMarketIndex}${gainer?.market?.name}${i}`
                      }
                      onClick={onClick}
                    >
                      {bank ? (
                        <div className="mr-3">
                          <TableTokenName
                            bank={bank}
                            symbol={bank.name}
                            showLeverage
                            hideReduceDesc
                          />
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <MarketLogos market={gainer?.market} size="large" />
                          <p className="font-body text-th-fgd-2">
                            {gainer?.market?.name}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center">
                        <div className="mr-3 flex flex-col items-end">
                          <span className="font-mono">
                            <FormatNumericValue value={price} isUsd />
                          </span>
                          <Change change={gainer.change} suffix="%" />
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
                losers.map((loser, i) => {
                  const bank = loser?.bank

                  const onClick = bank
                    ? () => goToTokenPage(bank.name.split(' ')[0], router)
                    : () => goToPerpMarketDetails(loser?.market?.name, router)

                  const price = bank
                    ? bank.uiPrice
                    : loser?.market?.uiPrice || 0
                  return (
                    <div
                      className="default-transition flex h-16 cursor-pointer items-center justify-between border-b border-th-bkg-3 px-4 md:hover:bg-th-bkg-2"
                      key={
                        `${bank?.tokenIndex}${i}` ||
                        `${loser?.market?.perpMarketIndex}${i}`
                      }
                      onClick={onClick}
                    >
                      {bank ? (
                        <div className="mr-3">
                          <TableTokenName
                            bank={bank}
                            symbol={bank.name}
                            showLeverage
                            hideReduceDesc
                          />
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <MarketLogos market={loser?.market} size="large" />
                          <p className="font-body text-th-fgd-2">
                            {loser?.market?.name}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center">
                        <div className="mr-3 flex flex-col items-end">
                          <span className="font-mono">
                            <FormatNumericValue value={price} isUsd />
                          </span>
                          <Change change={loser.change} suffix="%" />
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
      {showDepositModal ? (
        <DepositWithdrawModal
          action="deposit"
          isOpen={!!showDepositModal}
          onClose={() => setShowDepositModal('')}
          token={showDepositModal}
        />
      ) : null}
      {showCreateAccountModal ? (
        <CreateAccountModal
          isOpen={showCreateAccountModal}
          onClose={() => setShowCreateAccountModal(false)}
        />
      ) : null}
    </>
  )
}

export default RecentGainersLosers

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
