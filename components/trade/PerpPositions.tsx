import { PerpMarket, PerpPosition } from '@blockworks-foundation/mango-v4'
import { TwitterIcon } from '@components/icons/TwitterIcon'
import SharePositionModal from '@components/modals/SharePositionModal'
import Button, { IconButton, LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  ChevronDownIcon,
  NoSymbolIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import {
  floorToDecimal,
  formatCurrencyValue,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import MarketCloseModal from './MarketCloseModal'
import MarketLogos from './MarketLogos'
import TableMarketName from './TableMarketName'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure, Transition } from '@headlessui/react'

const PerpPositions = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const [showMarketCloseModal, setShowMarketCloseModal] = useState(false)
  const [positionToClose, setPositionToClose] = useState<PerpPosition | null>(
    null
  )
  const [showShareModal, setShowShareModal] = useState(false)
  const [positionToShare, setPositionToShare] = useState<PerpPosition | null>(
    null
  )
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const { selectedMarket } = useSelectedMarket()
  const { connected } = useWallet()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { isUnownedAccount } = useUnownedAccount()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const handlePositionClick = (positionSize: number, market: PerpMarket) => {
    const tradeForm = mangoStore.getState().tradeForm
    const set = mangoStore.getState().set

    let price = Number(tradeForm.price)
    if (tradeForm.tradeType === 'Market') {
      const orderbook = mangoStore.getState().selectedMarket.orderbook
      price = calculateLimitPriceForMarketOrder(
        orderbook,
        positionSize,
        tradeForm.side
      )
    }
    const newSide = positionSize > 0 ? 'sell' : 'buy'
    const baseSize = Math.abs(positionSize)
    const quoteSize = floorToDecimal(
      baseSize * price,
      getDecimalCount(market.tickSize)
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

  if (!group || !mangoAccount) return null

  const openPerpPositions = Object.values(perpPositions)
    .filter((p) => p.basePositionLots.toNumber())
    .sort((a, b) => {
      const aMarket = group.getPerpMarketByMarketIndex(a.marketIndex)
      const bMarket = group.getPerpMarketByMarketIndex(b.marketIndex)
      const aBasePosition = a.getBasePositionUi(aMarket)
      const bBasePosition = b.getBasePositionUi(bMarket)
      const aNotional = aBasePosition * aMarket._uiPrice
      const bNotional = bBasePosition * bMarket._uiPrice
      return Math.abs(bNotional) - Math.abs(aNotional)
    })

  return (
    <>
      {mangoAccountAddress && openPerpPositions.length ? (
        showTableView ? (
          <>
            <div className="thin-scroll overflow-x-auto">
              <Table>
                <thead>
                  <TrHead>
                    <Th className="text-left">{t('market')}</Th>
                    <Th className="text-right">{t('trade:size')}</Th>
                    <Th className="text-right">{t('trade:entry-price')}</Th>
                    <Th className="text-right">{t('trade:est-liq-price')}</Th>
                    <Th className="text-right">{`${t('trade:unsettled')} ${t(
                      'pnl'
                    )}`}</Th>
                    <Th className="text-right">{t('trade:unrealized-pnl')}</Th>
                    {!isUnownedAccount ? <Th /> : null}
                  </TrHead>
                </thead>
                <tbody>
                  {openPerpPositions.map((position, index) => {
                    const market = group.getPerpMarketByMarketIndex(
                      position.marketIndex
                    )
                    const basePosition = position.getBasePositionUi(market)
                    const floorBasePosition = floorToDecimal(
                      basePosition,
                      getDecimalCount(market.minOrderSize)
                    ).toNumber()
                    const isSelectedMarket =
                      selectedMarket instanceof PerpMarket &&
                      selectedMarket.perpMarketIndex === position.marketIndex

                    if (!basePosition) return null

                    const isLong = basePosition > 0
                    const unsettledPnl = position.getUnsettledPnlUi(market)
                    const totalPnl =
                      position.cumulativePnlOverPositionLifetimeUi(market)
                    const unrealizedPnl = position.getUnRealizedPnlUi(market)
                    const realizedPnl = position.getRealizedPnlUi()
                    const roe = unrealizedPnl / basePosition
                    const estLiqPrice = position.getLiquidationPriceUi(
                      group,
                      mangoAccount
                    )

                    return (
                      <TrBody
                        key={`${position.marketIndex}`}
                        className="my-1 p-2"
                      >
                        <Td>
                          <TableMarketName
                            market={market}
                            side={isLong ? 'buy' : 'sell'}
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
                                  decimals={getDecimalCount(
                                    market.minOrderSize
                                  )}
                                />
                              </LinkButton>
                              <FormatNumericValue
                                classNames="text-xs text-th-fgd-3"
                                value={
                                  Math.abs(floorBasePosition) * market._uiPrice
                                }
                                isUsd
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
                                  Math.abs(floorBasePosition) * market._uiPrice
                                }
                                isUsd
                              />
                            </div>
                          )}
                        </Td>
                        <Td className="font-mono">
                          <div className="flex flex-col items-end space-y-0.5">
                            <FormatNumericValue
                              value={position.getAverageEntryPriceUi(market)}
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
                        <Td className={`text-right font-mono`}>
                          <FormatNumericValue
                            value={unsettledPnl}
                            isUsd
                            decimals={2}
                          />
                        </Td>
                        <Td className="text-right font-mono">
                          <Tooltip
                            content={
                              <PnlTooltipContent
                                unrealizedPnl={unrealizedPnl}
                                realizedPnl={realizedPnl}
                                totalPnl={totalPnl}
                                roe={roe}
                              />
                            }
                            delay={100}
                          >
                            <span
                              className={`tooltip-underline mb-1 ${
                                unrealizedPnl > 0
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
                                Close
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
                </tbody>
              </Table>
            </div>
            {showMarketCloseModal && positionToClose ? (
              <MarketCloseModal
                isOpen={showMarketCloseModal}
                onClose={hideClosePositionModal}
                position={positionToClose}
              />
            ) : null}
          </>
        ) : (
          <div className="border-b border-th-bkg-3">
            {openPerpPositions.map((position, i) => {
              const market = group.getPerpMarketByMarketIndex(
                position.marketIndex
              )
              const basePosition = position.getBasePositionUi(market)
              const floorBasePosition = floorToDecimal(
                basePosition,
                getDecimalCount(market.minOrderSize)
              ).toNumber()
              const isSelectedMarket =
                selectedMarket instanceof PerpMarket &&
                selectedMarket.perpMarketIndex === position.marketIndex

              if (!basePosition) return null
              const side =
                basePosition > 0 ? 'buy' : basePosition < 0 ? 'sell' : ''
              const totalPnl =
                position.cumulativePnlOverPositionLifetimeUi(market)
              const unrealizedPnl = position.getUnRealizedPnlUi(market)
              const realizedPnl = position.getRealizedPnlUi()
              const roe = unrealizedPnl / basePosition
              const estLiqPrice = position.getLiquidationPriceUi(
                group,
                mangoAccount
              )
              const unsettledPnl = position.getUnsettledPnlUi(market)
              return (
                <Disclosure key={position.marketIndex}>
                  {({ open }) => (
                    <>
                      <Disclosure.Button
                        className={`flex w-full items-center justify-between border-t border-th-bkg-3 p-4 text-left focus:outline-none ${
                          i === 0 ? 'border-t-0' : ''
                        }`}
                      >
                        <div className="flex w-full flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div
                            className={`flex items-center ${
                              side === 'buy'
                                ? 'text-th-up'
                                : side === 'sell'
                                ? 'text-th-down'
                                : 'text-th-fgd-2'
                            }`}
                          >
                            <MarketLogos market={market} size="large" />
                            <span className="mr-1 whitespace-nowrap">
                              {market.name}
                            </span>
                            {side === 'buy' ? (
                              <ArrowTrendingUpIcon className="h-5 w-5" />
                            ) : side === 'sell' ? (
                              <ArrowTrendingDownIcon className="h-5 w-5" />
                            ) : null}
                          </div>
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
                            <span
                              className={`font-mono ${
                                unrealizedPnl > 0
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
                          </div>
                        </div>
                        <ChevronDownIcon
                          className={`${
                            open ? 'rotate-180' : 'rotate-360'
                          } ml-3 h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                        />
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
                                {t('trade:size')}
                              </p>
                              <p>
                                {isSelectedMarket ? (
                                  <div className=" space-y-0.5">
                                    <LinkButton
                                      className="font-normal underline underline-offset-2 md:underline-offset-4 md:hover:no-underline"
                                      onClick={() =>
                                        handlePositionClick(
                                          floorBasePosition,
                                          market
                                        )
                                      }
                                    >
                                      <FormatNumericValue
                                        value={Math.abs(basePosition)}
                                        decimals={getDecimalCount(
                                          market.minOrderSize
                                        )}
                                      />
                                    </LinkButton>
                                    <FormatNumericValue
                                      classNames="text-xs text-th-fgd-3"
                                      value={
                                        Math.abs(floorBasePosition) *
                                        market._uiPrice
                                      }
                                      isUsd
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-col font-mono text-th-fgd-2">
                                    <FormatNumericValue
                                      value={Math.abs(basePosition)}
                                      decimals={getDecimalCount(
                                        market.minOrderSize
                                      )}
                                    />
                                    <FormatNumericValue
                                      classNames="text-xs text-th-fgd-3"
                                      value={
                                        Math.abs(floorBasePosition) *
                                        market._uiPrice
                                      }
                                      isUsd
                                    />
                                  </div>
                                )}
                              </p>
                            </div>
                            <div className="col-span-1">
                              <p className="text-xs text-th-fgd-3">
                                {t('trade:entry-price')}
                              </p>
                              <div className="flex flex-col font-mono">
                                <FormatNumericValue
                                  classNames="text-th-fgd-2"
                                  value={position.getAverageEntryPriceUi(
                                    market
                                  )}
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
                              <p className="text-xs text-th-fgd-3">
                                {t('trade:est-liq-price')}
                              </p>
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
                                {t('trade:unsettled')}
                              </p>
                              <p className="font-mono text-th-fgd-2">
                                <FormatNumericValue
                                  value={unsettledPnl}
                                  isUsd
                                  decimals={2}
                                />
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
                                      roe={roe}
                                    />
                                  }
                                  delay={100}
                                >
                                  <span
                                    className={`tooltip-underline mb-1 ${
                                      unrealizedPnl > 0
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
                            <div className="col-span-2 mt-3 flex space-x-3">
                              <Button
                                className="w-1/2"
                                secondary
                                onClick={() => showClosePositionModal(position)}
                              >
                                {t('trade:close-position')}
                              </Button>
                              <Button
                                className="w-1/2"
                                secondary
                                onClick={() =>
                                  handleShowShare(openPerpPositions[i])
                                }
                                disabled={!group || !basePosition}
                              >
                                <div className="flex items-center justify-center">
                                  <TwitterIcon className="mr-2 h-4 w-4" />
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
          </div>
        )
      ) : mangoAccountAddress || connected ? (
        <div className="flex flex-col items-center p-8">
          <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
          <p>{t('trade:no-positions')}</p>
        </div>
      ) : (
        <div className="p-8">
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
    </>
  )
}

export default PerpPositions

const PnlTooltipContent = ({
  unrealizedPnl,
  realizedPnl,
  totalPnl,
  roe,
}: {
  unrealizedPnl: number
  realizedPnl: number
  totalPnl: number
  roe: number
}) => {
  const { t } = useTranslation(['common', 'trade'])
  return (
    <>
      <div className="mb-3 space-y-1">
        <div className="flex justify-between">
          <p className="mr-3">{t('trade:unrealized-pnl')}</p>
          <span className="font-mono text-th-fgd-2">
            {formatCurrencyValue(unrealizedPnl, 2)}
          </span>
        </div>
        <div className="flex justify-between">
          <p className="mr-3">{t('trade:realized-pnl')}</p>
          <span className="font-mono text-th-fgd-2">
            {formatCurrencyValue(realizedPnl, 2)}
          </span>
        </div>
        <div className="flex justify-between">
          <p className="mr-3">{t('trade:total-pnl')}</p>
          <span className="font-mono text-th-fgd-2">
            {formatCurrencyValue(totalPnl, 2)}
          </span>
        </div>
        <div className="flex justify-between">
          <p className="mr-3">ROE</p>
          <span className="font-mono text-th-fgd-2">
            {formatNumericValue(roe, 2)}%
          </span>
        </div>
      </div>
      <a
        href="https://docs.mango.markets/mango-markets/settle-pnl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t('learn-more')}
      </a>
    </>
  )
}
