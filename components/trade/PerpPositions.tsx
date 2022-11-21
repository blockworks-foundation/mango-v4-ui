import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { LinkButton } from '@components/shared/Button'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
import { numberFormat } from 'utils/numbers'
import { calculateMarketPrice } from 'utils/tradeForm'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'

const PerpPositions = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const { selectedMarket } = useSelectedMarket()

  const handlePositionClick = (positionSize: number) => {
    const tradeForm = mangoStore.getState().tradeForm
    const set = mangoStore.getState().set

    let price = new Decimal(tradeForm.price).toNumber()
    if (tradeForm.tradeType === 'Market') {
      const orderbook = mangoStore.getState().selectedMarket.orderbook
      price = calculateMarketPrice(orderbook, positionSize, tradeForm.side)
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

  return openPerpPositions.length ? (
    <div>
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('market')}</Th>
            <Th className="text-right">{t('trade:side')}</Th>
            <Th className="text-right">{t('trade:size')}</Th>
            <Th className="text-right">{t('value')}</Th>
            <Th className="text-right">{t('trade:entry-price')}</Th>
          </TrHead>
        </thead>
        <tbody>
          {openPerpPositions.map((position) => {
            const market = group.getPerpMarketByMarketIndex(
              position.marketIndex
            )
            const basePosition = position.getBasePositionUi(market)
            const isSelectedMarket =
              selectedMarket instanceof PerpMarket &&
              selectedMarket.perpMarketIndex === position.marketIndex

            if (!basePosition) return null

            return (
              <TrBody key={`${position.marketIndex}`} className="my-1 p-2">
                <Td>
                  <div className="flex items-center">
                    <MarketLogos market={market} />
                    {market?.name}
                  </div>
                </Td>
                <Td className="text-right">
                  <PerpSideBadge basePosition={basePosition} />
                </Td>
                <Td className="text-right">
                  <p className="flex justify-end">
                    {isSelectedMarket ? (
                      <LinkButton
                        onClick={() => handlePositionClick(basePosition)}
                      >
                        {Math.abs(basePosition)}
                      </LinkButton>
                    ) : (
                      Math.abs(basePosition)
                    )}
                  </p>
                </Td>
                <Td className="text-right">
                  <div>
                    ${Math.abs(basePosition * market._uiPrice).toFixed(2)}
                  </div>
                </Td>
                <Td className="text-right">
                  <div>
                    $
                    {numberFormat.format(
                      position.getEntryPrice(market).toNumber()
                    )}
                  </div>
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    </div>
  ) : (
    <div className="flex flex-col items-center p-8">
      <p>{t('trade:no-positions')}</p>
    </div>
  )
}

export default PerpPositions
