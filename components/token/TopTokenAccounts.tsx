import { Bank } from '@blockworks-foundation/mango-v4'
import MedalIcon from '@components/icons/MedalIcon'
import ProfileImage from '@components/profile/ProfileImage'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import SheenLoader from '@components/shared/SheenLoader'
import { ChevronRightIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'next-i18next'
import { MANGO_DATA_API_URL } from 'utils/constants'

type TopDepositorBorrower = {
  date_hour: string
  mango_account: string
  token_index: number
  value: number
  wallet_pk: string
}

type TopTokenAccount = {
  date_hour: string
  mango_account: string
  token_index: number
  value: number
  wallet_pk: string
  profile_image_url?: string
  profile_name?: string
  trader_category?: string
}

const fetchTopTokenAccounts = async (tokenIndex: number) => {
  try {
    const promises = [
      fetch(
        `${MANGO_DATA_API_URL}/leaderboard-token-deposits?token-index=${tokenIndex}`,
      ),
      fetch(
        `${MANGO_DATA_API_URL}/leaderboard-token-borrows?token-index=${tokenIndex}`,
      ),
    ]
    const [depositsResponse, borrowsResponse] = await Promise.all(promises)

    const [depositsData, borrowsData]: [
      TopDepositorBorrower[],
      TopDepositorBorrower[],
    ] = await Promise.all([depositsResponse.json(), borrowsResponse.json()])

    const depositsDataToShow =
      depositsData && depositsData.length
        ? depositsData.slice(0, 10).filter((d) => d.value >= 1)
        : []

    const borrowsDataToShow =
      borrowsData && borrowsData.length
        ? borrowsData.slice(0, 10).filter((d) => d.value <= -1)
        : []

    const depositorProfilesResponse = await Promise.all(
      depositsDataToShow.map((r: TopDepositorBorrower) =>
        fetch(
          `${MANGO_DATA_API_URL}/user-data/profile-details?wallet-pk=${r.wallet_pk}`,
        ),
      ),
    )

    const depositorProfilesData = await Promise.all(
      depositorProfilesResponse.map((d) => d.json()),
    )

    const borrowerProfilesResponse = await Promise.all(
      borrowsDataToShow.map((r: TopDepositorBorrower) =>
        fetch(
          `${MANGO_DATA_API_URL}/user-data/profile-details?wallet-pk=${r.wallet_pk}`,
        ),
      ),
    )

    const borrowerProfilesData = await Promise.all(
      borrowerProfilesResponse.map((d) => d.json()),
    )

    return [
      depositsDataToShow.map((data, i) => {
        if (depositorProfilesData[i]) {
          return { ...data, ...depositorProfilesData[i] }
        } else return data
      }),
      borrowsDataToShow.map((data, i) => {
        if (borrowerProfilesData[i]) {
          return { ...data, ...borrowerProfilesData[i] }
        } else return data
      }),
    ]
  } catch (e) {
    console.log('Failed to fetch top token accounts', e)
  }
}

const TopTokenAccounts = ({ bank }: { bank: Bank }) => {
  const { t } = useTranslation('token')
  const { data, isLoading, isFetching } = useQuery(
    ['topTokenAccounts', bank.tokenIndex],
    () => fetchTopTokenAccounts(bank!.tokenIndex),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 3,
      refetchOnWindowFocus: false,
    },
  )

  const topAccountsData = data ? data : [[], []]

  return (
    <div className="grid grid-cols-2 gap-6 border-b border-th-bkg-3 px-4 py-6 md:px-6">
      <div className="col-span-2 space-y-2 md:col-span-1">
        <h2 className="mb-3 text-lg">
          {t('top-depositors', { symbol: bank.name })}
        </h2>
        {topAccountsData[0] && topAccountsData[0].length ? (
          topAccountsData[0].map((acc, i) => (
            <LeaderboardRow key={acc.mango_account} item={acc} rank={i + 1} />
          ))
        ) : isLoading || isFetching ? (
          <div className="space-y-2">
            {[...Array(5)].map((x, i) => (
              <SheenLoader className="flex flex-1" key={i}>
                <div className="h-16 w-full rounded-md bg-th-bkg-2" />
              </SheenLoader>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-md border border-th-bkg-3 px-3 py-8 md:px-4">
            <NoSymbolIcon className="h-6 w-6 text-th-fgd-4" />
            <p>{t('no-depositors')}</p>
          </div>
        )}
      </div>
      <div className="col-span-2 space-y-2 md:col-span-1">
        <h2 className="mb-3 text-lg">
          {t('top-borrowers', { symbol: bank.name })}
        </h2>
        {topAccountsData[1] && topAccountsData[1].length ? (
          topAccountsData[1].map((acc, i) => (
            <LeaderboardRow key={acc.mango_account} item={acc} rank={i + 1} />
          ))
        ) : isLoading || isFetching ? (
          <div className="space-y-2">
            {[...Array(5)].map((x, i) => (
              <SheenLoader className="flex flex-1" key={i}>
                <div className="h-16 w-full rounded-md bg-th-bkg-2" />
              </SheenLoader>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-md border border-th-bkg-3 px-3 py-8 md:px-4">
            <NoSymbolIcon className="h-6 w-6 text-th-fgd-4" />
            <p>{t('no-borrowers')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TopTokenAccounts

const LeaderboardRow = ({
  item,
  rank,
}: {
  item: TopTokenAccount
  rank: number
}) => {
  const { profile_name, profile_image_url, mango_account, value, wallet_pk } =
    item

  return (
    <a
      className="flex w-full items-center justify-between rounded-md border border-th-bkg-3 px-3 py-3 md:px-4 md:hover:bg-th-bkg-2"
      href={`/?address=${mango_account}`}
      rel="noopener noreferrer"
      target="_blank"
    >
      <div className="flex items-center space-x-3">
        <div
          className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
            rank < 4 ? '' : 'bg-th-bkg-3'
          } md:mr-2`}
        >
          <p
            className={`relative z-10 font-bold ${
              rank < 4 ? 'text-th-bkg-1' : 'text-th-fgd-3'
            }`}
          >
            {rank}
          </p>
          {rank < 4 ? <MedalIcon className="absolute" rank={rank} /> : null}
        </div>
        <ProfileImage
          imageSize={'40'}
          imageUrl={profile_image_url}
          placeholderSize={'24'}
        />
        <div className="text-left">
          <p className="capitalize text-th-fgd-2 md:text-base">
            {profile_name ||
              wallet_pk.slice(0, 4) + '...' + wallet_pk.slice(-4)}
          </p>
          <p className="text-xs text-th-fgd-4">
            Acc: {mango_account.slice(0, 4) + '...' + mango_account.slice(-4)}
          </p>
        </div>
      </div>
      <div className="flex items-center pl-4">
        <p className="mr-2 text-right font-mono text-th-fgd-2 md:text-base">
          {/* remove isUsd when api returns token amount rather than value */}
          <FormatNumericValue value={value} isUsd />
        </p>
        <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
      </div>
    </a>
  )
}
