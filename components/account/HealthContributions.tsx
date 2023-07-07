// import { useTranslation } from 'next-i18next'
import HealthContributionsChart from './HealthContributionsChart'
import useMangoGroup from 'hooks/useMangoGroup'
import useMangoAccount from 'hooks/useMangoAccount'
import { useMemo } from 'react'
import { HealthType } from '@blockworks-foundation/mango-v4'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'

export interface HealthContribution {
  asset: string
  contribution: number
  isAsset: boolean
}

const HealthContributions = ({ hideView }: { hideView: () => void }) => {
  //   const { t } = useTranslation('account')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()

  const [initHealthContributions, maintHealthContributions] = useMemo(() => {
    if (!group || !mangoAccount) return [[], []]
    const init = mangoAccount
      .getHealthContributionPerAssetUi(group, HealthType.init)
      .filter((asset) => Math.abs(asset.contribution) > 0.01)
      .map((item) => ({
        ...item,
        contribution: Math.abs(item.contribution),
        isAsset: item.contribution > 0 ? true : false,
      }))
    const maint = mangoAccount
      .getHealthContributionPerAssetUi(group, HealthType.maint)
      .filter((asset) => Math.abs(asset.contribution) > 0.01)
      .map((item) => ({
        ...item,
        contribution: Math.abs(item.contribution),
        isAsset: item.contribution > 0 ? true : false,
      }))
    return [init, maint]
  }, [group, mangoAccount])

  console.log(initHealthContributions)

  return (
    <>
      <div className="hide-scroll mb-3 flex h-14 items-center space-x-4 overflow-x-auto border-b border-th-bkg-3">
        <button
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center border-r border-th-bkg-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
          onClick={hideView}
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        {/* <div className="flex space-x-2">
          {CHART_TABS.map((tab) => (
            <button
              className={`whitespace-nowrap rounded-md py-1.5 px-2.5 text-sm font-medium focus-visible:bg-th-bkg-3 focus-visible:text-th-fgd-1 ${
                chartToShow === tab
                  ? 'bg-th-bkg-3 text-th-active md:hover:text-th-active'
                  : 'text-th-fgd-3 md:hover:text-th-fgd-2'
              }`}
              onClick={() => setChartToShow(tab)}
              key={tab}
            >
              {t(tab)}
            </button>
          ))}
        </div> */}
      </div>
      <HealthContributionsChart data={maintHealthContributions} />
    </>
  )
}

export default HealthContributions
