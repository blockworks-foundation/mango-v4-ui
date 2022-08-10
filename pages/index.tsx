import { HealthType, toUiDecimals } from '@blockworks-foundation/mango-v4'
import type { NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useState } from 'react'
import AccountActions from '../components/account/AccountActions'
import DepositModal from '../components/modals/DepositModal'
import WithdrawModal from '../components/modals/WithdrawModal'
import mangoStore from '../store/state'
import { formatDecimal } from '../utils/numbers'
import FlipNumbers from 'react-flip-numbers'
import { UpTriangle } from '../components/shared/DirectionTriangles'
import SimpleAreaChart from '../components/shared/SimpleAreaChart'
import { COLORS } from '../styles/colors'
import { useTheme } from 'next-themes'
import { IconButton } from '../components/shared/Button'
import { ArrowsExpandIcon } from '@heroicons/react/solid'
import DetailedAreaChart from '../components/shared/DetailedAreaChart'
import { Transition } from '@headlessui/react'
import AccountTabs from '../components/account/AccountTabs'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'close-account'])),
    },
  }
}

const chartData = [
  [1, 300],
  [2, 310],
  [3, 320],
  [4, 330],
  [5, 340],
  [6, 350],
  [7, 360],
  [8, 370],
  [9, 380],
  [10, 390],
]

const Index: NextPage = () => {
  const { t } = useTranslation('common')
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showDetailedValueChart, setShowDetailedValueChart] = useState(false)
  const [showExpandChart, setShowExpandChart] = useState(false)
  const { theme } = useTheme()

  const onHoverMenu = (open: boolean, action: string) => {
    if (
      (!open && action === 'onMouseEnter') ||
      (open && action === 'onMouseLeave')
    ) {
      setShowExpandChart(!open)
    }
  }

  const handleShowDetailedValueChart = () => {
    setShowDetailedValueChart(true)
    setShowExpandChart(false)
  }

  return !showDetailedValueChart ? (
    <>
      <div className="mb-8 flex flex-col md:mb-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="mb-4 flex items-center space-x-6 lg:mb-0">
          <div>
            <p className="mb-1">{t('account-value')}</p>
            <div className="flex items-center text-5xl font-bold text-th-fgd-1">
              $
              {mangoAccount ? (
                <FlipNumbers
                  height={48}
                  width={32}
                  play
                  delay={0.05}
                  duration={1}
                  numbers={formatDecimal(
                    toUiDecimals(mangoAccount.getEquity().toNumber()),
                    2
                  )}
                />
              ) : (
                (0).toFixed(2)
              )}
            </div>
            <div className="mt-1 flex items-center space-x-2">
              <UpTriangle />
              <p className="mb-0.5 text-th-green">2.13%</p>
            </div>
          </div>
          <div
            className="relative flex items-end"
            onMouseEnter={() => onHoverMenu(showExpandChart, 'onMouseEnter')}
            onMouseLeave={() => onHoverMenu(showExpandChart, 'onMouseLeave')}
          >
            <SimpleAreaChart
              color={COLORS.GREEN[theme]}
              data={chartData}
              height={106}
              name="accountValue"
              width={240}
            />
            <Transition
              appear={true}
              className="absolute right-2 bottom-2"
              show={showExpandChart}
              enter="transition-all ease-in duration-300"
              enterFrom="opacity-0 transform scale-75"
              enterTo="opacity-100 transform scale-100"
              leave="transition ease-out duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <IconButton
                className="text-th-fgd-3"
                hideBg
                onClick={() => handleShowDetailedValueChart()}
              >
                <ArrowsExpandIcon className="h-5 w-5" />
              </IconButton>
            </Transition>
          </div>
        </div>
        <AccountActions />
      </div>
      <div className="mb-8 grid grid-cols-3 gap-x-6 border-b border-th-bkg-3 md:mb-10 md:border-b-0">
        <div className="col-span-3 border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6">
          <p className="text-th-fgd-3">{t('health')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">
            {mangoAccount
              ? mangoAccount.getHealthRatio(HealthType.init).toNumber()
              : 100}
            %
          </p>
        </div>
        <div className="col-span-3 border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6">
          <p className="text-th-fgd-3">{t('free-collateral')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">
            $
            {mangoAccount
              ? formatDecimal(
                  toUiDecimals(mangoAccount.getCollateralValue().toNumber()),
                  2
                )
              : (0).toFixed(2)}
          </p>
        </div>
        <div className="col-span-3 border-t border-th-bkg-3 py-4 md:col-span-1 md:border-l md:border-t-0 md:pl-6">
          <p className="text-th-fgd-3">{t('leverage')}</p>
          <p className="text-2xl font-bold text-th-fgd-1">0.0x</p>
        </div>
      </div>
      <AccountTabs />
      {showDepositModal ? (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />
      ) : null}
      {showWithdrawModal ? (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
        />
      ) : null}
    </>
  ) : (
    <DetailedAreaChart
      data={chartData}
      hideChart={() => setShowDetailedValueChart(false)}
      title={t('account-value')}
      xKey="0"
      yKey="1"
    />
  )
}

export default Index
