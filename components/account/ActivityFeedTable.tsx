import { LinkButton } from '@components/shared/Button'
import Tooltip from '@components/shared/Tooltip'
import { BoltIcon, ChevronRightIcon, LinkIcon } from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore, {
  DepositWithdrawFeedItem,
  LiquidationFeedItem,
} from '@store/mangoStore'
import dayjs from 'dayjs'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { capitalize } from 'lodash'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { EXPLORERS } from 'pages/settings'
import { useCallback, useState } from 'react'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'

const ActivityFeedTable = ({
  activityFeed,
  handleShowActivityDetails,
}: {
  activityFeed: any
  handleShowActivityDetails: (x: LiquidationFeedItem) => void
}) => {
  const { t } = useTranslation(['common', 'activity'])
  const { connected } = useWallet()
  // const activityFeed = mangoStore((s) => s.activityFeed.feed)
  const actions = mangoStore((s) => s.actions)
  const [offset, setOffset] = useState(0)
  const [preferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0]
  )

  const handleShowMore = useCallback(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!mangoAccount) return
    setOffset(offset + 25)
    actions.fetchActivityFeed(mangoAccount.publicKey.toString(), offset + 25)
  }, [actions, offset])

  const getCreditAndDebit = (activity: any) => {
    const { activity_type } = activity
    let credit = '0'
    let debit = '0'
    if (activity_type === 'liquidate_token_with_token') {
      const { side, liab_amount, liab_symbol, asset_amount, asset_symbol } =
        activity.activity_details
      if (side === 'liqee') {
        credit = `${formatDecimal(liab_amount)} ${liab_symbol}`
        debit = `${formatDecimal(asset_amount)} ${asset_symbol}`
      } else {
        credit = `${formatDecimal(asset_amount)} ${asset_symbol}`
        debit = `${formatDecimal(liab_amount)} ${liab_symbol}`
      }
    }
    if (activity_type === 'deposit') {
      const { symbol, quantity } = activity.activity_details
      credit = `${formatDecimal(quantity)} ${symbol}`
      debit = '0'
    }
    if (activity_type === 'withdraw') {
      const { symbol, quantity } = activity.activity_details
      credit = '0'
      debit = `${formatDecimal(quantity)} ${symbol}`
    }
    return { credit, debit }
  }

  const getValue = (activity: any) => {
    const { activity_type } = activity
    let value = 0
    if (activity_type === 'liquidate_token_with_token') {
      const { side, liab_amount, liab_price, asset_amount, asset_price } =
        activity.activity_details
      if (side === 'liqee') {
        value = asset_amount * asset_price - liab_amount * liab_price
      } else {
        value = liab_amount * liab_price - asset_amount * asset_price
      }
    }
    if (activity_type === 'deposit' || activity_type === 'withdraw') {
      const { usd_equivalent } = activity.activity_details
      value = usd_equivalent
    }
    return value
  }

  return connected ? (
    activityFeed.length ? (
      <>
        <table className="min-w-full">
          <thead>
            <tr className="sticky top-0 z-10">
              <th className="bg-th-bkg-1 text-left">{t('date')}</th>
              <th className="bg-th-bkg-1 text-right">
                {t('activity:activity')}
              </th>
              <th className="bg-th-bkg-1 text-right">{t('activity:credit')}</th>
              <th className="bg-th-bkg-1 text-right">{t('activity:debit')}</th>
              <th className="bg-th-bkg-1 text-right">
                {t('activity:activity-value')}
              </th>
              <th className="bg-th-bkg-1 text-right">{t('explorer')}</th>
            </tr>
          </thead>
          <tbody>
            {activityFeed.map((activity: any, i: number) => {
              const { activity_type, block_datetime } = activity
              const { signature } = activity.activity_details
              const isLiquidation =
                activity_type === 'liquidate_token_with_token'
              const activityName = isLiquidation ? 'liquidation' : activity_type
              const amounts = getCreditAndDebit(activity)
              const value = getValue(activity)
              return (
                <tr
                  key={block_datetime + i}
                  className={`default-transition text-sm hover:bg-th-bkg-2 ${
                    isLiquidation ? 'cursor-pointer' : ''
                  }`}
                  onClick={
                    isLiquidation
                      ? () => handleShowActivityDetails(activity)
                      : undefined
                  }
                >
                  <td>
                    <p className="font-body tracking-wide">
                      {dayjs(block_datetime).format('ddd D MMM')}
                    </p>
                    <p className="text-xs text-th-fgd-3">
                      {dayjs(block_datetime).format('h:mma')}
                    </p>
                  </td>
                  <td className="text-right">{capitalize(activityName)}</td>
                  <td className="text-right">{amounts.credit}</td>
                  <td className="text-right">{amounts.debit}</td>
                  <td className="text-right">
                    {formatFixedDecimals(value, true)}
                  </td>
                  <td>
                    {activity_type !== 'liquidate_token_with_token' ? (
                      <div className="flex items-center justify-end">
                        <Tooltip
                          content={`View on ${t(
                            `settings:${preferredExplorer.name}`
                          )}`}
                          placement="top-end"
                        >
                          <a
                            href={`${preferredExplorer.url}${signature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <div className="h-6 w-6">
                              <Image
                                alt=""
                                width="24"
                                height="24"
                                src={`/explorer-logos/${preferredExplorer.name}.png`}
                              />
                            </div>
                          </a>
                        </Tooltip>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end">
                        <ChevronRightIcon className="h-6 w-6 text-th-fgd-3" />
                      </div>
                    )}
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
    ) : (
      <div className="flex flex-col items-center p-8">
        <BoltIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
        <p>No account activity found...</p>
      </div>
    )
  ) : (
    <div className="flex flex-col items-center p-8">
      <LinkIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>Connect to view your account activity</p>
    </div>
  )
}

export default ActivityFeedTable
