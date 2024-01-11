import { PerpMarket, PerpPosition } from '@blockworks-foundation/mango-v4'
import { TwitterIcon } from '@components/icons/TwitterIcon'
import SharePositionModal from '@components/modals/SharePositionModal'
import Button, { IconButton, LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { ChevronDownIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { useCallback, useMemo, useState } from 'react'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import MarketCloseModal from './MarketCloseModal'
import MarketLogos from './MarketLogos'
import TableMarketName from './TableMarketName'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure, Transition } from '@headlessui/react'
import useOpenPerpPositions from 'hooks/useOpenPerpPositions'
import PnlTooltipContent from '@components/shared/PnlTooltipContent'
import PerpSideBadge from './PerpSideBadge'
import CloseAllPositionsModal from './CloseAllPositionsModal'
import NukeIcon from '@components/icons/NukeIcon'

const PerpPositions = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const [showMarketCloseModal, setShowMarketCloseModal] = useState(false)
  const [showCloseAllModal, setShowCloseAllModal] = useState(false)
  const [positionToClose, setPositionToClose] = useState<PerpPosition | null>(
    null,
  )
  const [showShareModal, setShowShareModal] = useState(false)
  const [positionToShare, setPositionToShare] = useState<PerpPosition | null>(
    null,
  )
  const { openPerpPositions } = useOpenPerpPositions()
  const { selectedMarket } = useSelectedMarket()
  const { connected } = useWallet()
  const { mangoAccount } = useMangoAccount()
  const { isUnownedAccount } = useUnownedAccount()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const totalPnlStats = useMemo(() => {
    if (openPerpPositions.length && group !== undefined) {
      const pnlByMarket = openPerpPositions.map((position) => {
        const market = group.getPerpMarketByMarketIndex(position.marketIndex)
        const basePosition = position.getBasePositionUi(market)
        const avgEntryPrice = position.getAverageEntryPriceUi(market)
        return {
          unrealized: position.getUnRealizedPnlUi(market),
          realized: position.getRealizedPnlUi(),
          total: position.cumulativePnlOverPositionLifetimeUi(market),
          unsettled: position.getUnsettledPnlUi(market),
          averageEntryValue: Math.abs(basePosition) * avgEntryPrice,
        }
      })

      const p = pnlByMarket.reduce((a, b) => {
        return {
          unrealized: a.unrealized + b.unrealized,
          realized: a.realized + b.realized,
          total: a.total + b.total,
          unsettled: a.unsettled + b.unsettled,
          averageEntryValue: a.averageEntryValue + b.averageEntryValue,
        }
      })

      return {
        unrealized: p.unrealized,
        realized: p.realized,
        total: p.total,
        unsettled: p.unsettled,
        roe: (p.unrealized / p.averageEntryValue) * 100,
      }
    }
    return { unrealized: 0, realized: 0, total: 0, unsettled: 0, roe: 0 }
  }, [openPerpPositions, group])

  const handlePositionClick = (positionSize: number, market: PerpMarket) => {
    const tradeForm = mangoStore.getState().tradeForm
    const set = mangoStore.getState().set

    let price = Number(tradeForm.price)
    if (tradeForm.tradeType === 'Market') {
      const orderbook = mangoStore.getState().selectedMarket.orderbook
      price = calculateLimitPriceForMarketOrder(
        orderbook,
        positionSize,
        tradeForm.side,
      )
    }
    const newSide = positionSize > 0 ? 'sell' : 'buy'
    const baseSize = Math.abs(positionSize)
    const quoteSize = floorToDecimal(
      baseSize * price,
      getDecimalCount(market.tickSize),
    )

    set((s) => {
      s.tradeForm.side = newSide
      s.tradeForm.baseSize = baseSize.toString()
      s.tradeForm.quoteSize = quoteSize.toString()
    })
  }

  const showClosePositionModal = useCallback((position: PerpPosition) => {
    setShowMarketCloseModal(true)
    setPositionToClose(position)
  }, [])

  const hideClosePositionModal = useCallback(() => {
    setShowMarketCloseModal(false)
    setPositionToClose(null)
  }, [])

  const handleShowShare = (position: PerpPosition) => {
    setPositionToShare(position)
    setShowShareModal(true)
  }

  if (!group) return null

  return (
    <>
      {mangoAccount && openPerpPositions.length ? (
        showTableView ? (
          <div className="thin-scroll overflow-x-auto">
            <Table>
              <thead>
                <TrHead>
                  <Th className="text-left">{t('market')}</Th>
                  <Th className="text-right">{t('trade:size')}</Th>
                  <Th className="text-right">{t('trade:avg-entry-price')}</Th>
                  <Th>
                    <div className="flex justify-end">
                      <Tooltip content={t('trade:tooltip-est-liq-price')}>
                        <span className="tooltip-underline">
                          {t('trade:est-liq-price')}
                        </span>
                      </Tooltip>
                    </div>
                  </Th>
                  <Th className="text-right">{t('funding')}</Th>
                  <Th className="text-right">{t('trade:unrealized-pnl')}</Th>
                  <Th className="text-right">ROE</Th>
                  {!isUnownedAccount ? (
                    <Th>
                      {openPerpPositions?.length > 1 ? (
                        <div className="flex justify-end">
                          <div className="flex items-center">
                            <NukeIcon className="mr-1.5 h-4 w-4 text-th-active" />
                            <LinkButton
                              onClick={() => setShowCloseAllModal(true)}
                            >
                              {t('trade:close-all')}
                            </LinkButton>
                          </div>
                        </div>
                      ) : null}
                    </Th>
                  ) : null}
                </TrHead>
              </thead>
              <tbody>
                {openPerpPositions.map((position, index) => {
                  const market = group.getPerpMarketByMarketIndex(
                    position.marketIndex,
                  )
                  const basePosition = position.getBasePositionUi(market)
                  const floorBasePosition = floorToDecimal(
                    basePosition,
                    getDecimalCount(market.minOrderSize),
                  ).toNumber()
                  const isSelectedMarket =
                    selectedMarket instanceof PerpMarket &&
                    selectedMarket.perpMarketIndex === position.marketIndex

                  if (!basePosition) return null

                  const isLong = basePosition > 0
                  const avgEntryPrice = position.getAverageEntryPriceUi(market)
                  const unsettledPnl = position.getUnsettledPnlUi(market)
                  const totalPnl =
                    position.cumulativePnlOverPositionLifetimeUi(market)
                  const unrealizedPnl = position.getUnRealizedPnlUi(market)
                  const realizedPnl = position.getRealizedPnlUi()
                  const positionFunding =
                    position.getCumulativeFundingUi(market)
                  const roe =
                    (unrealizedPnl / (Math.abs(basePosition) * avgEntryPrice)) *
                    100
                  let estLiqPrice
                  try {
                    estLiqPrice = position.getLiquidationPriceUi(
                      group,
                      mangoAccount,
                    )
                  } catch (e) {
                    estLiqPrice = null
                  }

                  return (
                    <TrBody
                      key={`${position.marketIndex}`}
                      className="my-1 p-2"
                    >
                      <Td>
                        <TableMarketName
                          market={market}
                          side={isLong ? 'long' : 'short'}
                        />
                      </Td>
                      <Td className="text-right font-mono">
                        {isSelectedMarket ? (
                          <div className="flex flex-col items-end space-y-0.5">
                            <LinkButton
                              className="font-normal underline underline-offset-2 md:underline-offset-4 md:hover:no-underline"
                              onClick={() =>
                                handlePositionClick(floorBasePosition, market)
                              }
                            >
                              <FormatNumericValue
                                value={Math.abs(basePosition)}
                                decimals={getDecimalCount(market.minOrderSize)}
                              />
                            </LinkButton>
                            <FormatNumericValue
                              classNames="text-xs text-th-fgd-3"
                              value={
                                Math.abs(floorBasePosition) * market._uiPrice
                              }
                              isUsd
                              isPrivate
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-end space-y-0.5">
                            <FormatNumericValue
                              value={Math.abs(basePosition)}
                              decimals={getDecimalCount(market.minOrderSize)}
                            />
                            <FormatNumericValue
                              classNames="text-xs text-th-fgd-3"
                              value={
                                Math.abs(floorBasePosition) * market.uiPrice
                              }
                              isUsd
                              isPrivate
                            />
                          </div>
                        )}
                      </Td>
                      <Td className="text-right font-mono">
                        <FormatNumericValue
                          value={avgEntryPrice}
                          decimals={getDecimalCount(market.tickSize)}
                          isUsd
                        />
                      </Td>
                      <Td className="text-right font-mono">
                        {estLiqPrice ? (
                          <FormatNumericValue
                            value={estLiqPrice}
                            decimals={getDecimalCount(market.tickSize)}
                            isUsd
                            isPrivate
                          />
                        ) : (
                          '–'
                        )}
                      </Td>
                      <Td className="text-right font-mono">
                        <span
                          className={
                            positionFunding >= 0 ? 'text-th-up' : 'text-th-down'
                          }
                        >
                          <FormatNumericValue
                            value={positionFunding}
                            decimals={2}
                            isUsd
                          />
                        </span>
                      </Td>
                      <Td className="text-right font-mono">
                        <div className="flex flex-col items-end">
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
                                unrealizedPnl >= 0
                                  ? 'text-th-up'
                                  : 'text-th-down'
                              }`}
                            >
                              <FormatNumericValue
                                value={unrealizedPnl}
                                isUsd
                                decimals={2}
                                isPrivate
                              />
                            </span>
                          </Tooltip>
                        </div>
                      </Td>
                      <Td className="text-right font-mono">
                        <span
                          className={roe >= 0 ? 'text-th-up' : 'text-th-down'}
                        >
                          <FormatNumericValue value={roe} decimals={2} />%
                        </span>
                      </Td>
                      {!isUnownedAccount ? (
                        <Td>
                          <div className="flex items-center justify-end space-x-4">
                            <Button
                              className="text-xs"
                              secondary
                              size="small"
                              onClick={() => showClosePositionModal(position)}
                            >
                              {t('close')}
                            </Button>
                            <IconButton
                              hideBg
                              onClick={() =>
                                handleShowShare(openPerpPositions[index])
                              }
                              disabled={!group || !basePosition}
                            >
                              <TwitterIcon className="h-4 w-4" />
                            </IconButton>
                          </div>
                        </Td>
                      ) : null}
                    </TrBody>
                  )
                })}
                {openPerpPositions.length > 1 ? (
                  <tr
                    key={`total-unrealized-pnl`}
                    className="my-1 border-y border-th-bkg-3 p-2"
                  >
                    <Td className="text-right font-mono">
                      <></>
                    </Td>
                    <Td className="text-right font-mono">
                      <></>
                    </Td>
                    <Td className="text-right font-mono">
                      <></>
                    </Td>
                    <Td className="text-right font-mono">
                      <></>
                    </Td>
                    <Td className="text-right font-mono">
                      <></>
                    </Td>
                    <Td className="text-right font-mono">
                      <div className="flex items-center justify-end">
                        <span className="mr-2 font-body text-xs text-th-fgd-3">
                          Total:
                        </span>
                        <Tooltip
                          content={
                            <PnlTooltipContent
                              unrealizedPnl={totalPnlStats.unrealized}
                              realizedPnl={totalPnlStats.realized}
                              totalPnl={totalPnlStats.total}
                              unsettledPnl={totalPnlStats.unsettled}
                            />
                          }
                          delay={100}
                        >
                          <div className="flex">
                            <span>
                              <FormatNumericValue
                                classNames={`tooltip-underline ${
                                  totalPnlStats.unrealized >= 0
                                    ? 'text-th-up'
                                    : 'text-th-down'
                                }`}
                                value={totalPnlStats.unrealized}
                                isUsd
                                decimals={2}
                                isPrivate
                              />
                            </span>
                          </div>
                        </Tooltip>
                      </div>
                    </Td>
                    <Td className="text-right font-mono">
                      <span
                        className={
                          totalPnlStats.roe >= 0 ? 'text-th-up' : 'text-th-down'
                        }
                      >
                        <FormatNumericValue
                          value={totalPnlStats.roe}
                          decimals={2}
                        />
                        %
                      </span>
                    </Td>
                    {!isUnownedAccount ? (
                      <Td className="text-right font-mono">
                        {' '}
                        <></>
                      </Td>
                    ) : null}
                  </tr>
                ) : null}
              </tbody>
            </Table>
          </div>
        ) : (
          <div className="border-b border-th-bkg-3">
            {openPerpPositions.map((position, i) => {
              const market = group.getPerpMarketByMarketIndex(
                position.marketIndex,
              )
              const basePosition = position.getBasePositionUi(market)
              const floorBasePosition = floorToDecimal(
                basePosition,
                getDecimalCount(market.minOrderSize),
              ).toNumber()
              const isSelectedMarket =
                selectedMarket instanceof PerpMarket &&
                selectedMarket.perpMarketIndex === position.marketIndex

              if (!basePosition) return null
              const side =
                basePosition > 0 ? 'buy' : basePosition < 0 ? 'sell' : ''
              const avgEntryPrice = position.getAverageEntryPriceUi(market)
              const totalPnl =
                position.cumulativePnlOverPositionLifetimeUi(market)
              const unrealizedPnl = position.getUnRealizedPnlUi(market)
              const realizedPnl = position.getRealizedPnlUi()
              const roe =
                (unrealizedPnl / (Math.abs(basePosition) * avgEntryPrice)) * 100
              const estLiqPrice = position.getLiquidationPriceUi(
                group,
                mangoAccount,
              )
              const positionFunding = position.getCumulativeFundingUi(market)
              const unsettledPnl = position.getUnsettledPnlUi(market)
              const notional = Math.abs(floorBasePosition) * market._uiPrice
              return (
                <Disclosure key={position.marketIndex}>
                  {({ open }) => (
                    <>
                      <Disclosure.Button
                        className={`flex w-full items-center justify-between border-t border-th-bkg-3 p-4 text-left focus:outline-none ${
                          i === 0 ? 'border-t-0' : ''
                        }`}
                      >
                        <div className="flex items-center">
                          <MarketLogos market={market} size="large" />
                          <div>
                            <div className="flex space-x-1 text-th-fgd-2">
                              <span className="whitespace-nowrap">
                                {market.name}
                              </span>
                              <PerpSideBadge
                                basePosition={side === 'buy' ? 1 : -1}
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono">
                                <FormatNumericValue
                                  value={Math.abs(basePosition)}
                                  decimals={getDecimalCount(
                                    market.minOrderSize,
                                  )}
                                />
                              </span>
                              <span className="text-th-fgd-4">|</span>
                              <span className="font-mono">
                                <FormatNumericValue
                                  value={notional}
                                  isUsd
                                  isPrivate
                                />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-mono ${
                              unrealizedPnl > 0 ? 'text-th-up' : 'text-th-down'
                            }`}
                          >
                            <FormatNumericValue
                              value={unrealizedPnl}
                              isUsd
                              decimals={2}
                              isPrivate
                            />
                          </span>
                          <ChevronDownIcon
                            className={`${
                              open ? 'rotate-180' : 'rotate-0'
                            } ml-3 h-6 w-6 shrink-0 text-th-fgd-3`}
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
                                {t('trade:size')}
                              </p>
                              {isSelectedMarket ? (
                                <div className="space-y-0.5">
                                  <LinkButton
                                    className="font-normal underline underline-offset-2 md:underline-offset-4 md:hover:no-underline"
                                    onClick={() =>
                                      handlePositionClick(
                                        floorBasePosition,
                                        market,
                                      )
                                    }
                                  >
                                    <FormatNumericValue
                                      value={Math.abs(basePosition)}
                                      decimals={getDecimalCount(
                                        market.minOrderSize,
                                      )}
                                    />
                                  </LinkButton>
                                  <FormatNumericValue
                                    classNames="text-xs text-th-fgd-3"
                                    value={notional}
                                    isUsd
                                    isPrivate
                                  />
                                </div>
                              ) : (
                                <div className="flex flex-col font-mono text-th-fgd-2">
                                  <FormatNumericValue
                                    value={Math.abs(basePosition)}
                                    decimals={getDecimalCount(
                                      market.minOrderSize,
                                    )}
                                  />
                                  <FormatNumericValue
                                    classNames="text-xs text-th-fgd-3"
                                    value={
                                      Math.abs(floorBasePosition) *
                                      market._uiPrice
                                    }
                                    isUsd
                                    isPrivate
                                  />
                                </div>
                              )}
                            </div>
                            <div className="col-span-1">
                              <p className="text-xs text-th-fgd-3">
                                {t('trade:avg-entry-price')}
                              </p>
                              <p className="font-mono text-th-fgd-2">
                                <FormatNumericValue
                                  value={avgEntryPrice}
                                  decimals={getDecimalCount(market.tickSize)}
                                  isUsd
                                />
                              </p>
                            </div>
                            <div className="col-span-1">
                              <Tooltip
                                content={t('trade:tooltip-est-liq-price')}
                              >
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
                                    isPrivate
                                  />
                                ) : (
                                  '–'
                                )}
                              </p>
                            </div>
                            <div className="col-span-1">
                              <p className="text-xs text-th-fgd-3">
                                {t('trade:unsettled')} {t('pnl')}
                              </p>
                              <p className="font-mono text-th-fgd-2">
                                <FormatNumericValue
                                  value={unsettledPnl}
                                  isUsd
                                  decimals={2}
                                  isPrivate
                                />
                              </p>
                            </div>
                            <div className="col-span-1">
                              <p className="text-xs text-th-fgd-3">
                                {t('funding')}
                              </p>
                              <p
                                className={`font-mono ${
                                  positionFunding >= 0
                                    ? 'text-th-up'
                                    : 'text-th-down'
                                }`}
                              >
                                <FormatNumericValue
                                  value={positionFunding}
                                  decimals={2}
                                  isUsd
                                />
                              </p>
                            </div>
                            <div className="col-span-1">
                              <p className="text-xs text-th-fgd-3">
                                {t('trade:unrealized-pnl')}
                              </p>
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
                                  className={`tooltip-underline mb-1 font-mono ${
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
                            <div className="col-span-2 mt-3 flex space-x-3">
                              <Button
                                className="w-full text-xs sm:text-sm"
                                secondary
                                onClick={() => showClosePositionModal(position)}
                              >
                                {t('close')}
                              </Button>
                              {openPerpPositions?.length > 1 ? (
                                <Button
                                  className="w-full text-xs sm:text-sm"
                                  secondary
                                  onClick={() => setShowCloseAllModal(true)}
                                >
                                  <div className="flex items-center justify-center">
                                    <NukeIcon className="mr-2 h-4 w-4 shrink-0 text-th-active" />
                                    {t('trade:close-all')}
                                  </div>
                                </Button>
                              ) : null}
                              <Button
                                className="w-full text-xs sm:text-sm"
                                secondary
                                onClick={() =>
                                  handleShowShare(openPerpPositions[i])
                                }
                                disabled={!group || !basePosition}
                              >
                                <div className="flex items-center justify-center">
                                  <TwitterIcon className="mr-2 h-4 w-4 shrink-0" />
                                  {t('trade:tweet-position')}
                                </div>
                              </Button>
                            </div>
                          </div>
                        </Disclosure.Panel>
                      </Transition>
                    </>
                  )}
                </Disclosure>
              )
            })}
            {openPerpPositions.length > 0 ? (
              <div className="flex items-center justify-end space-x-3 border-t border-th-bkg-3 px-4 py-2">
                <span>
                  <span className="text-md font-body text-xs text-th-fgd-3">
                    Total Unrealized PnL:{' '}
                  </span>
                  <span
                    className={`font-mono ${
                      totalPnlStats.unrealized >= 0
                        ? 'text-th-up'
                        : 'text-th-down'
                    }`}
                  >
                    <FormatNumericValue
                      value={totalPnlStats.unrealized}
                      isUsd
                      decimals={2}
                      isPrivate
                    />
                  </span>
                </span>
                <span>
                  <span className="text-md font-body text-xs text-th-fgd-3">
                    ROE:{' '}
                  </span>
                  <span
                    className={`font-mono ${
                      totalPnlStats.roe >= 0 ? 'text-th-up' : 'text-th-down'
                    }`}
                  >
                    <FormatNumericValue
                      value={totalPnlStats.roe}
                      decimals={2}
                    />
                    %
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        )
      ) : mangoAccount || connected ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center p-8">
            <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
            <p>{t('trade:no-positions')}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center p-8">
          <ConnectEmptyState text={t('trade:connect-positions')} />
        </div>
      )}
      {showShareModal ? (
        <SharePositionModal
          group={group}
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          position={positionToShare!}
        />
      ) : null}
      {showMarketCloseModal && positionToClose ? (
        <MarketCloseModal
          isOpen={showMarketCloseModal}
          onClose={hideClosePositionModal}
          position={positionToClose}
        />
      ) : null}
      {showCloseAllModal ? (
        <CloseAllPositionsModal
          isOpen={showCloseAllModal}
          onClose={() => setShowCloseAllModal(false)}
        />
      ) : null}
    </>
  )
}

export default PerpPositions
