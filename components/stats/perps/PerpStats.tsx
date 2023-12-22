import { useEffect } from 'react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import PerpMarketsDetailsTable from './PerpMarketDetailsTable'
import PerpMarketsPositions from './PerpMarketsPositions'
import { useTranslation } from 'react-i18next'
import PerpMarketsTable from '@components/explore/PerpMarketsTable'

// const TABS = ['details', 'trade:positions']

const PerpStats = () => {
  const { t } = useTranslation(['common', 'stats'])
  // const [activeTab, setActiveTab] = useState(TABS[0])
  const actions = mangoStore((s) => s.actions)
  const { mangoAccountAddress } = useMangoAccount()

  useEffect(() => {
    if (actions && mangoAccountAddress) {
      actions.fetchActivityFeed(mangoAccountAddress)
    }
  }, [actions, mangoAccountAddress])

  return (
    <div className="pt-10">
      <div className="pb-10">
        <h2 className="mx-4 mb-4 md:mx-6">{t('markets')}</h2>
        <div className="border-t border-th-bkg-3 md:border-t-0">
          <PerpMarketsTable />
        </div>
      </div>
      <div className="pb-10">
        <h2 className="mx-4 mb-4 md:mx-6">{t('stats:market-parameters')}</h2>
        <div className="border-t border-th-bkg-3 md:border-t-0">
          <PerpMarketsDetailsTable />
        </div>
      </div>
      <h2 className="mx-4 md:mx-6">{t('stats:positions')}</h2>
      <PerpMarketsPositions />
    </div>
  )
}

// const TabContent = ({ activeTab }: { activeTab: string }) => {
//   switch (activeTab) {
//     case TABS[0]:
//       return <PerpMarketsDetailsTable />
//     case TABS[1]:
//       return <PerpMarketsPositions />
//     default:
//       return <PerpMarketsDetailsTable />
//   }
// }

export default PerpStats
