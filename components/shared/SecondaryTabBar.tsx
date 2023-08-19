import { useTranslation } from 'next-i18next'

const SecondaryTabBar = ({
  activeTab,
  setActiveTab,
  tabs,
}: {
  activeTab: string
  setActiveTab: (tab: string) => void
  tabs: string[]
}) => {
  const { t } = useTranslation(['common', 'activity', 'trade'])
  return (
    <div className="flex h-14 items-center justify-between bg-th-bkg-2">
      <div className="hide-scroll flex space-x-2 pl-4 md:pl-6">
        {tabs.map((tab) => (
          <button
            className={`rounded-md px-2.5 py-1.5 text-sm font-medium focus-visible:bg-th-bkg-4 md:hover:bg-th-bkg-4 ${
              activeTab === tab
                ? 'bg-th-bkg-4 text-th-active focus-visible:text-th-active'
                : 'text-th-fgd-3 focus-visible:text-th-fgd-1'
            }`}
            onClick={() => setActiveTab(tab)}
            key={tab}
          >
            {t(tab)}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SecondaryTabBar
