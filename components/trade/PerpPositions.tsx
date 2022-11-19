import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { LinkButton } from '@components/shared/Button'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import { useTranslation } from 'next-i18next'
import { calculateMarketPrice } from 'utils/tradeForm'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'

const PerpPositions = () => {
  const { t } = useTranslation(['common', 'trade'])
  const group = mangoStore((s) => s.group)
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)

  const handlePositionClick = (positionSize: number) => {
    const tradeForm = mangoStore.getState().tradeForm
    const set = mangoStore.getState().set

    let price = new Decimal(tradeForm.price).toNumber()
    if (tradeForm.tradeType === 'Market') {
      const orderbook = mangoStore.getState().selectedMarket.orderbook
      const side = tradeForm.side === 'buy' ? 'sell' : 'buy'
      price = calculateMarketPrice(orderbook, positionSize, side)
    }

    if (tradeForm.side === 'buy') {
      set((s) => {
        s.tradeForm.side = 'sell'
        s.tradeForm.baseSize = positionSize.toFixed()
        s.tradeForm.quoteSize = (positionSize / price).toFixed()
      })
    }
  }

  if (!group) return null

  return Object.entries(perpPositions).length ? (
    <div>
      <table>
        <thead>
          <tr>
            <th className="text-left">{t('market')}</th>
            <th className="text-right">{t('trade:side')}</th>
            <th className="text-right">{t('trade:size')}</th>
            <th className="text-right">{t('value')}</th>
          </tr>
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
              <tr key={`${position.marketIndex}`} className="my-1 p-2">
                <td>
                  <div className="flex items-center">
                    <MarketLogos market={market!} />
                    {market?.name}
                  </div>
                </td>
                <td className="text-right">
                  <PerpSideBadge basePosition={basePosition} />
                </td>
                <td className="text-right">
                  <p className="flex justify-end">
                    {isSelectedMarket ? (
                      <LinkButton
                        onClick={() => handlePositionClick(basePosition)}
                      >
                        {basePosition}
                      </LinkButton>
                    ) : (
                      basePosition
                    )}
                  </p>
                </td>
                <td className="text-right">
                  <div>
                    ${Math.abs(basePosition * market._uiPrice).toFixed(2)}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  ) : (
    <div className="flex flex-col items-center p-8">
      <p>{t('trade:no-positions')}</p>
    </div>
  )
}

export default PerpPositions
