import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import {
  formatDecimal,
  formatFixedDecimals,
  getDecimalCount,
  numberFormat,
  trimDecimals,
} from 'utils/numbers'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import PerpSideBadge from './PerpSideBadge'
import TableMarketName from './TableMarketName'

const PerpPositions = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const { selectedMarket } = useSelectedMarket()
  const { connected } = useWallet()
  const { mangoAccount } = useMangoAccount()

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

  if (!group) return null

  const openPerpPositions = Object.values(perpPositions).filter((p) =>
    p.basePositionLots.toNumber()
  )

  return mangoAccount && openPerpPositions.length ? (
    <div>
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('market')}</Th>
            <Th className="text-right">{t('trade:side')}</Th>
            <Th className="text-right">{t('trade:size')}</Th>
            <Th className="text-right">{t('trade:notional')}</Th>
            <Th className="text-right">{t('trade:entry-price')}</Th>
            <Th className="text-right">Unsettled PnL</Th>
            <Th className="text-right">PnL</Th>
          </TrHead>
        </thead>
        <tbody>
          {openPerpPositions.map((position) => {
            const market = group.getPerpMarketByMarketIndex(
              position.marketIndex
            )
            const basePosition = position.getBasePositionUi(market)
            const trimmedBasePosition = trimDecimals(
              basePosition,
              getDecimalCount(market.minOrderSize)
            )
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
                        onClick={() => handlePositionClick(trimmedBasePosition)}
                      >
                        {Math.abs(trimmedBasePosition)}
                      </LinkButton>
                    ) : (
                      Math.abs(trimmedBasePosition)
                    )}
                  </p>
                </Td>
                <Td className="text-right font-mono">
                  <div>
                    $
                    {Math.abs(trimmedBasePosition * market._uiPrice).toFixed(2)}
                  </div>
                </Td>
                <Td className="text-right font-mono">
                  <div>
                    $
                    {numberFormat.format(
                      position.getAverageEntryPriceUi(market)
                    )}
                  </div>
                </Td>
                <Td className={`text-right font-mono`}>
                  <div>{formatDecimal(unsettledPnl, market.baseDecimals)}</div>
                </Td>
                <Td
                  className={`text-right font-mono ${
                    cummulativePnl > 0 ? 'text-th-up' : 'text-th-down'
                  }`}
                >
                  <div>{formatFixedDecimals(cummulativePnl, true)}</div>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    </div>
  ) : connected ? (
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
