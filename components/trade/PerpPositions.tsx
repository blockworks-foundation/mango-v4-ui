import { PerpMarket, PerpPosition } from '@blockworks-foundation/mango-v4'
import Button, { LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import MarketCloseModal from './MarketCloseModal'
import PerpSideBadge from './PerpSideBadge'
import TableMarketName from './TableMarketName'

const PerpPositions = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const [showMarketCloseModal, setShowMarketCloseModal] = useState(false)
  const [positionToClose, setPositionToClose] = useState<PerpPosition | null>(
    null
  )
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const { selectedMarket } = useSelectedMarket()
  const { connected } = useWallet()
  const { mangoAccountAddress } = useMangoAccount()

  const handlePositionClick = (positionSize: number) => {
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

    set((s) => {
      s.tradeForm.side = newSide
      s.tradeForm.baseSize = positionSize.toString()
      if (newSide === 'buy') {
        s.tradeForm.quoteSize = (positionSize * price).toString()
      } else {
        s.tradeForm.quoteSize = (positionSize / price).toString()
      }
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

  if (!group) return null

  const openPerpPositions = Object.values(perpPositions).filter((p) =>
    p.basePositionLots.toNumber()
  )

  return mangoAccountAddress && openPerpPositions.length ? (
    <div>
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('market')}</Th>
            <Th className="text-right">{t('trade:side')}</Th>
            <Th className="text-right">{t('trade:size')}</Th>
            <Th className="text-right">{t('trade:notional')}</Th>
            <Th className="text-right">{t('trade:entry-price')}</Th>
            <Th className="text-right">{`${t('trade:unsettled')} ${t(
              'pnl'
            )}`}</Th>
            <Th className="text-right">{t('pnl')}</Th>
            <Th />
          </TrHead>
        </thead>
        <tbody>
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

            const unsettledPnl = position.getUnsettledPnlUi(group, market)
            const cummulativePnl = position.cumulativePnlOverPositionLifetimeUi(
              group,
              market
            )

            return (
              <TrBody key={`${position.marketIndex}`} className="my-1 p-2">
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
                        onClick={() => handlePositionClick(floorBasePosition)}
                      >
                        <FormatNumericValue
                          value={Math.abs(basePosition)}
                          decimals={getDecimalCount(market.minOrderSize)}
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
                    value={floorBasePosition * market._uiPrice}
                    decimals={2}
                    isUsd
                  />
                </Td>
                <Td className="text-right font-mono">
                  <FormatNumericValue
                    value={position.getAverageEntryPriceUi(market)}
                    isUsd
                  />
                </Td>
                <Td className={`text-right font-mono`}>
                  <FormatNumericValue
                    value={unsettledPnl}
                    decimals={market.baseDecimals}
                  />
                </Td>
                <Td
                  className={`text-right font-mono ${
                    cummulativePnl > 0 ? 'text-th-up' : 'text-th-down'
                  }`}
                >
                  <FormatNumericValue value={cummulativePnl} isUsd />
                </Td>
                <Td className={`text-right`}>
                  <Button
                    className="text-xs"
                    secondary
                    size="small"
                    onClick={() => showClosePositionModal(position)}
                  >
                    Close
                  </Button>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
      {showMarketCloseModal && positionToClose ? (
        <MarketCloseModal
          isOpen={showMarketCloseModal}
          onClose={hideClosePositionModal}
          position={positionToClose}
        />
      ) : null}
    </div>
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-col items-center p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{t('trade:no-positions')}</p>
    </div>
  ) : (
    <div className="p-8">
      <ConnectEmptyState text={t('trade:connect-positions')} />
    </div>
  )
}

export default PerpPositions
