import { useTranslation } from 'react-i18next'

const TabsText = ({
  tabs,
  activeTab,
  onChange,
  className,
}: {
  tabs: [string, number][]
  activeTab: string
  onChange: (tab: string) => void
  className?: string
}) => {
  const { t } = useTranslation(['common', 'account', 'trade'])
  return (
    <div className="flex space-x-4 text-base sm:space-x-6">
      {tabs.map((tab) => (
        <button
          className={`flex items-center space-x-2 font-bold leading-tight focus:outline-none ${
            activeTab === tab[0]
              ? 'text-th-active md:hover:text-th-active'
              : 'text-th-fgd-2 md:hover:text-th-fgd-3'
          } ${className}`}
          onClick={() => onChange(tab[0])}
          key={tab[0]}
        >
          <span>{t(tab[0])}</span>
          {tab[1] ? (
            <div className="rounded-md bg-th-bkg-3 px-1.5 py-0.5 font-body text-xs font-medium text-th-fgd-2">
              <span>{tab[1]}</span>
            </div>
          ) : null}
        </button>
      ))}
    </div>
  )
}

export default TabsText
