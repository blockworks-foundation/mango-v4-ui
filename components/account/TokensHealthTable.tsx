import FormatNumericValue from '@components/shared/FormatNumericValue'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import TokenLogo from '@components/shared/TokenLogo'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import useMangoGroup from 'hooks/useMangoGroup'
import useMangoAccount from 'hooks/useMangoAccount'
import { useViewport } from 'hooks/useViewport'
import { MouseEventHandler } from 'react'
import { ContributionDetails, HealthContribution } from 'types'

const TokensHealthTable = ({
  initTokens,
  maintTokens,
  handleLegendClick,
  handleLegendMouseEnter,
  handleLegendMouseLeave,
}: {
  initTokens: HealthContribution[]
  maintTokens: HealthContribution[]
  handleLegendClick: (cont: HealthContribution) => void
  handleLegendMouseEnter: (cont: HealthContribution) => void
  handleLegendMouseLeave: MouseEventHandler
}) => {
  const { t } = useTranslation(['common', 'account', 'trade'])
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const { isMobile } = useViewport()

  return group && mangoAccount ? (
    !isMobile ? (
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('token')}</Th>
            <Th className="text-right">{t('trade:notional')}</Th>
            <Th>
              <div className="flex justify-end">
                <Tooltip content={t('account:tooltip-init-health')}>
                  <span className="tooltip-underline">
                    {t('account:init-health-contribution')}
                  </span>
                </Tooltip>
              </div>
            </Th>
            <Th>
              <div className="flex justify-end">
                <Tooltip content={t('account:tooltip-maint-health')}>
                  <span className="tooltip-underline">
                    {t('account:maint-health-contribution')}
                  </span>
                </Tooltip>
              </div>
            </Th>
          </TrHead>
        </thead>
        <tbody>
          {maintTokens
            .sort((a, b) => b.contribution - a.contribution)
            .map((cont) => {
              const {
                asset,
                contribution,
                contributionDetails,
                isAsset,
                hasPerp,
              } = cont
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
              const initToken = initTokens.find((cont) => cont.asset === asset)
              const initContribution =
                (initToken?.contribution || 0) * assetOrLiabMultiplier

              const maintContribution = contribution * assetOrLiabMultiplier

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
                      <div className="mr-2.5 flex shrink-0 items-center">
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
                    <div className="flex flex-col items-end text-right">
                      <Tooltip
                        className={!hasPerp ? 'hidden' : ''}
                        content={
                          <UsdcTooltipContent
                            contributions={initToken?.contributionDetails}
                          />
                        }
                      >
                        <p className={hasPerp ? 'tooltip-underline' : ''}>
                          <FormatNumericValue
                            value={initContribution}
                            decimals={2}
                            isUsd
                          />
                        </p>
                      </Tooltip>
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
                    <div className="flex flex-col items-end text-right">
                      <Tooltip
                        className={!hasPerp ? 'hidden' : ''}
                        content={
                          <UsdcTooltipContent
                            contributions={contributionDetails}
                          />
                        }
                      >
                        <p className={hasPerp ? 'tooltip-underline' : ''}>
                          <FormatNumericValue
                            value={maintContribution}
                            decimals={2}
                            isUsd
                          />
                        </p>
                      </Tooltip>
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
        {maintTokens
          .sort((a, b) => b.contribution - a.contribution)
          .map((cont) => {
            const {
              asset,
              contribution,
              contributionDetails,
              isAsset,
              hasPerp,
            } = cont
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
              initLiabWeight = bank.scaledInitLiabWeight(bank.price).toNumber()
              maintAssetWeight = bank.maintAssetWeight.toNumber()
              maintLiabWeight = bank.maintLiabWeight.toNumber()

              balance = mangoAccount.getTokenBalanceUi(bank)
            }

            const assetOrLiabMultiplier = isAsset ? 1 : -1

            const initToken = initTokens.find((cont) => cont.asset === asset)
            const initContribution =
              (initToken?.contribution || 0) * assetOrLiabMultiplier

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
                            open ? 'rotate-180' : 'rotate-0'
                          } h-6 w-6 shrink-0 text-th-fgd-3`}
                        />
                      </div>
                    </Disclosure.Button>
                    <Transition
                      enter="transition ease-in duration-200"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                    >
                      <Disclosure.Panel>
                        <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pb-4 pt-4">
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
                              {t('account:init-health-contribution')}
                            </p>
                            <Tooltip
                              className={!hasPerp ? 'hidden' : ''}
                              content={
                                <UsdcTooltipContent
                                  contributions={initToken?.contributionDetails}
                                />
                              }
                            >
                              <p
                                className={`font-mono text-th-fgd-2 ${
                                  hasPerp ? 'tooltip-underline' : ''
                                }`}
                              >
                                <FormatNumericValue
                                  value={initContribution}
                                  decimals={2}
                                  isUsd
                                />
                              </p>
                            </Tooltip>
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
                              {t('account:maint-health-contribution')}
                            </p>
                            <Tooltip
                              className={!hasPerp ? 'hidden' : ''}
                              content={
                                <UsdcTooltipContent
                                  contributions={contributionDetails}
                                />
                              }
                            >
                              <p
                                className={`font-mono text-th-fgd-2 ${
                                  hasPerp ? 'tooltip-underline' : ''
                                }`}
                              >
                                <FormatNumericValue
                                  value={maintContribution}
                                  decimals={2}
                                  isUsd
                                />
                              </p>
                            </Tooltip>
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
    )
  ) : null
}

export default TokensHealthTable

const UsdcTooltipContent = ({
  contributions,
}: {
  contributions: ContributionDetails | undefined
}) => {
  const { t } = useTranslation('common')
  if (!contributions) return null
  const { perpMarketContributions, spotUi } = contributions
  return (
    <>
      <div className="space-y-1">
        <div className="flex justify-between">
          <p className="mr-3">{t('spot')}</p>
          <span className="font-mono text-th-fgd-2">
            <FormatNumericValue value={spotUi} decimals={2} isUsd />
          </span>
        </div>
        {perpMarketContributions
          .filter((cont) => Math.abs(cont.contributionUi) > 0.01)
          .map((perp) => (
            <div className="flex justify-between" key={perp.market}>
              <p className="mr-3">{perp.market}</p>
              <span className="font-mono text-th-fgd-2">
                <FormatNumericValue
                  value={perp.contributionUi}
                  decimals={2}
                  isUsd
                />
              </span>
            </div>
          ))}
      </div>
    </>
  )
}
