import HealthContributionsChart from './HealthContributionsChart'
import useMangoGroup from 'hooks/useMangoGroup'
import useMangoAccount from 'hooks/useMangoAccount'
import { useMemo, useState } from 'react'
import { HealthType } from '@blockworks-foundation/mango-v4'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import TokenLogo from '@components/shared/TokenLogo'
import { useTranslation } from 'next-i18next'
import MarketLogos from '@components/trade/MarketLogos'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import mangoStore from '@store/mangoStore'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import { Disclosure, Transition } from '@headlessui/react'

export interface HealthContribution {
  asset: string
  contribution: number
  isAsset: boolean
}

const HealthContributions = ({ hideView }: { hideView: () => void }) => {
  const { t } = useTranslation(['common', 'account', 'trade'])
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const [initActiveIndex, setInitActiveIndex] = useState<number | undefined>(
    undefined
  )
  const [maintActiveIndex, setMaintActiveIndex] = useState<number | undefined>(
    undefined
  )
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const [initHealthContributions, maintHealthContributions] = useMemo(() => {
    if (!group || !mangoAccount) return [[], []]
    const init = mangoAccount
      .getHealthContributionPerAssetUi(group, HealthType.init)
      .map((item) => ({
        ...item,
        contribution: Math.abs(item.contribution),
        isAsset: item.contribution > 0 ? true : false,
      }))
    const maint = mangoAccount
      .getHealthContributionPerAssetUi(group, HealthType.maint)
      .map((item) => ({
        ...item,
        contribution: Math.abs(item.contribution),
        isAsset: item.contribution > 0 ? true : false,
      }))
    return [init, maint]
  }, [group, mangoAccount])

  const [initHealthMarkets, initHealthTokens] = useMemo(() => {
    if (!initHealthContributions.length) return [[], []]
    const splitData = initHealthContributions.reduce(
      (
        acc: { market: HealthContribution[]; token: HealthContribution[] },
        obj: HealthContribution
      ) => {
        if (obj.asset.includes('/')) {
          acc.market.push(obj)
        } else {
          acc.token.push(obj)
        }
        return acc
      },
      { market: [], token: [] }
    )
    return [splitData.market, splitData.token]
  }, [initHealthContributions])

  const [maintHealthMarkets, maintHealthTokens] = useMemo(() => {
    if (!maintHealthContributions.length) return [[], []]
    const splitData = maintHealthContributions.reduce(
      (
        acc: { market: HealthContribution[]; token: HealthContribution[] },
        obj: HealthContribution
      ) => {
        if (obj.asset.includes('/')) {
          acc.market.push(obj)
        } else {
          acc.token.push(obj)
        }
        return acc
      },
      { market: [], token: [] }
    )
    const markets = splitData.market.filter((d) => d.contribution > 0)
    const tokens = splitData.token
    return [markets, tokens]
  }, [maintHealthContributions])

  const handleLegendClick = (item: HealthContribution) => {
    const maintIndex = maintChartData.findIndex((d) => d.asset === item.asset)
    const initIndex = initChartData.findIndex((d) => d.asset === item.asset)
    setMaintActiveIndex(maintIndex)
    setInitActiveIndex(initIndex)
  }

  const handleLegendMouseEnter = (item: HealthContribution) => {
    const maintIndex = maintChartData.findIndex((d) => d.asset === item.asset)
    const initIndex = initChartData.findIndex((d) => d.asset === item.asset)
    setMaintActiveIndex(maintIndex)
    setInitActiveIndex(initIndex)
  }

  const handleLegendMouseLeave = () => {
    setInitActiveIndex(undefined)
    setMaintActiveIndex(undefined)
  }

  const renderLegendLogo = (asset: string) => {
    const group = mangoStore.getState().group
    if (!group)
      return <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
    const isSpotMarket = asset.includes('/')
    if (isSpotMarket) {
      const market = group.getSerum3MarketByName(asset)
      return market ? (
        <MarketLogos market={market} size="small" />
      ) : (
        <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
      )
    } else {
      const bank = group.banksMapByName.get(asset)?.[0]
      return bank ? (
        <div className="mr-1.5">
          <TokenLogo bank={bank} size={16} />
        </div>
      ) : (
        <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
      )
    }
  }

  const initChartData = useMemo(() => {
    if (!initHealthContributions.length) return []
    return initHealthContributions
      .filter((cont) => {
        if (cont.asset.includes('/')) {
          return cont.contribution > 0.01
        } else return cont
      })
      .sort((a, b) => {
        const aMultiplier = a.isAsset ? 1 : -1
        const bMultiplier = b.isAsset ? 1 : -1
        return b.contribution * bMultiplier - a.contribution * aMultiplier
      })
  }, [initHealthContributions])

  const maintChartData = useMemo(() => {
    if (!maintHealthContributions.length) return []
    return maintHealthContributions
      .filter((cont) => {
        if (cont.asset.includes('/')) {
          return cont.contribution > 0.01
        } else return cont
      })
      .sort((a, b) => {
        const aMultiplier = a.isAsset ? 1 : -1
        const bMultiplier = b.isAsset ? 1 : -1
        return b.contribution * bMultiplier - a.contribution * aMultiplier
      })
  }, [maintHealthContributions])

  return group && mangoAccount ? (
    <>
      <div className="hide-scroll flex h-14 items-center space-x-4 overflow-x-auto border-b border-th-bkg-3">
        <button
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center border-r border-th-bkg-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
          onClick={hideView}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h2 className="text-lg">{t('account:health-contributions')}</h2>
      </div>
      <div className="mx-auto grid max-w-[1140px] grid-cols-2 gap-6 p-6 sm:gap-8">
        <div className="col-span-1 flex h-full flex-col items-center">
          <Tooltip content={t('account:tooltip-init-health')}>
            <h3 className="tooltip-underline text-xs sm:text-base">
              {t('account:init-health-contributions')}
            </h3>
          </Tooltip>
          <HealthContributionsChart
            data={initChartData}
            activeIndex={initActiveIndex}
            setActiveIndex={setInitActiveIndex}
          />
        </div>
        <div className="col-span-1 flex flex-col items-center">
          <Tooltip content={t('account:tooltip-maint-health')}>
            <h3 className="tooltip-underline text-xs sm:text-base">
              {t('account:maint-health-contributions')}
            </h3>
          </Tooltip>
          <HealthContributionsChart
            data={maintChartData}
            activeIndex={maintActiveIndex}
            setActiveIndex={setMaintActiveIndex}
          />
        </div>
        <div className="col-span-2 mx-auto flex max-w-[600px] flex-wrap justify-center space-x-4">
          {[...maintChartData]
            .sort((a, b) => b.contribution - a.contribution)
            .map((d, i) => {
              return (
                <div
                  key={d.asset + i}
                  className={`default-transition flex h-7 cursor-pointer items-center md:hover:text-th-active`}
                  onClick={() => handleLegendClick(d)}
                  onMouseEnter={() => handleLegendMouseEnter(d)}
                  onMouseLeave={handleLegendMouseLeave}
                >
                  {renderLegendLogo(d.asset)}
                  <span className={`default-transition`}>{d.asset}</span>
                </div>
              )
            })}
        </div>
      </div>
      {maintHealthTokens.length ? (
        <div className="border-t border-th-bkg-3 pt-6">
          <h2 className="mb-1 px-6 text-lg">{t('tokens')}</h2>
          {!isMobile ? (
            <Table>
              <thead>
                <TrHead>
                  <Th className="text-left">{t('token')}</Th>
                  <Th className="text-right">{t('trade:notional')}</Th>
                  <Th>
                    <div className="flex justify-end">
                      <Tooltip content={t('account:tooltip-init-health')}>
                        <span className="tooltip-underline">
                          {t('account:init-health-contributions')}
                        </span>
                      </Tooltip>
                    </div>
                  </Th>
                  <Th>
                    <div className="flex justify-end">
                      <Tooltip content={t('account:tooltip-maint-health')}>
                        <span className="tooltip-underline">
                          {t('account:maint-health-contributions')}
                        </span>
                      </Tooltip>
                    </div>
                  </Th>
                </TrHead>
              </thead>
              <tbody>
                {maintHealthTokens
                  .sort((a, b) => b.contribution - a.contribution)
                  .map((cont) => {
                    const { asset, contribution, isAsset } = cont
                    const bank = group.banksMapByName.get(asset)?.[0]

                    let initAssetWeight = 0
                    let initLiabWeight = 0
                    let maintAssetWeight = 0
                    let maintLiabWeight = 0

                    let balance = 0

                    if (bank) {
                      initAssetWeight = bank
                        .scaledInitAssetWeight(bank.price)
                        .toNumber()
                      initLiabWeight = bank
                        .scaledInitLiabWeight(bank.price)
                        .toNumber()
                      maintAssetWeight = bank.maintAssetWeight.toNumber()
                      maintLiabWeight = bank.maintLiabWeight.toNumber()

                      balance = mangoAccount.getTokenBalanceUi(bank)
                    }

                    const assetOrLiabMultiplier = isAsset ? 1 : -1

                    const initContribution =
                      (initHealthTokens.find((cont) => cont.asset === asset)
                        ?.contribution || 0) * assetOrLiabMultiplier

                    const maintContribution =
                      contribution * assetOrLiabMultiplier

                    return (
                      <TrBody
                        key={asset}
                        className="cursor-pointer md:hover:bg-th-bkg-2"
                        onClick={() => handleLegendClick(cont)}
                        onMouseEnter={() => handleLegendMouseEnter(cont)}
                        onMouseLeave={handleLegendMouseLeave}
                      >
                        <Td>
                          <div className="flex items-center">
                            <div className="mr-2.5 flex flex-shrink-0 items-center">
                              <TokenLogo bank={bank} />
                            </div>
                            <p className="font-body">{asset}</p>
                          </div>
                        </Td>
                        <Td className="text-right">
                          {bank ? (
                            <p>
                              <FormatNumericValue
                                value={balance * bank.uiPrice}
                                decimals={2}
                                isUsd
                              />{' '}
                              <span className={`block text-th-fgd-4`}>
                                <FormatNumericValue
                                  value={balance}
                                  decimals={bank.mintDecimals}
                                />
                              </span>
                            </p>
                          ) : (
                            '–'
                          )}
                        </Td>
                        <Td>
                          <div className="text-right">
                            <p>
                              <FormatNumericValue
                                value={initContribution}
                                decimals={2}
                                isUsd
                              />
                            </p>
                            <p className="text-th-fgd-3">
                              {initContribution > 0
                                ? initAssetWeight.toFixed(2)
                                : initContribution < 0
                                ? initLiabWeight.toFixed(2)
                                : 0}
                              x
                            </p>
                          </div>
                        </Td>
                        <Td>
                          <div className="text-right">
                            <p>
                              <FormatNumericValue
                                value={maintContribution}
                                decimals={2}
                                isUsd
                              />
                            </p>
                            <p className="text-th-fgd-3">
                              {maintContribution > 0
                                ? maintAssetWeight.toFixed(2)
                                : maintContribution < 0
                                ? maintLiabWeight.toFixed(2)
                                : 0}
                              x
                            </p>
                          </div>
                        </Td>
                      </TrBody>
                    )
                  })}
              </tbody>
            </Table>
          ) : (
            <div className="mt-3 border-y border-th-bkg-3">
              {maintHealthTokens
                .sort((a, b) => b.contribution - a.contribution)
                .map((cont) => {
                  const { asset, contribution, isAsset } = cont
                  const bank = group.banksMapByName.get(asset)?.[0]

                  let initAssetWeight = 0
                  let initLiabWeight = 0
                  let maintAssetWeight = 0
                  let maintLiabWeight = 0

                  let balance = 0

                  if (bank) {
                    initAssetWeight = bank
                      .scaledInitAssetWeight(bank.price)
                      .toNumber()
                    initLiabWeight = bank
                      .scaledInitLiabWeight(bank.price)
                      .toNumber()
                    maintAssetWeight = bank.maintAssetWeight.toNumber()
                    maintLiabWeight = bank.maintLiabWeight.toNumber()

                    balance = mangoAccount.getTokenBalanceUi(bank)
                  }

                  const assetOrLiabMultiplier = isAsset ? 1 : -1

                  const initContribution =
                    (initHealthTokens.find((cont) => cont.asset === asset)
                      ?.contribution || 0) * assetOrLiabMultiplier

                  const maintContribution = contribution * assetOrLiabMultiplier

                  return (
                    <Disclosure key={asset}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            className={`w-full border-t border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div className="mr-2.5">
                                  <TokenLogo bank={bank} />
                                </div>
                                <div>
                                  <p className="text-th-fgd-1">{asset}</p>
                                </div>
                              </div>
                              <ChevronDownIcon
                                className={`${
                                  open ? 'rotate-180' : 'rotate-360'
                                } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                              />
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
                                  <p className="text-xs text-th-fgd-3">
                                    {t('trade:notional')}
                                  </p>
                                  <p>
                                    {bank ? (
                                      <span className="font-mono text-th-fgd-2">
                                        <FormatNumericValue
                                          value={balance * bank.uiPrice}
                                          decimals={2}
                                          isUsd
                                        />{' '}
                                        <span className={`block text-th-fgd-4`}>
                                          <FormatNumericValue
                                            value={balance}
                                            decimals={bank.mintDecimals}
                                          />
                                        </span>
                                      </span>
                                    ) : (
                                      '–'
                                    )}
                                  </p>
                                </div>
                                <div className="col-span-1">
                                  <p className="text-xs text-th-fgd-3">
                                    <Tooltip
                                      content={t('account:tooltip-init-health')}
                                    >
                                      <span className="tooltip-underline">
                                        {t('account:init-health-contributions')}
                                      </span>
                                    </Tooltip>
                                  </p>
                                  <p className="font-mono text-th-fgd-2">
                                    <FormatNumericValue
                                      value={initContribution}
                                      decimals={2}
                                      isUsd
                                    />
                                  </p>
                                  <p className="font-mono text-th-fgd-3">
                                    {initContribution > 0
                                      ? initAssetWeight.toFixed(2)
                                      : initContribution < 0
                                      ? initLiabWeight.toFixed(2)
                                      : 0}
                                    x
                                  </p>
                                </div>
                                <div className="col-span-1">
                                  <p className="text-xs text-th-fgd-3">
                                    <Tooltip
                                      content={t(
                                        'account:tooltip-maint-health'
                                      )}
                                    >
                                      <span className="tooltip-underline">
                                        {t(
                                          'account:maint-health-contributions'
                                        )}
                                      </span>
                                    </Tooltip>
                                  </p>
                                  <p className="font-mono text-th-fgd-2">
                                    <FormatNumericValue
                                      value={maintContribution}
                                      decimals={2}
                                      isUsd
                                    />
                                  </p>
                                  <p className="font-mono text-th-fgd-3">
                                    {maintContribution > 0
                                      ? maintAssetWeight.toFixed(2)
                                      : maintContribution < 0
                                      ? maintLiabWeight.toFixed(2)
                                      : 0}
                                    x
                                  </p>
                                </div>
                              </div>
                            </Disclosure.Panel>
                          </Transition>
                        </>
                      )}
                    </Disclosure>
                  )
                })}
            </div>
          )}
        </div>
      ) : null}
      {maintHealthMarkets.length ? (
        <div className="pt-6">
          <h2 className="mb-1 px-6 text-lg">{t('markets')}</h2>
          {!isMobile ? (
            <Table>
              <thead>
                <TrHead>
                  <Th className="text-left">{t('market')}</Th>
                  <Th>
                    <div className="flex justify-end">
                      <Tooltip content={t('account:tooltip-init-health')}>
                        <span className="tooltip-underline">
                          {t('account:init-health-contributions')}
                        </span>
                      </Tooltip>
                    </div>
                  </Th>
                  <Th>
                    <div className="flex justify-end">
                      <Tooltip content={t('account:tooltip-maint-health')}>
                        <span className="tooltip-underline">
                          {t('account:maint-health-contributions')}
                        </span>
                      </Tooltip>
                    </div>
                  </Th>
                </TrHead>
              </thead>
              <tbody>
                {maintHealthMarkets
                  .sort((a, b) => b.contribution - a.contribution)
                  .map((cont) => {
                    const { asset, contribution, isAsset } = cont
                    const market = group.getSerum3MarketByName(asset)
                    const bank = group.banksMapByTokenIndex.get(
                      market.baseTokenIndex
                    )?.[0]

                    let initAssetWeight = 0
                    let initLiabWeight = 0
                    let maintAssetWeight = 0
                    let maintLiabWeight = 0

                    if (bank) {
                      initAssetWeight = bank
                        .scaledInitAssetWeight(bank.price)
                        .toNumber()
                      initLiabWeight = bank
                        .scaledInitLiabWeight(bank.price)
                        .toNumber()
                      maintAssetWeight = bank.maintAssetWeight.toNumber()
                      maintLiabWeight = bank.maintLiabWeight.toNumber()
                    }

                    const assetOrLiabMultiplier = isAsset ? 1 : -1

                    const initContribution =
                      (initHealthMarkets.find((cont) => cont.asset === asset)
                        ?.contribution || 0) * assetOrLiabMultiplier

                    const maintContribution =
                      contribution * assetOrLiabMultiplier

                    return (
                      <TrBody key={asset}>
                        <Td>
                          <div className="flex items-center">
                            <MarketLogos market={market} />
                            <p className="font-body">{asset}</p>
                          </div>
                        </Td>
                        <Td>
                          <div className="text-right">
                            <p>
                              <FormatNumericValue
                                value={initContribution}
                                decimals={2}
                                isUsd
                              />
                            </p>
                            <p className="text-th-fgd-3">
                              {initContribution > 0
                                ? initAssetWeight.toFixed(2)
                                : initContribution < 0
                                ? initLiabWeight.toFixed(2)
                                : 0}
                              x
                            </p>
                          </div>
                        </Td>
                        <Td>
                          <div className="text-right">
                            <p>
                              <FormatNumericValue
                                value={maintContribution}
                                decimals={2}
                                isUsd
                              />
                            </p>
                            <p className="text-th-fgd-3">
                              {maintContribution > 0
                                ? maintAssetWeight.toFixed(2)
                                : maintContribution < 0
                                ? maintLiabWeight.toFixed(2)
                                : 0}
                              x
                            </p>
                          </div>
                        </Td>
                      </TrBody>
                    )
                  })}
              </tbody>
            </Table>
          ) : (
            <div className="mt-3 border-y border-th-bkg-3">
              {maintHealthMarkets
                .sort((a, b) => b.contribution - a.contribution)
                .map((cont) => {
                  const { asset, contribution, isAsset } = cont
                  const market = group.getSerum3MarketByName(asset)
                  const bank = group.banksMapByTokenIndex.get(
                    market.baseTokenIndex
                  )?.[0]

                  let initAssetWeight = 0
                  let initLiabWeight = 0
                  let maintAssetWeight = 0
                  let maintLiabWeight = 0

                  if (bank) {
                    initAssetWeight = bank
                      .scaledInitAssetWeight(bank.price)
                      .toNumber()
                    initLiabWeight = bank
                      .scaledInitLiabWeight(bank.price)
                      .toNumber()
                    maintAssetWeight = bank.maintAssetWeight.toNumber()
                    maintLiabWeight = bank.maintLiabWeight.toNumber()
                  }

                  const assetOrLiabMultiplier = isAsset ? 1 : -1

                  const initContribution =
                    (initHealthMarkets.find((cont) => cont.asset === asset)
                      ?.contribution || 0) * assetOrLiabMultiplier

                  const maintContribution = contribution * assetOrLiabMultiplier

                  return (
                    <Disclosure key={asset}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button
                            className={`w-full border-t border-th-bkg-3 p-4 text-left first:border-t-0 focus:outline-none`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <MarketLogos market={market} />
                                <div>
                                  <p className="text-th-fgd-1">{asset}</p>
                                </div>
                              </div>
                              <ChevronDownIcon
                                className={`${
                                  open ? 'rotate-180' : 'rotate-360'
                                } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                              />
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
                                  <p className="text-xs text-th-fgd-3">
                                    <Tooltip
                                      content={t('account:tooltip-init-health')}
                                    >
                                      <span className="tooltip-underline">
                                        {t('account:init-health-contributions')}
                                      </span>
                                    </Tooltip>
                                  </p>
                                  <p className="font-mono text-th-fgd-2">
                                    <FormatNumericValue
                                      value={initContribution}
                                      decimals={2}
                                      isUsd
                                    />
                                  </p>
                                  <p className="font-mono text-th-fgd-3">
                                    {initContribution > 0
                                      ? initAssetWeight.toFixed(2)
                                      : initContribution < 0
                                      ? initLiabWeight.toFixed(2)
                                      : 0}
                                    x
                                  </p>
                                </div>
                                <div className="col-span-1">
                                  <p className="text-xs text-th-fgd-3">
                                    <Tooltip
                                      content={t(
                                        'account:tooltip-maint-health'
                                      )}
                                    >
                                      <span className="tooltip-underline">
                                        {t(
                                          'account:maint-health-contributions'
                                        )}
                                      </span>
                                    </Tooltip>
                                  </p>
                                  <p className="font-mono text-th-fgd-2">
                                    <FormatNumericValue
                                      value={maintContribution}
                                      decimals={2}
                                      isUsd
                                    />
                                  </p>
                                  <p className="font-mono text-th-fgd-3">
                                    {maintContribution > 0
                                      ? maintAssetWeight.toFixed(2)
                                      : maintContribution < 0
                                      ? maintLiabWeight.toFixed(2)
                                      : 0}
                                    x
                                  </p>
                                </div>
                              </div>
                            </Disclosure.Panel>
                          </Transition>
                        </>
                      )}
                    </Disclosure>
                  )
                })}
            </div>
          )}
        </div>
      ) : null}
    </>
  ) : null
}

export default HealthContributions
