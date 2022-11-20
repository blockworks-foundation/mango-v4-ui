import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { LinkButton } from '@components/shared/Button'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import useMangoGroup from 'hooks/useMangoGroup'
import useSelectedMarket from 'hooks/useSelectedMarket'
import { useTranslation } from 'next-i18next'
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

    set((s) => {
      s.tradeForm.baseSize = positionSize.toFixed()
      s.tradeForm.quoteSize = (positionSize / price).toFixed()
    })
  }

  if (!group) return null

  return Object.entries(perpPositions).length ? (
    <div>
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">{t('market')}</Th>
            <Th className="text-right">{t('trade:side')}</Th>
            <Th className="text-right">{t('trade:size')}</Th>
            <Th className="text-right">{t('value')}</Th>
          </TrHead>
        </thead>
        <tbody>
          {Object.entries(perpPositions).map(([_mkt, position]) => {
            const market = group.getPerpMarketByMarketIndex(
              position.marketIndex
            )
            const basePosition = position.getBasePositionUi(market)
            const isSelectedMarket =
              selectedMarket instanceof PerpMarket &&
              selectedMarket.perpMarketIndex === position.marketIndex

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
