import {
  MangoAccount,
  toUiDecimalsForQuote,
} from '@blockworks-foundation/mango-v4'
import WalletIcon from '@components/icons/WalletIcon'
import EmptyState from '@components/nftMarket/EmptyState'
import ProfileImage from '@components/profile/ProfileImage'
import Change from '@components/shared/Change'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import SheenLoader from '@components/shared/SheenLoader'
import ToggleFollowButton from '@components/shared/ToggleFollowButton'
import { Disclosure } from '@headlessui/react'
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  NoSymbolIcon,
} from '@heroicons/react/20/solid'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import useAccountPerformanceData from 'hooks/useAccountPerformanceData'
// import useFollowedAccounts from 'hooks/useFollowedAccounts'
import { useHiddenMangoAccounts } from 'hooks/useHiddenMangoAccounts'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import useProfileDetails from 'hooks/useProfileDetails'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityFeed,
  EmptyObject,
  isDepositWithdrawActivityFeedItem,
  isPerpTradeActivityFeedItem,
  isSpotTradeActivityFeedItem,
  isSwapActivityFeedItem,
} from 'types'
import { MANGO_DATA_API_URL } from 'utils/constants'
import { abbreviateAddress } from 'utils/formatting'
import { formatCurrencyValue, formatNumericValue } from 'utils/numbers'
import { formatTokenSymbol } from 'utils/tokens'

export type FollowedAccount = {
  mango_account: string
}

const followedAccounts = [
  { mango_account: '4g1RtA1uL79UKuawEUztFEnWCWgzJbJYrmoyyJAY2rDh' },
]

const getFollowedMangoAccounts = async (accounts: FollowedAccount[]) => {
  const client = mangoStore.getState().client
  const mangoAccounts = []
  for (const account of accounts) {
    try {
      const publicKey = new PublicKey(account.mango_account)
      const mangoAccount = await client.getMangoAccount(publicKey)
      mangoAccounts.push(mangoAccount)
    } catch (e) {
      console.log('failed to load followed mango account', e)
    }
  }
  return mangoAccounts
}

const FollowedAccounts = () => {
  //   const { data: followedAccounts, isInitialLoading: loadingFollowedAccounts } =
  //     useFollowedAccounts()
  const [followedMangoAccounts, setFollowedMangoAccounts] = useState<
    MangoAccount[]
  >([])

  useEffect(() => {
    if (!followedAccounts || !followedAccounts.length) return
    const getAccounts = async () => {
      const accounts = await getFollowedMangoAccounts(followedAccounts)
      setFollowedMangoAccounts(accounts)
    }
    getAccounts()
  }, [followedAccounts])

  return (
    <div className="px-4 pb-12 pt-4 md:px-6">
      {followedMangoAccounts?.length ? (
        <>
          {followedMangoAccounts.map((acc: MangoAccount) => (
            <AccountDisplay account={acc} key={acc.publicKey.toString()} />
          ))}
        </>
      ) : (
        <div className="flex flex-col items-center rounded-md border border-th-bkg-3 p-4">
          <NoSymbolIcon className="mb-1 h-7 w-7 text-th-fgd-4" />
          <p className="mb-1">Your not following any accounts yet...</p>
          <Link href="/leaderboard" shallow>
            <span className="font-bold">Find accounts to follow</span>
          </Link>
        </div>
      )}
    </div>
  )
}

export default FollowedAccounts

const fetchActivityData = async (publicKey: PublicKey) => {
  try {
    const response = await fetch(
      `${MANGO_DATA_API_URL}/stats/activity-feed?mango-account=${publicKey.toString()}&limit=5`,
    )
    const parsedResponse: null | EmptyObject | Array<ActivityFeed> =
      await response.json()

    if (Array.isArray(parsedResponse)) {
      const entries = Object.entries(parsedResponse).sort((a, b) =>
        b[0].localeCompare(a[0]),
      )
      const activity = entries
        .map(([key, value]) => {
          // ETH should be renamed to ETH (Portal) in the database
          const symbol = value.activity_details.symbol
          if (symbol === 'ETH') {
            value.activity_details.symbol = 'ETH (Portal)'
          }
          return {
            ...value,
            symbol: key,
          }
        })
        .sort(
          (a, b) =>
            dayjs(b.block_datetime).unix() - dayjs(a.block_datetime).unix(),
        )
      return activity
    } else return []
  } catch (e) {
    console.log('failed to fetch followed account activity', e)
    return []
  }
}

const AccountDisplay = ({ account }: { account: MangoAccount }) => {
  const { name, owner, publicKey } = account
  const { group } = useMangoGroup()

  const { t } = useTranslation(['common', 'account', 'activity'])
  const { hiddenAccounts, loadingHiddenAccounts } = useHiddenMangoAccounts()
  const { data: profileData } = useProfileDetails(owner.toString())
  const { rollingDailyData } = useAccountPerformanceData(publicKey.toString())

  const isPrivateAccount = useMemo(() => {
    if (!hiddenAccounts?.length) return false
    return hiddenAccounts.find((acc) => acc === account.publicKey.toString())
  }, [account, hiddenAccounts])

  const { data: activityData, isInitialLoading: loadingActivityData } =
    useQuery(
      ['followed-account-activity', publicKey],
      () => fetchActivityData(publicKey),
      {
        cacheTime: 1000 * 60 * 10,
        staleTime: 1000 * 60,
        retry: 3,
        refetchOnWindowFocus: false,
        enabled: publicKey && !isPrivateAccount && !loadingHiddenAccounts,
      },
    )

  const accountValue = useMemo(() => {
    if (!group) return 0
    return toUiDecimalsForQuote(account.getEquity(group).toNumber())
  }, [account, group])

  const accountPnl = useMemo(() => {
    if (!group) return 0
    return toUiDecimalsForQuote(account.getPnl(group).toNumber())
  }, [account, group])

  const [rollingDailyValueChange, rollingDailyPnlChange] = useMemo(() => {
    if (!accountPnl || !rollingDailyData.length) return [0, 0]
    const pnlChange = accountPnl - rollingDailyData[0].pnl
    const valueChange = accountValue - rollingDailyData[0].account_equity
    return [valueChange, pnlChange]
  }, [accountPnl, accountValue, rollingDailyData])

  return !isPrivateAccount ? (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`flex w-full items-center justify-between rounded-md border border-th-bkg-3 p-4 ${
              open ? 'rounded-b-none border-b-0' : ''
            }`}
          >
            <AccountNameDisplay
              accountName={name}
              accountPk={publicKey}
              profileImageUrl={profileData?.profile_image_url}
              profileName={profileData?.profile_name}
              walletPk={owner}
            />
            <div className="flex items-center space-x-4">
              <div className="flex flex-col items-end">
                <p className="mb-1">{t('value')}</p>
                <span className="font-mono">
                  <FormatNumericValue value={accountValue} isUsd />
                </span>
                <Change
                  change={rollingDailyValueChange}
                  prefix="$"
                  size="small"
                />
              </div>
              <div className="flex flex-col items-end">
                <p className="mb-1">{t('pnl')}</p>
                <span className="font-mono">
                  <FormatNumericValue value={accountPnl} isUsd />
                </span>
                <Change
                  change={rollingDailyPnlChange}
                  prefix="$"
                  size="small"
                />
              </div>
              <ChevronDownIcon
                className={`${
                  open ? 'rotate-180' : 'rotate-360'
                } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
              />
            </div>
          </Disclosure.Button>
          <Disclosure.Panel>
            <div className="rounded-md rounded-t-none border border-t-0 border-th-bkg-3 p-4 pt-0">
              <div className="border-t border-th-bkg-3 pt-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base">{t('activity:latest-activity')}</h3>
                  <div className="flex items-center space-x-4">
                    <ToggleFollowButton isFollowed={true} showText />
                    <a
                      className="flex items-center text-th-fgd-2"
                      href={`/?address=${publicKey.toString()}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span>{t('activity:view-account')}</span>
                      <ArrowTopRightOnSquareIcon className="ml-1.5 h-4 w-4" />
                    </a>
                  </div>
                </div>
                {loadingActivityData ? (
                  [...Array(4)].map((x, i) => (
                    <SheenLoader className="flex flex-1" key={i}>
                      <div className="h-10 w-full bg-th-bkg-2" />
                    </SheenLoader>
                  ))
                ) : activityData && activityData.length ? (
                  activityData.map((activity, i) => (
                    <div
                      className="mt-2 rounded-md border border-th-bkg-3 p-4"
                      key={activity.block_datetime + i}
                    >
                      <ActivityContent activity={activity} />
                    </div>
                  ))
                ) : (
                  <EmptyState text={t('activity:no-activity')} />
                )}
              </div>
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  ) : (
    <div className="flex w-full items-center justify-between rounded-md border border-th-bkg-3 p-4">
      <AccountNameDisplay
        accountName={name}
        accountPk={publicKey}
        profileImageUrl={profileData?.profile_image_url}
        profileName={profileData?.profile_name}
        walletPk={owner}
      />
      <div className="flex flex-col items-end">
        <p className="mb-1">{t('account:account-is-private')}</p>
        <ToggleFollowButton isFollowed={true} showText />
      </div>
    </div>
  )
}

const ActivityContent = ({ activity }: { activity: ActivityFeed }) => {
  const { t } = useTranslation(['common', 'activity', 'trade'])
  const { mangoAccountAddress } = useMangoAccount()
  if (isSwapActivityFeedItem(activity)) {
    const { activity_type, block_datetime } = activity
    const {
      swap_in_amount,
      swap_in_symbol,
      swap_out_amount,
      swap_out_price_usd,
      swap_out_symbol,
    } = activity.activity_details
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 font-bold text-th-fgd-1">
            {t(`activity:${activity_type}`)}
          </p>
          <p className="mb-0.5 text-th-fgd-2">{`${formatNumericValue(
            swap_in_amount,
          )} ${formatTokenSymbol(swap_in_symbol)} ${t(
            'trade:for',
          )} ${formatNumericValue(swap_out_amount)} ${formatTokenSymbol(
            swap_out_symbol,
          )}`}</p>
          <p className="text-xs">
            {dayjs(block_datetime).format('DD MMM YYYY, h:mma')}
          </p>
        </div>
        <span className="font-mono">
          {formatCurrencyValue(swap_out_amount * swap_out_price_usd)}
        </span>
      </div>
    )
  }
  if (isSpotTradeActivityFeedItem(activity)) {
    const { activity_type, block_datetime } = activity
    const { price, market, side, size } = activity.activity_details
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 font-bold text-th-fgd-1">
            {t(`activity:${activity_type}`)}
          </p>
          <p className="mb-0.5 text-th-fgd-2">{`${t(
            side,
          )} ${size} ${market}`}</p>
          <p className="text-xs">
            {dayjs(block_datetime).format('DD MMM YYYY, h:mma')}
          </p>
        </div>
        <span className="font-mono">{formatCurrencyValue(price * size)}</span>
      </div>
    )
  }
  if (isPerpTradeActivityFeedItem(activity)) {
    const { activity_type, block_datetime } = activity
    const { perp_market_name, price, quantity, taker, taker_side } =
      activity.activity_details
    const side =
      taker === mangoAccountAddress
        ? taker_side
        : taker_side === 'bid'
        ? 'short'
        : 'long'
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 font-bold text-th-fgd-1">
            {t(`activity:${activity_type}`)}
          </p>
          <p className="mb-0.5 text-th-fgd-2">{`${t(
            side,
          )} ${quantity} ${perp_market_name}`}</p>
          <p className="text-xs">
            {dayjs(block_datetime).format('DD MMM YYYY, h:mma')}
          </p>
        </div>
        <span className="font-mono">
          {formatCurrencyValue(price * quantity)}
        </span>
      </div>
    )
  }
  if (isDepositWithdrawActivityFeedItem(activity)) {
    const { activity_type, block_datetime } = activity
    const { quantity, symbol, usd_equivalent } = activity.activity_details
    return (
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 font-bold text-th-fgd-1">
            {t(`activity:${activity_type}`)}
          </p>
          <p className="mb-0.5 text-th-fgd-2">{`${quantity} ${formatTokenSymbol(
            symbol,
          )}`}</p>
          <p className="text-xs text-th-fgd-4">
            {dayjs(block_datetime).format('DD MMM YYYY, h:mma')}
          </p>
        </div>
        <span className="font-mono">{formatCurrencyValue(usd_equivalent)}</span>
      </div>
    )
  }
  return null
}

const AccountNameDisplay = ({
  accountName,
  accountPk,
  profileImageUrl,
  profileName,
  walletPk,
}: {
  accountName: string | undefined
  accountPk: PublicKey
  profileImageUrl: string | undefined
  profileName: string | undefined
  walletPk: PublicKey
}) => {
  return (
    <div className="flex items-center space-x-3">
      <ProfileImage
        imageSize={'40'}
        imageUrl={profileImageUrl}
        placeholderSize={'24'}
      />
      <div>
        <p className="mb-1 text-left font-bold text-th-fgd-2">
          {accountName ? accountName : abbreviateAddress(accountPk)}
        </p>
        <div className="flex items-center">
          <WalletIcon className="mr-1.5 h-4 w-4" />
          <p>{profileName ? profileName : abbreviateAddress(walletPk)}</p>
        </div>
      </div>
    </div>
  )
}
