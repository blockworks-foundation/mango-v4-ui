import Switch from '@components/forms/Switch'
import TabsText from '@components/shared/TabsText'
import SwapOrders from '@components/swap/SwapTriggerOrders'
import OpenOrders from '@components/trade/OpenOrders'
import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import useMangoAccount from 'hooks/useMangoAccount'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FILTER_ORDERS_FOR_MARKET_KEY } from 'utils/constants'

const AccountOrders = () => {
  const { t } = useTranslation('trade')
  const { mangoAccount } = useMangoAccount()
  const openOrders = mangoStore((s) => s.mangoAccount.openOrders)
  const [activeTab, setActiveTab] = useState('trade:limit')
  const [filterForCurrentMarket, setFilterForCurrentMarket] =
    useLocalStorageState(FILTER_ORDERS_FOR_MARKET_KEY, false)

  const tabsWithCount: [string, number][] = useMemo(() => {
    const stopOrdersCount =
      mangoAccount?.tokenConditionalSwaps.filter((tcs) => tcs.isConfigured)
        ?.length || 0
    const tabs: [string, number][] = [
      ['trade:limit', Object.values(openOrders).flat().length],
      ['trade:trigger-orders', stopOrdersCount],
    ]
    return tabs
  }, [mangoAccount, openOrders])

  return (
    <>
      <div className="flex items-center justify-between p-4 md:px-6">
        <TabsText
          activeTab={activeTab}
          onChange={setActiveTab}
          tabs={tabsWithCount}
        />
        {activeTab === 'trade:limit' ? (
          <Switch
            checked={filterForCurrentMarket}
            onChange={() => setFilterForCurrentMarket(!filterForCurrentMarket)}
          >
            {t('filter-current-market')}
          </Switch>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col border-t border-th-bkg-3">
        {activeTab === 'trade:limit' ? (
          <OpenOrders filterForCurrentMarket={filterForCurrentMarket} />
        ) : (
          <SwapOrders />
        )}
      </div>
    </>
  )
}

export default AccountOrders
