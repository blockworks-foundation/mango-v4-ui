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
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import MarketCloseModal from './MarketCloseModal'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'
import TableMarketName from './TableMarketName'

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
    const quoteSize = floorToDecimal(
      positionSize * price,
      getDecimalCount(market.tickSize)
    )

    set((s) => {
      s.tradeForm.side = newSide
      s.tradeForm.baseSize = positionSize.toString()
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

  const openPerpPositions = Object.values(perpPositions).filter((p) =>
    p.basePositionLots.toNumber()
  )

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
                    <Th className="text-right">{t('pnl')}</Th>
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
                    const cummulativePnl =
                      position.cumulativePnlOverPositionLifetimeUi(market)

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
                        <Td
                          className={`text-right font-mono ${
                            cummulativePnl > 0 ? 'text-th-up' : 'text-th-down'
                          }`}
                        >
                          <FormatNumericValue
                            value={cummulativePnl}
                            isUsd
                            decimals={2}
                          />
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
              const cummulativePnl =
                position.cumulativePnlOverPositionLifetimeUi(market)
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
                            <div className="default-transition flex items-center underline underline-offset-2 md:hover:text-th-fgd-3 md:hover:no-underline">
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
                                className="font-normal"
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
                        cummulativePnl > 0 ? 'text-th-up' : 'text-th-down'
                      }`}
                    >
                      <p className="mb-1 text-th-fgd-4">PnL</p>
                      <FormatNumericValue value={cummulativePnl} isUsd />
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
