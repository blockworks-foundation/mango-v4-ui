import { formatCurrencyValue } from '../../utils/numbers'
import FlipNumbers from 'react-flip-numbers'
import SimpleAreaChart from '@components/shared/SimpleAreaChart'
import { COLORS } from '../../styles/colors'
import { IconButton } from '../shared/Button'
import { ArrowsPointingOutIcon } from '@heroicons/react/20/solid'
import { Transition } from '@headlessui/react'
import SheenLoader from '../shared/SheenLoader'
import Change from '../shared/Change'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import useMangoGroup from 'hooks/useMangoGroup'
import useMangoAccount from 'hooks/useMangoAccount'
import { PerformanceDataItem } from 'types'
import { useMemo, useState } from 'react'
import { useTranslation } from 'next-i18next'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import { ViewToShow } from './AccountPage'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
import useThemeWrapper from 'hooks/useThemeWrapper'

const AccountValue = ({
  accountValue,
  latestAccountData,
  rollingDailyData,
  handleViewChange,
}: {
  accountValue: number
  latestAccountData: PerformanceDataItem[]
  rollingDailyData: PerformanceDataItem[]
  handleViewChange: (view: ViewToShow) => void
}) => {
  const { t } = useTranslation('common')
  const { theme } = useThemeWrapper()
  const { group } = useMangoGroup()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const [showExpandChart, setShowExpandChart] = useState<boolean>(false)
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS,
  )
  const { width } = useViewport()
  const { performanceLoading: loading } = useAccountPerformanceData()
  const isMobile = width ? width < breakpoints.md : false

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

  const handleShowAccountValueChart = () => {
    handleViewChange('account-value')
    setShowExpandChart(false)
  }

  return (
    <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
      <div className="mx-auto mt-4 md:mx-0">
        <div className="mb-2 flex justify-start font-display text-5xl text-th-fgd-1">
          {animationSettings['number-scroll'] ? (
            group && mangoAccount ? (
              <FlipNumbers
                height={48}
                width={35}
                play
                delay={0.05}
                duration={1}
                numbers={formatCurrencyValue(accountValue, 2)}
              />
            ) : (
              <FlipNumbers
                height={48}
                width={36}
                play
                delay={0.05}
                duration={1}
                numbers={'$0.00'}
              />
            )
          ) : (
            <FormatNumericValue value={accountValue} isUsd decimals={2} />
          )}
        </div>
        <div className="flex items-center justify-center space-x-1.5 md:justify-start">
          <Change change={accountValueChange} prefix="$" />
          <p className="text-xs text-th-fgd-4">{t('rolling-change')}</p>
        </div>
      </div>
      {!loading ? (
        rollingDailyData.length ? (
          <div
            className="relative mt-4 flex h-40 items-end md:mt-0 md:h-20 md:w-52 lg:w-60"
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
              show={showExpandChart || isMobile}
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
      ) : null}
    </div>
  )
}

export default AccountValue
