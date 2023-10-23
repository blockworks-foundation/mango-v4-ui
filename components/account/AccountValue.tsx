import { formatCurrencyValue } from '../../utils/numbers'
import FlipNumbers from 'react-flip-numbers'
import Change from '../shared/Change'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import useMangoGroup from 'hooks/useMangoGroup'
import useMangoAccount from 'hooks/useMangoAccount'
import { PerformanceDataItem } from 'types'
import { useMemo } from 'react'
import { useTranslation } from 'next-i18next'

const AccountValue = ({
  accountValue,
  rollingDailyData,
}: {
  accountValue: number
  rollingDailyData: PerformanceDataItem[]
}) => {
  const { t } = useTranslation('common')
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS,
  )

  const accountValueChange = useMemo(() => {
    if (!accountValue || !rollingDailyData.length) return 0
    const accountValueChange = accountValue - rollingDailyData[0].account_equity
    return accountValueChange
  }, [accountValue, rollingDailyData])

  return (
    <div className="flex flex-col md:flex-row md:items-end md:space-x-6">
      <div className="mx-auto md:mx-0">
        <div className="mb-2 flex justify-start font-display text-5xl text-th-fgd-1 xl:text-6xl">
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
          <Change change={accountValueChange} prefix="$" size="large" />
          <p className="text-base text-th-fgd-4">{t('rolling-change')}</p>
        </div>
      </div>
    </div>
  )
}

export default AccountValue
