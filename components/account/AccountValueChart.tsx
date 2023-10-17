import SimpleAreaChart from '@components/shared/SimpleAreaChart'
import { COLORS } from '../../styles/colors'
import { IconButton } from '../shared/Button'
import { ArrowsPointingOutIcon } from '@heroicons/react/20/solid'
import { Transition } from '@headlessui/react'
import SheenLoader from '../shared/SheenLoader'
import useMangoAccount from 'hooks/useMangoAccount'
import { PerformanceDataItem } from 'types'
import { useCallback, useMemo, useState } from 'react'
import { useViewport } from 'hooks/useViewport'
import { handleViewChange } from './AccountPage'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
import useThemeWrapper from 'hooks/useThemeWrapper'
import { useRouter } from 'next/router'

const AccountValueChart = ({
  accountValue,
  latestAccountData,
  rollingDailyData,
}: {
  accountValue: number
  latestAccountData: PerformanceDataItem[]
  rollingDailyData: PerformanceDataItem[]
}) => {
  const { theme } = useThemeWrapper()
  const router = useRouter()
  const { mangoAccountAddress } = useMangoAccount()
  const [showExpandChart, setShowExpandChart] = useState<boolean>(false)
  const { isTablet } = useViewport()
  const { performanceLoading: loading } = useAccountPerformanceData()

  const accountValueChange = useMemo(() => {
    if (!accountValue || !rollingDailyData.length) return 0
    const accountValueChange = accountValue - rollingDailyData[0].account_equity
    return accountValueChange
  }, [accountValue, rollingDailyData])

  const onHoverMenu = (open: boolean, action: string) => {
    if (
      (!open && action === 'onMouseEnter') ||
      (open && action === 'onMouseLeave')
    ) {
      setShowExpandChart(!open)
    }
  }

  const handleShowAccountValueChart = useCallback(() => {
    handleViewChange('account-value', router)
    setShowExpandChart(false)
  }, [router])

  return !loading ? (
    rollingDailyData.length ? (
      <div
        className="relative mt-4 flex h-40 items-end md:mt-0 md:h-28 md:w-52 lg:w-56"
        onMouseEnter={() => onHoverMenu(showExpandChart, 'onMouseEnter')}
        onMouseLeave={() => onHoverMenu(showExpandChart, 'onMouseLeave')}
      >
        <SimpleAreaChart
          color={
            accountValueChange >= 0 ? COLORS.UP[theme] : COLORS.DOWN[theme]
          }
          data={rollingDailyData.concat(latestAccountData)}
          name="accountValue"
          xKey="time"
          yKey="account_equity"
        />
        <Transition
          appear={true}
          className="absolute bottom-2 right-2"
          show={showExpandChart || isTablet}
          enter="transition ease-in duration-300"
          enterFrom="opacity-0 scale-75"
          enterTo="opacity-100 scale-100"
          leave="transition ease-out duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <IconButton
            className="text-th-fgd-3"
            hideBg
            onClick={() => handleShowAccountValueChart()}
          >
            <ArrowsPointingOutIcon className="h-5 w-5" />
          </IconButton>
        </Transition>
      </div>
    ) : null
  ) : mangoAccountAddress ? (
    <SheenLoader className="mt-4 flex flex-1 md:mt-0">
      <div className="h-40 w-full rounded-md bg-th-bkg-2 md:h-20 md:w-52 lg:w-60" />
    </SheenLoader>
  ) : null
}

export default AccountValueChart
