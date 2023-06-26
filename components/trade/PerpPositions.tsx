import { PerpMarket, PerpPosition } from '@blockworks-foundation/mango-v4'
import { TwitterIcon } from '@components/icons/TwitterIcon'
import SharePositionModal from '@components/modals/SharePositionModal'
import Button, { IconButton, LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useState } from 'react'
import {
  floorToDecimal,
  formatCurrencyValue,
  getDecimalCount,
} from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import MarketCloseModal from './MarketCloseModal'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'
import TableMarketName from './TableMarketName'
import Tooltip from '@components/shared/Tooltip'

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
  const { mangoAccountAddress } = useMangoAccount()
  const { isUnownedAccount } = useUnownedAccount()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const { asPath } = useRouter()

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

  if (!group) return null

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
                    <Th className="text-right">{t('trade:side')}</Th>
                    <Th className="text-right">{t('trade:size')}</Th>
                    <Th className="text-right">{t('trade:notional')}</Th>
                    <Th className="text-right">{t('trade:entry-price')}</Th>
                    <Th className="text-right">{t('trade:oracle-price')}</Th>
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

                    const unsettledPnl = position.getUnsettledPnlUi(market)
                    const totalPnl =
                      position.cumulativePnlOverPositionLifetimeUi(market)
                    const unrealizedPnl = position.getUnRealizedPnlUi(market)
                    const realizedPnl = position.getRealizedPnlUi()

                    return (
                      <TrBody
                        key={`${position.marketIndex}`}
                        className="my-1 p-2"
                      >
                        <Td>
                          <TableMarketName market={market} />
                        </Td>
                        <Td className="text-right">
                          <PerpSideBadge basePosition={basePosition} />
                        </Td>
                        <Td className="text-right font-mono">
                          <p className="flex justify-end">
                            {isSelectedMarket ? (
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
                            ) : (
                              <FormatNumericValue
                                value={Math.abs(basePosition)}
                                decimals={getDecimalCount(market.minOrderSize)}
                              />
                            )}
                          </p>
                        </Td>
                        <Td className="text-right font-mono">
                          <FormatNumericValue
                            value={
                              Math.abs(floorBasePosition) * market._uiPrice
                            }
                            isUsd
                          />
                        </Td>
                        <Td className="text-right font-mono">
                          <FormatNumericValue
                            value={position.getAverageEntryPriceUi(market)}
                            decimals={getDecimalCount(market.tickSize)}
                            isUsd
                          />
                        </Td>
                        <Td className="text-right font-mono">
                          <FormatNumericValue
                            value={market.uiPrice}
                            decimals={getDecimalCount(market.tickSize)}
                            isUsd
                          />
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
                              />
                            }
                            delay={100}
                          >
                            <span
                              className={`tooltip-underline ${
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
          <>
            {openPerpPositions.map((position) => {
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
              const totalPnl =
                position.cumulativePnlOverPositionLifetimeUi(market)
              const unrealizedPnl = position.getUnRealizedPnlUi(market)
              const realizedPnl = position.getRealizedPnlUi()
              return (
                <div
                  className="flex items-center justify-between border-b border-th-bkg-3 p-4"
                  key={`${position.marketIndex}`}
                >
                  <div className="flex items-start">
                    <div className="mt-0.5">
                      <MarketLogos market={market} size="large" />
                    </div>
                    <div>
                      <div className="mb-1 flex space-x-1 leading-none text-th-fgd-2">
                        {selectedMarket?.name === market.name ? (
                          <span className="whitespace-nowrap">
                            {market.name}
                          </span>
                        ) : (
                          <Link href={`/trade?name=${market.name}`}>
                            <div className="flex items-center underline underline-offset-2 md:hover:text-th-fgd-3 md:hover:no-underline">
                              <span className="whitespace-nowrap">
                                {market.name}
                              </span>
                            </div>
                          </Link>
                        )}
                        <PerpSideBadge basePosition={basePosition} />
                      </div>
                      <div className="flex items-center space-x-1 leading-none">
                        <p className="flex text-th-fgd-4">
                          <span className="font-mono text-th-fgd-3">
                            {isSelectedMarket && asPath === '/trade' ? (
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
                            ) : (
                              <FormatNumericValue
                                value={Math.abs(basePosition)}
                                decimals={getDecimalCount(market.minOrderSize)}
                              />
                            )}
                          </span>
                          <span className="mx-1">from</span>
                          <span className="font-mono text-th-fgd-3">
                            <FormatNumericValue
                              value={position.getAverageEntryPriceUi(market)}
                              decimals={getDecimalCount(market.tickSize)}
                              isUsd
                            />
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div
                      className={`text-right font-mono leading-none ${
                        unrealizedPnl > 0 ? 'text-th-up' : 'text-th-down'
                      }`}
                    >
                      <Tooltip
                        content={
                          <PnlTooltipContent
                            unrealizedPnl={unrealizedPnl}
                            realizedPnl={realizedPnl}
                            totalPnl={totalPnl}
                          />
                        }
                        delay={100}
                      >
                        <p className="tooltip-underline mb-1 font-body text-th-fgd-4">
                          {t('trade:unrealized-pnl')}
                        </p>
                      </Tooltip>
                      <FormatNumericValue value={unrealizedPnl} isUsd />
                    </div>
                    {!isUnownedAccount ? (
                      <Button
                        className="text-xs"
                        secondary
                        size="small"
                        onClick={() => showClosePositionModal(position)}
                      >
                        Close
                      </Button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </>
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
}: {
  unrealizedPnl: number
  realizedPnl: number
  totalPnl: number
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
