import SwapOrders from '@components/swap/SwapTriggerOrders'
import OpenOrders from '@components/trade/OpenOrders'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const AccountOrders = () => {
  const { t } = useTranslation('trade')
  const { mangoAccount } = useMangoAccount()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const [activeTab, setActiveTab] = useState('trade:limit')

  const tabsWithCount: [string, number][] = useMemo(() => {
    const stopOrdersCount =
      mangoAccount?.tokenConditionalSwaps.filter((tcs) => tcs.hasData)
        ?.length || 0
    const tabs: [string, number][] = [
      ['trade:limit', Object.values(openOrders).flat().length],
      ['trade:trigger-orders', stopOrdersCount],
    ]
    return tabs
  }, [mangoAccount, openOrders])

  return (
    <>
      <div className="flex space-x-6 px-4 py-4 md:px-6">
        {tabsWithCount.map((tab) => (
          <button
            className={`flex items-center space-x-2 text-base font-bold focus:outline-none ${
              activeTab === tab[0] ? 'text-th-active' : ''
            }`}
            onClick={() => setActiveTab(tab[0])}
            key={tab[0]}
          >
            <span>{t(tab[0])}</span>
            <div className="rounded-md bg-th-bkg-3 px-1.5 py-0.5 font-body text-xs font-medium text-th-fgd-2">
              <span>{tab[1]}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="flex flex-1 flex-col border-t border-th-bkg-3">
        {activeTab === 'trade:limit' ? <OpenOrders /> : <SwapOrders />}
      </div>
    </>
  )
}

export default AccountOrders
