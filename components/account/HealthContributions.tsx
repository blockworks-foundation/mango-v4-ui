// import { useTranslation } from 'next-i18next'
import HealthContributionsChart from './HealthContributionsChart'
import useMangoGroup from 'hooks/useMangoGroup'
import useMangoAccount from 'hooks/useMangoAccount'
import { useMemo } from 'react'
import { HealthType } from '@blockworks-foundation/mango-v4'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import Tooltip from '@components/shared/Tooltip'
import TokenLogo from '@components/shared/TokenLogo'
import { useTranslation } from 'next-i18next'
import MarketLogos from '@components/trade/MarketLogos'
import FormatNumericValue from '@components/shared/FormatNumericValue'

export interface HealthContribution {
  asset: string
  contribution: number
  isAsset: boolean
}

const HealthContributions = ({ hideView }: { hideView: () => void }) => {
  const { t } = useTranslation(['common', 'account', 'trade'])
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()

  const [initHealthContributions, maintHealthContributions] = useMemo(() => {
    if (!group || !mangoAccount) return [[], []]
    const init = mangoAccount
      .getHealthContributionPerAssetUi(group, HealthType.init)
      //   .filter((asset) => Math.abs(asset.contribution) > 0.01)
      .map((item) => ({
        ...item,
        contribution: Math.abs(item.contribution),
        isAsset: item.contribution > 0 ? true : false,
      }))
    const maint = mangoAccount
      .getHealthContributionPerAssetUi(group, HealthType.maint)
      //   .filter((asset) => Math.abs(asset.contribution) > 0.01)
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
    return [splitData.market, splitData.token]
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
        <h2 className="text-lg">{t('account:health-breakdown')}</h2>
      </div>
      <div className="mx-auto grid max-w-[1140px] grid-cols-2 gap-8 p-6">
        <div className="col-span-1 flex h-full flex-col items-center">
          <Tooltip content={t('account:tooltip-init-health')}>
            <h3 className="tooltip-underline mb-3 text-base">
              {t('account:init-health')}
            </h3>
          </Tooltip>
          <HealthContributionsChart data={initHealthContributions} />
        </div>
        <div className="col-span-1 flex flex-col items-center">
          <Tooltip content={t('account:tooltip-maint-health')}>
            <h3 className="tooltip-underline mb-3 text-base">
              {t('account:maint-health')}
            </h3>
          </Tooltip>
          <HealthContributionsChart data={maintHealthContributions} />
        </div>
      </div>
      {maintHealthTokens.length ? (
        <div className="border-t border-th-bkg-3 py-6">
          <h2 className="mb-1 px-6 text-lg">{t('tokens')}</h2>
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">{t('token')}</Th>
                <Th className="text-right">{t('trade:notional')}</Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('account:tooltip-init-health')}>
                      <span className="tooltip-underline">
                        {t('account:init-health')}
                      </span>
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('account:tooltip-maint-health')}>
                      <span className="tooltip-underline">
                        {t('account:maint-health')}
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

                  const maintContribution = contribution * assetOrLiabMultiplier

                  return (
                    <TrBody key={asset}>
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
        </div>
      ) : null}
      {maintHealthMarkets.length ? (
        <>
          <h2 className="mb-1 px-6 text-lg">{t('markets')}</h2>
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">{t('market')}</Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('account:tooltip-init-health')}>
                      <span className="tooltip-underline">
                        {t('account:init-health')}
                      </span>
                    </Tooltip>
                  </div>
                </Th>
                <Th>
                  <div className="flex justify-end">
                    <Tooltip content={t('account:tooltip-maint-health')}>
                      <span className="tooltip-underline">
                        {t('account:maint-health')}
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

                  const maintContribution = contribution * assetOrLiabMultiplier

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
        </>
      ) : null}
    </>
  ) : null
}

export default HealthContributions
