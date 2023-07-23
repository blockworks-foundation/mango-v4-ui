import ButtonGroup from '@components/forms/ButtonGroup'
import { LinkButton } from '@components/shared/Button'
import SheenLoader from '@components/shared/SheenLoader'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { EmptyObject } from 'types'
import { MANGO_DATA_API_URL } from 'utils/constants'
import LeaderboardTable from './LeaderboardTable'

export interface LeaderboardRes {
  date_hour: string
  mango_account: string
  pnl: number
  profile_image_url: string | null
  profile_name: string
  start_date_hour: string
  trader_category: string
  wallet_pk: string
}

type DaysToShow = '1DAY' | '1WEEK' | 'ALLTIME'

const isLeaderboard = (
  response: null | EmptyObject | LeaderboardRes[],
): response is LeaderboardRes[] => {
  if (response && Array.isArray(response)) {
    return true
  }
  return false
}

const fetchLeaderboard = async (
  daysToShow: DaysToShow,
  offset = 0,
): Promise<Array<LeaderboardRes>> => {
  const data = await fetch(
    `${MANGO_DATA_API_URL}/leaderboard-pnl?over_period=${daysToShow}&offset=${offset}`,
  )
  const parsedData: null | EmptyObject | LeaderboardRes[] = await data.json()

  let leaderboardData
  if (isLeaderboard(parsedData)) {
    leaderboardData = parsedData
  }

  return leaderboardData ?? []
}

const LeaderboardPage = () => {
  const { t } = useTranslation(['common', 'leaderboard'])
  const [daysToShow, setDaysToShow] = useState<DaysToShow>('ALLTIME')

  const { data, isLoading, isFetching, isFetchingNextPage, fetchNextPage } =
    useInfiniteQuery(
      ['leaderboard', daysToShow],
      ({ pageParam }) => fetchLeaderboard(daysToShow, pageParam),
      {
        cacheTime: 1000 * 60 * 10,
        staleTime: 1000 * 60 * 5,
        retry: 3,
        refetchOnWindowFocus: false,
        keepPreviousData: true,
        getNextPageParam: (_lastPage, pages) => pages.length * 20,
      },
    )

  const leaderboardData = useMemo(() => {
    if (data?.pages.length) {
      return data.pages.flat()
    }
    return []
  }, [data, daysToShow])

  const handleDaysToShow = (days: DaysToShow) => {
    setDaysToShow(days)
  }

  return (
    <div className="p-4 md:p-10 lg:px-0">
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-2">{t('leaderboard')}</h1>
              <p className="mb-4 md:mb-0">
                {t('leaderboard:leaderboard-desc')}
              </p>
            </div>
            <div className="w-full md:w-48">
              <ButtonGroup
                activeValue={daysToShow}
                disabled={isLoading}
                onChange={(v) => handleDaysToShow(v)}
                names={['24h', '7d', '30d', t('all')]}
                values={['1DAY', '1WEEK', 'ALLTIME']}
              />
            </div>
          </div>
          {leaderboardData.length ? (
            <LeaderboardTable
              data={leaderboardData}
              loading={isFetching && !isFetchingNextPage}
            />
          ) : !isFetching && !isLoading ? (
            <div className="flex flex-col items-center rounded-md border border-th-bkg-3 p-4">
              <NoSymbolIcon className="mb-1 h-7 w-7 text-th-fgd-4" />
              <p>{t('leaderboard:leaderboard-unavailable')}</p>
            </div>
          ) : null}
          {isLoading || isFetchingNextPage ? (
            <div className="mt-2 space-y-2">
              {[...Array(20)].map((x, i) => (
                <SheenLoader className="flex flex-1" key={i}>
                  <div className="h-16 w-full rounded-md bg-th-bkg-2" />
                </SheenLoader>
              ))}
            </div>
          ) : null}
          {leaderboardData.length && leaderboardData.length < 100 ? (
            <LinkButton
              className="mx-auto mt-6"
              onClick={() => fetchNextPage()}
            >
              {t('show-more')}
            </LinkButton>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
