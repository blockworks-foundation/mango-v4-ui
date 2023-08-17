import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import SheenLoader from '@components/shared/SheenLoader'
import PerpPositionsStatsTable from './PerpPositionsStatsTable'

const PerpMarketsPositions = () => {
  const { t } = useTranslation('stats')
  return (
    <>
      <div className="px-6 pb-2 pt-6">
        <h2 className="text-lg">{t('stats:largest-perp-positions')}</h2>
      </div>
      <LargestPerpPositions />
      <div className="px-6 pb-2 pt-8">
        <h2 className="text-lg">{t('stats:closest-to-liquidation')}</h2>
      </div>
      <ClosestToLiquidation />
    </>
  )
}

export default PerpMarketsPositions

const LargestPerpPositions = () => {
  const { t } = useTranslation(['common', 'stats', 'trade'])
  const positions = mangoStore((s) => s.perpStats.positions.largest)
  const loading = mangoStore((s) => s.perpStats.positions.loading)

  return positions.length ? (
    <PerpPositionsStatsTable positions={positions} />
  ) : loading ? (
    <Loader />
  ) : (
    <EmptyState text={t('stats:no-largest-positions')} />
  )
}

const ClosestToLiquidation = () => {
  const { t } = useTranslation(['common', 'stats', 'trade'])
  const positions = mangoStore((s) => s.perpStats.positions.closestToLiq)
  const loading = mangoStore((s) => s.perpStats.positions.loading)

  return positions.length ? (
    <PerpPositionsStatsTable positions={positions} />
  ) : loading ? (
    <Loader />
  ) : (
    <EmptyState text={t('stats:no-closest-to-liquidation')} />
  )
}

const Loader = () => {
  return (
    <div className="space-y-1.5">
      {[...Array(5)].map((x, i) => (
        <SheenLoader className="mx-4 flex flex-1 md:mx-6" key={i}>
          <div className="h-16 w-full bg-th-bkg-2" />
        </SheenLoader>
      ))}
    </div>
  )
}

const EmptyState = ({ text }: { text: string }) => {
  return (
    <div className="mx-6 flex flex-col items-center rounded-md border border-th-bkg-3 p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{text}</p>
    </div>
  )
}
