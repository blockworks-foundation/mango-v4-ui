import SideBadge from '@components/shared/SideBadge'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import MarketLogos from './MarketLogos'
import PerpSideBadge from './PerpSideBadge'

const PerpPositions = () => {
  const { t } = useTranslation(['common', 'trade'])
  const group = mangoStore((s) => s.group)
  const perpPositions = mangoStore((s) => s.mangoAccount.perpPositions)

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
          {Object.entries(perpPositions).map(([mkt, position]) => {
            const market = group.getPerpMarketByMarketIndex(
              position.marketIndex
            )
            const basePosition = position.getBasePositionUi(market)
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
                  <div className="">{basePosition}</div>
                </td>
                <td className="text-right">
                  <div className="">
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
