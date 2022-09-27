import { LinkButton } from '@components/shared/Button'
import mangoStore from '@store/mangoStore'
import dayjs from 'dayjs'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { formatFixedDecimals } from 'utils/numbers'

const ActivityFeed = () => {
  const { t } = useTranslation(['common', 'activity'])
  const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const actions = mangoStore((s) => s.actions)
  const loadActivityFeed = mangoStore((s) => s.activityFeed.loading)
  const [offset, setOffset] = useState(0)

  const handleShowMore = useCallback(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!mangoAccount) return
    setOffset(offset + 25)
    actions.fetchActivityFeed(mangoAccount.publicKey.toString(), offset + 25)
  }, [actions, offset])

  return (
    <>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="bg-th-bkg-1 text-left">{t('date')}</th>
            <th className="bg-th-bkg-1 text-right">{t('activity:activity')}</th>
            <th className="bg-th-bkg-1 text-right">{t('activity:credit')}</th>
            <th className="bg-th-bkg-1 text-right">{t('activity:debit')}</th>
            <th className="bg-th-bkg-1 text-right">
              {t('activity:activity-value')}
            </th>
            {/* <th className="bg-th-bkg-1 text-right">{t('account-value')}</th> */}
          </tr>
        </thead>
        <tbody>
          {activityFeed.map((activity, i) => {
            const { activity_type, block_datetime } = activity
            const { symbol, quantity, usd_equivalent } =
              activity.activity_details
            const credit =
              activity_type === 'Deposit' ? `${quantity} ${symbol}` : '0'
            const debit =
              activity_type === 'Withdraw' ? `${quantity} ${symbol}` : '0'
            return (
              <tr key={block_datetime + i} className="text-sm">
                <td>
                  <p className="font-body tracking-wide">
                    {dayjs(block_datetime).format('ddd D MMM')}
                  </p>
                  <p className="text-xs text-th-fgd-3">
                    {dayjs(block_datetime).format('h:mma')}
                  </p>
                </td>
                <td className="text-right">{activity_type}</td>
                <td className="text-right">{credit}</td>
                <td className="text-right">{debit}</td>
                <td className="text-right">
                  {formatFixedDecimals(usd_equivalent, true)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {activityFeed.length % 25 === 0 ? (
        <div className="flex justify-center pt-6">
          <LinkButton onClick={handleShowMore}>Show More</LinkButton>
        </div>
      ) : null}
    </>
  )
}

export default ActivityFeed
