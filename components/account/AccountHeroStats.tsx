import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { handleViewChange } from './AccountPage'
import Tooltip from '@components/shared/Tooltip'
import {
  HealthType,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import HealthBar from './HealthBar'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { IconButton } from '@components/shared/Button'
import {
  CalendarIcon,
  ChartBarIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'
import { useRouter } from 'next/router'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
import Change from '@components/shared/Change'
import PnlHistoryModal from '@components/modals/PnlHistoryModal'

const AccountHeroStats = ({ accountValue }: { accountValue: number }) => {
  const { t } = useTranslation(['common', 'account'])
  const { group } = useMangoGroup()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { rollingDailyData } = useAccountPerformanceData()
  const router = useRouter()
  const [showPnlHistory, setShowPnlHistory] = useState(false)

  const handleGoToStats = () => {
    const query = { ...router.query, ['view']: 'account-stats' }
    router.push({ pathname: router.pathname, query }, undefined, {
      shallow: true,
    })
  }

  const maintHealth = useMemo(() => {
    return group && mangoAccount
      ? mangoAccount.getHealthRatioUi(group, HealthType.maint)
      : 0
  }, [mangoAccount, group])

  const leverage = useMemo(() => {
    if (!group || !mangoAccount) return 0
    const assetsValue = toUiDecimalsForQuote(
      mangoAccount.getAssetsValue(group).toNumber(),
    )

    if (isNaN(assetsValue / accountValue)) {
      return 0
    } else {
      return Math.abs(1 - assetsValue / accountValue)
    }
  }, [mangoAccount, group, accountValue])

  const accountPnl = useMemo(() => {
    if (!group || !mangoAccount) return 0
    return toUiDecimalsForQuote(mangoAccount.getPnl(group).toNumber())
  }, [group, mangoAccount])

  const pnlChangeToday = useMemo(() => {
    if (!accountPnl || !rollingDailyData.length) return 0
    const startHour = rollingDailyData.find((item) => {
      const itemHour = new Date(item.time).getHours()
      return itemHour === 0
    })
    const startDayPnl = startHour?.pnl
    const pnlChangeToday = startDayPnl ? accountPnl - startDayPnl : 0

    return pnlChangeToday
  }, [accountPnl, rollingDailyData])

  const rollingDailyPnlChange = useMemo(() => {
    if (!accountPnl || !rollingDailyData.length) return 0
    return accountPnl - rollingDailyData[0].pnl
  }, [accountPnl, rollingDailyData])

  return (
    <>
      <div className="border-b border-th-bkg-3 px-4 pb-4 pt-3 md:px-6">
        <div id="account-step-four">
          <div className="flex justify-between">
            <Tooltip
              maxWidth="20rem"
              placement="top-start"
              delay={100}
              content={
                <div className="flex-col space-y-2 text-sm">
                  <p className="text-xs">
                    Health describes how close your account is to liquidation.
                    The lower your account health is the more likely you are to
                    get liquidated when prices fluctuate.
                  </p>
                  {maintHealth < 100 && mangoAccountAddress ? (
                    <>
                      <p className="text-xs font-bold text-th-fgd-1">
                        Your account health is {maintHealth}%
                      </p>
                      <p className="text-xs">
                        <span className="font-bold text-th-fgd-1">
                          Scenario:
                        </span>{' '}
                        If the prices of all your liabilities increase by{' '}
                        {maintHealth}%, even for just a moment, some of your
                        liabilities will be liquidated.
                      </p>
                      <p className="text-xs">
                        <span className="font-bold text-th-fgd-1">
                          Scenario:
                        </span>{' '}
                        If the value of your total collateral decreases by{' '}
                        {(
                          (1 - 1 / ((maintHealth || 0) / 100 + 1)) *
                          100
                        ).toFixed(2)}
                        % , some of your liabilities will be liquidated.
                      </p>
                      <p className="text-xs">
                        These are examples. A combination of events can also
                        lead to liquidation.
                      </p>
                    </>
                  ) : null}
                </div>
              }
            >
              <p className="tooltip-underline">{t('health')}</p>
            </Tooltip>
            {mangoAccountAddress ? (
              <Tooltip
                className="hidden md:block"
                content={t('account:health-contributions')}
                delay={100}
              >
                <IconButton
                  className="text-th-fgd-3"
                  hideBg
                  onClick={() =>
                    handleViewChange('health-contributions', router)
                  }
                >
                  <ChartBarIcon className="h-5 w-5" />
                </IconButton>
              </Tooltip>
            ) : null}
          </div>
          <div className="mb-0.5 mt-2 flex items-center space-x-3">
            <p className="text-2xl font-bold text-th-fgd-1 lg:text-3xl">
              {maintHealth}%
            </p>
            <HealthBar health={maintHealth} />
          </div>
          <span className="flex font-normal text-th-fgd-4">
            <Tooltip
              content={t('account:tooltip-leverage')}
              maxWidth="20rem"
              placement="top-start"
              delay={100}
            >
              <span className="tooltip-underline">{t('leverage')}</span>:
            </Tooltip>
            <span className="ml-1 font-mono text-th-fgd-2">
              <FormatNumericValue value={leverage} decimals={2} roundUp />x
            </span>
          </span>
        </div>
      </div>
      <div className="flex border-b border-th-bkg-3 px-4 pb-4 pt-3 md:px-6">
        <div id="account-step-five">
          <Tooltip
            content={t('account:tooltip-free-collateral')}
            maxWidth="20rem"
            placement="top-start"
            delay={100}
          >
            <p className="tooltip-underline">{t('free-collateral')}</p>
          </Tooltip>
          <p className="mb-0.5 mt-2 text-2xl font-bold text-th-fgd-1 lg:text-3xl">
            <FormatNumericValue
              value={
                group && mangoAccount
                  ? toUiDecimalsForQuote(mangoAccount.getCollateralValue(group))
                  : 0
              }
              decimals={2}
              isUsd={true}
              isPrivate
            />
          </p>
          <span className="font-normal text-th-fgd-4">
            <Tooltip
              content={t('account:tooltip-total-collateral')}
              maxWidth="20rem"
              placement="top-start"
              delay={100}
            >
              <span className="tooltip-underline">{t('total')}</span>:
              <span className="ml-1 font-mono text-th-fgd-2">
                <FormatNumericValue
                  value={
                    group && mangoAccount
                      ? toUiDecimalsForQuote(
                          mangoAccount.getAssetsValue(group, HealthType.init),
                        )
                      : 0
                  }
                  decimals={2}
                  isUsd={true}
                  isPrivate
                />
              </span>
            </Tooltip>
          </span>
        </div>
      </div>
      <div
        id="account-step-seven"
        className="border-b border-th-bkg-3 px-4 pb-4 pt-3 md:px-6"
      >
        <div className="flex items-center justify-between">
          <Tooltip
            content={t('account:tooltip-pnl')}
            placement="top-start"
            delay={100}
          >
            <p className="tooltip-underline">{t('pnl')}</p>
          </Tooltip>
          {mangoAccountAddress ? (
            <Tooltip
              className="hidden md:block"
              content={t('account:pnl-history')}
              delay={100}
            >
              <IconButton
                className="text-th-fgd-3"
                hideBg
                onClick={() => setShowPnlHistory(true)}
              >
                <CalendarIcon className="h-5 w-5" />
              </IconButton>
            </Tooltip>
          ) : null}
        </div>
        <p className="mb-0.5 mt-2 text-2xl font-bold text-th-fgd-1 lg:text-3xl">
          <FormatNumericValue
            value={accountPnl}
            decimals={2}
            isUsd={true}
            isPrivate
          />
        </p>
        <div className="flex items-center space-x-1.5">
          <Change change={rollingDailyPnlChange} prefix="$" isPrivate />
          <p className="text-th-fgd-4">{t('rolling-change')}</p>
        </div>
      </div>
      <button
        className="default-transition flex h-10 w-full items-center justify-between px-4 focus:outline-none disabled:cursor-not-allowed md:px-6 md:hover:bg-th-bkg-2"
        onClick={() => handleGoToStats()}
        disabled={!mangoAccountAddress}
      >
        <p>{t('account:more-account-stats')}</p>
        <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
      </button>
      {showPnlHistory ? (
        <PnlHistoryModal
          isOpen={showPnlHistory}
          onClose={() => setShowPnlHistory(false)}
          pnlChangeToday={pnlChangeToday}
        />
      ) : null}
    </>
  )
}

export default AccountHeroStats
