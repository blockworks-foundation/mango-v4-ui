import ButtonGroup from '@components/forms/ButtonGroup'
import { LinkButton } from '@components/shared/Button'
import SheenLoader from '@components/shared/SheenLoader'
import { NoSymbolIcon } from '@heroicons/react/20/solid'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useHiddenMangoAccounts } from 'hooks/useHiddenMangoAccounts'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
import { EmptyObject } from 'types'
import { MANGO_DATA_API_URL } from 'utils/constants'
import LeaderboardTable from './LeaderboardTable'
import TabsText from '@components/shared/TabsText'

export interface LeaderboardRes {
  date_hour: string
  mango_account: string
  profile_image_url: string | null
  profile_name: string
  trader_category: string
  wallet_pk: string
}

export interface PnlLeaderboardRes extends LeaderboardRes {
  pnl: number
  start_date_hour: string
}

export interface EquityLeaderboardRes extends LeaderboardRes {
  account_equity: number
}

const isPnlLeaderboardRes = (
  response: null | EmptyObject | PnlLeaderboardRes[],
): response is PnlLeaderboardRes[] => {
  if (response && Array.isArray(response)) {
    return true
  }
  return false
}

const isEquityLeaderboardRes = (
  response: null | EmptyObject | EquityLeaderboardRes[],
): response is EquityLeaderboardRes[] => {
  if (response && Array.isArray(response)) {
    return true
  }
  return false
}

export const isPnlLeaderboard = (
  item: PnlLeaderboardRes | EquityLeaderboardRes,
): item is PnlLeaderboardRes => {
  if ('pnl' in item) {
    return true
  }
  return false
}

export const isEquityLeaderboard = (
  item: PnlLeaderboardRes | EquityLeaderboardRes,
): item is EquityLeaderboardRes => {
  if ('account_equity' in item) {
    return true
  }
  return false
}

type DaysToShow = '1DAY' | '1WEEK' | 'ALLTIME'

const fetchPnlLeaderboard = async (
  daysToShow: DaysToShow,
  offset = 0,
): Promise<Array<PnlLeaderboardRes>> => {
  const data = await fetch(
    `${MANGO_DATA_API_URL}/leaderboard-pnl?over_period=${daysToShow}&offset=${offset}`,
  )
  const parsedData: null | EmptyObject | PnlLeaderboardRes[] = await data.json()

  let leaderboardData
  if (isPnlLeaderboardRes(parsedData)) {
    leaderboardData = parsedData
  }

  return leaderboardData ?? []
}

const fetchEquityLeaderboard = async (
  offset = 0,
): Promise<Array<EquityLeaderboardRes>> => {
  const data = await fetch(
    `${MANGO_DATA_API_URL}/leaderboard-account-equity?offset=${offset}`,
  )
  const parsedData: null | EmptyObject | EquityLeaderboardRes[] =
    await data.json()

  let leaderboardData
  if (isEquityLeaderboardRes(parsedData)) {
    leaderboardData = parsedData
  }

  return leaderboardData ?? []
}

const LeaderboardPage = () => {
  const { t } = useTranslation(['common', 'leaderboard'])
  const [daysToShow, setDaysToShow] = useState<DaysToShow>('ALLTIME')
  const [leaderboardToShow, setLeaderboardToShow] = useState('pnl')
  const { hiddenAccounts } = useHiddenMangoAccounts()

  const {
    data: pnlData,
    isLoading: loadingPnl,
    isFetching: fetchingPnl,
    isFetchingNextPage: fetchingNextPnlPage,
    fetchNextPage: fetchNextPnlPage,
  } = useInfiniteQuery(
    ['pnl-leaderboard', daysToShow, leaderboardToShow],
    ({ pageParam }) => fetchPnlLeaderboard(daysToShow, pageParam),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60 * 5,
      retry: 3,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      getNextPageParam: (_lastPage, pages) => pages.length * 20,
    },
  )

  const {
    data: equityData,
    isLoading: loadingEquity,
    isFetching: fetchingEquity,
    isFetchingNextPage: fetchingNextEquityPage,
    fetchNextPage: fetchNextEquityPage,
  } = useInfiniteQuery(
    ['equity-leaderboard', leaderboardToShow],
    ({ pageParam }) => fetchEquityLeaderboard(pageParam),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60 * 5,
      retry: 3,
      refetchOnWindowFocus: false,
      keepPreviousData: true,
      getNextPageParam: (_lastPage, pages) => pages.length * 20,
    },
  )

  const pnlLeaderboardData = useMemo(() => {
    if (pnlData?.pages.length) {
      if (hiddenAccounts) {
        return pnlData.pages
          .flat()
          .filter((d) => !hiddenAccounts.includes(d.mango_account))
      } else {
        return pnlData.pages.flat()
      }
    }
    return []
  }, [hiddenAccounts, pnlData, daysToShow])

  const equityLeaderboardData = useMemo(() => {
    if (equityData?.pages.length) {
      if (hiddenAccounts) {
        return equityData.pages
          .flat()
          .filter((d) => !hiddenAccounts.includes(d.mango_account))
      } else {
        return equityData.pages.flat()
      }
    }
    return []
  }, [equityData])

  const leaderboardData = useMemo(() => {
    return leaderboardToShow === 'pnl'
      ? pnlLeaderboardData
      : equityLeaderboardData
  }, [leaderboardToShow, pnlLeaderboardData, equityLeaderboardData])

  const handleDaysToShow = (days: DaysToShow) => {
    setDaysToShow(days)
  }

  const isPnl = leaderboardToShow === 'pnl'
  const loading = isPnl ? loadingPnl : loadingEquity
  const fetching = isPnl ? fetchingPnl : fetchingEquity
  const fetchingNextPage = isPnl ? fetchingNextPnlPage : fetchingNextEquityPage
  const fetchNextPage = isPnl ? fetchNextPnlPage : fetchNextEquityPage

  return (
    <div className="p-4 md:p-10 lg:px-0">
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          <h1 className="mb-2">{t('leaderboard')}</h1>
          <div className="mb-4 flex w-full flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-3 md:mb-0">
              <TabsText
                activeTab={leaderboardToShow}
                onChange={(v: string) => setLeaderboardToShow(v)}
                tabs={[
                  ['pnl', 0],
                  ['equity', 0],
                ]}
              />
              <p className="mt-1">
                {isPnl
                  ? t('leaderboard:leaderboard-desc-pnl')
                  : t('leaderboard:leaderboard-desc-equity')}
              </p>
            </div>
            {isPnl ? (
              <div className="w-full md:w-48">
                <ButtonGroup
                  activeValue={daysToShow}
                  disabled={loadingPnl}
                  onChange={(v) => handleDaysToShow(v)}
                  names={['24h', '7d', '30d', t('all')]}
                  values={['1DAY', '1WEEK', 'ALLTIME']}
                />
              </div>
            ) : null}
          </div>
          {leaderboardData.length ? (
            <LeaderboardTable
              data={leaderboardData}
              loading={fetching && !fetchingNextPage}
              type={leaderboardToShow}
            />
          ) : !fetching && !loading ? (
            <div className="flex flex-col items-center rounded-md border border-th-bkg-3 p-4">
              <NoSymbolIcon className="mb-1 h-7 w-7 text-th-fgd-4" />
              <p>{t('leaderboard:leaderboard-unavailable')}</p>
            </div>
          ) : null}
          {loading || fetchingNextPage ? (
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
