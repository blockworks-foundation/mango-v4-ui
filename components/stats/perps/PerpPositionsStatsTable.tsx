import FormatNumericValue from '@components/shared/FormatNumericValue'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import TableMarketName from '@components/trade/TableMarketName'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { abbreviateAddress } from 'utils/formatting'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import Tooltip from '@components/shared/Tooltip'
import PnlTooltipContent from '@components/shared/PnlTooltipContent'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import { Disclosure, Transition } from '@headlessui/react'
import { PositionStat } from 'types'

const PerpPositionsStatsTable = ({
  positions,
}: {
  positions: PositionStat[]
}) => {
  const { t } = useTranslation(['common', 'stats', 'trade'])
  const { group } = useMangoGroup()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  if (!group) return null

  return showTableView ? (
    <div className="thin-scroll overflow-x-auto">
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('market')}</Th>
            <Th className="text-right">{t('trade:size')}</Th>
            <Th className="text-right">{t('trade:avg-entry-price')}</Th>
            <Th className="text-right">{t('trade:est-liq-price')}</Th>
            <Th className="text-right">{t('trade:unrealized-pnl')}</Th>
            <Th className="text-right">{t('account')}</Th>
          </TrHead>
        </thead>
        <tbody>
          {positions.map(({ account, perpPosition, mangoAccount }, i) => {
            const market = group.getPerpMarketByMarketIndex(
              perpPosition.marketIndex,
            )
            const basePosition = perpPosition.getBasePositionUi(market)

            if (!basePosition) return null

            const floorBasePosition = floorToDecimal(
              basePosition,
              getDecimalCount(market.minOrderSize),
            ).toNumber()

            const isLong = basePosition > 0
            const avgEntryPrice = perpPosition.getAverageEntryPriceUi(market)
            const unsettledPnl = perpPosition.getUnsettledPnlUi(market)
            const totalPnl =
              perpPosition.cumulativePnlOverPositionLifetimeUi(market)
            const unrealizedPnl = perpPosition.getUnRealizedPnlUi(market)
            const realizedPnl = perpPosition.getRealizedPnlUi()
            const roe =
              (unrealizedPnl / (Math.abs(basePosition) * avgEntryPrice)) * 100
            let estLiqPrice
            if (account) {
              estLiqPrice = perpPosition.getLiquidationPriceUi(group, account)
            }

            return (
              <TrBody
                key={`${perpPosition.marketIndex}${basePosition}${i}`}
                className="my-1 p-2"
              >
                <Td>
                  <TableMarketName
                    market={market}
                    side={isLong ? 'long' : 'short'}
                  />
                </Td>
                <Td className="text-right font-mono">
                  <div className="flex flex-col items-end space-y-0.5">
                    <FormatNumericValue
                      value={Math.abs(basePosition)}
                      decimals={getDecimalCount(market.minOrderSize)}
                    />
                    <FormatNumericValue
                      classNames="text-xs text-th-fgd-3"
                      value={Math.abs(floorBasePosition) * market._uiPrice}
                      isUsd
                    />
                  </div>
                </Td>
                <Td className="font-mono">
                  <div className="flex flex-col items-end space-y-0.5">
                    <FormatNumericValue
                      value={avgEntryPrice}
                      decimals={getDecimalCount(market.tickSize)}
                      isUsd
                    />
                    <FormatNumericValue
                      classNames="text-xs text-th-fgd-3"
                      value={market.uiPrice}
                      decimals={getDecimalCount(market.tickSize)}
                      isUsd
                    />
                  </div>
                </Td>
                <Td className="text-right font-mono">
                  {estLiqPrice ? (
                    <FormatNumericValue
                      value={estLiqPrice}
                      decimals={getDecimalCount(market.tickSize)}
                      isUsd
                    />
                  ) : (
                    '–'
                  )}
                </Td>
                <Td className="text-right font-mono">
                  <div className="flex flex-col items-end ">
                    <Tooltip
                      content={
                        <PnlTooltipContent
                          unrealizedPnl={unrealizedPnl}
                          realizedPnl={realizedPnl}
                          totalPnl={totalPnl}
                          unsettledPnl={unsettledPnl}
                        />
                      }
                      delay={100}
                    >
                      <span
                        className={`tooltip-underline ${
                          unrealizedPnl >= 0 ? 'text-th-up' : 'text-th-down'
                        }`}
                      >
                        <FormatNumericValue
                          value={unrealizedPnl}
                          isUsd
                          decimals={2}
                        />
                      </span>
                    </Tooltip>
                    <span className={roe >= 0 ? 'text-th-up' : 'text-th-down'}>
                      <FormatNumericValue
                        classNames="text-xs"
                        value={roe}
                        decimals={2}
                      />
                      %{' '}
                      <span className="font-body text-xs text-th-fgd-3">
                        (ROE)
                      </span>
                    </span>
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center justify-end">
                    <a
                      href={`/?address=${mangoAccount.toString()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex cursor-pointer items-center text-th-fgd-2"
                    >
                      <span className="mr-1">
                        {abbreviateAddress(mangoAccount)}
                      </span>
                      <ChevronRightIcon className="h-5 w-5" />
                    </a>
                  </div>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    </div>
  ) : (
    <div className="border-b border-th-bkg-3">
      {positions.map(({ account, perpPosition, mangoAccount }) => {
        const market = group.getPerpMarketByMarketIndex(
          perpPosition.marketIndex,
        )
        const basePosition = perpPosition.getBasePositionUi(market)

        if (!basePosition) return null

        const floorBasePosition = floorToDecimal(
          basePosition,
          getDecimalCount(market.minOrderSize),
        ).toNumber()

        const isLong = basePosition > 0
        const avgEntryPrice = perpPosition.getAverageEntryPriceUi(market)
        const unsettledPnl = perpPosition.getUnsettledPnlUi(market)
        const totalPnl =
          perpPosition.cumulativePnlOverPositionLifetimeUi(market)
        const unrealizedPnl = perpPosition.getUnRealizedPnlUi(market)
        const realizedPnl = perpPosition.getRealizedPnlUi()
        const roe =
          (unrealizedPnl / (Math.abs(basePosition) * avgEntryPrice)) * 100
        let estLiqPrice: number | null
        if (account) {
          estLiqPrice = perpPosition.getLiquidationPriceUi(group, account)
        }

        return (
          <Disclosure key={perpPosition.marketIndex + basePosition}>
            {({ open }) => (
              <>
                <Disclosure.Button
                  className={`flex w-full items-center justify-between border-t border-th-bkg-3 p-4 text-left focus:outline-none`}
                >
                  <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between">
                    <TableMarketName
                      market={market}
                      side={isLong ? 'long' : 'short'}
                    />
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        <FormatNumericValue
                          value={Math.abs(basePosition)}
                          decimals={getDecimalCount(market.minOrderSize)}
                        />{' '}
                        <span className="font-body text-th-fgd-3">
                          {market.name.split('-')[0]}
                        </span>
                      </span>
                      <span className="text-th-fgd-4">|</span>
                      <span className="font-mono text-th-fgd-3">
                        <FormatNumericValue
                          value={Math.abs(floorBasePosition) * market._uiPrice}
                          isUsd
                        />
                      </span>
                    </div>
                  </div>
                  <ChevronDownIcon
                    className={`${
                      open ? 'rotate-180' : 'rotate-0'
                    } ml-3 h-6 w-6 shrink-0 text-th-fgd-3`}
                  />
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
                          {t('trade:size')}
                        </p>
                        <div className="flex flex-col font-mono text-th-fgd-2">
                          <FormatNumericValue
                            value={Math.abs(basePosition)}
                            decimals={getDecimalCount(market.minOrderSize)}
                          />
                          <FormatNumericValue
                            classNames="text-xs text-th-fgd-3"
                            value={
                              Math.abs(floorBasePosition) * market._uiPrice
                            }
                            isUsd
                          />
                        </div>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">
                          {t('trade:avg-entry-price')}
                        </p>
                        <div className="flex flex-col font-mono">
                          <FormatNumericValue
                            classNames="text-th-fgd-2"
                            value={avgEntryPrice}
                            decimals={getDecimalCount(market.tickSize)}
                            isUsd
                          />
                          <FormatNumericValue
                            classNames="text-xs text-th-fgd-3"
                            value={market.uiPrice}
                            decimals={getDecimalCount(market.tickSize)}
                            isUsd
                          />
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Tooltip content={t('trade:tooltip-est-liq-price')}>
                          <p className="tooltip-underline text-xs text-th-fgd-3">
                            {t('trade:est-liq-price')}
                          </p>
                        </Tooltip>
                        <p className="font-mono text-th-fgd-2">
                          {estLiqPrice ? (
                            <FormatNumericValue
                              value={estLiqPrice}
                              decimals={getDecimalCount(market.tickSize)}
                              isUsd
                            />
                          ) : (
                            '–'
                          )}
                        </p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">
                          {t('trade:unrealized-pnl')}
                        </p>
                        <p className="font-mono text-th-fgd-2">
                          <Tooltip
                            content={
                              <PnlTooltipContent
                                unrealizedPnl={unrealizedPnl}
                                realizedPnl={realizedPnl}
                                totalPnl={totalPnl}
                                unsettledPnl={unsettledPnl}
                              />
                            }
                            delay={100}
                          >
                            <span
                              className={`tooltip-underline mb-1 ${
                                unrealizedPnl >= 0
                                  ? 'text-th-up'
                                  : 'text-th-down'
                              }`}
                            >
                              <FormatNumericValue
                                value={unrealizedPnl}
                                isUsd
                                decimals={2}
                              />
                            </span>
                          </Tooltip>
                        </p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">ROE</p>
                        <p
                          className={`font-mono ${
                            roe >= 0 ? 'text-th-up' : 'text-th-down'
                          }`}
                        >
                          <FormatNumericValue value={roe} decimals={2} />%
                        </p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-xs text-th-fgd-3">{t('account')}</p>
                        <a
                          href={`/?address=${mangoAccount.toString()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex cursor-pointer items-center text-th-fgd-2"
                        >
                          <span className="mr-1">
                            {abbreviateAddress(mangoAccount)}
                          </span>
                          <ChevronRightIcon className="h-5 w-5" />
                        </a>
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
}

export default PerpPositionsStatsTable
