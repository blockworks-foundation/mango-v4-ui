import ButtonGroup from '@components/forms/ButtonGroup'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import { MANGO_DATA_API_URL } from 'utils/constants'
import LeaderboardTable from './LeaderboardTable'

const fetchLeaderboard = async (period: string) => {
  const data = await fetch(
    `${MANGO_DATA_API_URL}/leaderboard-pnl?over_period=${period}`
  )
  const res = await data.json()
  return res
}

const LeaderboardPage = () => {
  const { t } = useTranslation('leaderboard')
  const [daysToShow, setDaysToShow] = useState('ALLTIME')

  const res = useQuery(['leaderboard'], () => fetchLeaderboard(daysToShow), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
    // enabled: !!group,
  })

  console.log(res)

  return (
    <div className="p-8 pb-20 md:pb-16 lg:p-10">
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          <h1 className="mb-4">{t('futures-pnl')}</h1>
          {/* <div className="flex flex-col space-y-3 pb-4 md:flex-row md:items-center md:space-x-4 md:space-y-0"> */}
          {/* <div className="flex flex-grow">
              <Input
                type="text"
                name="search"
                id="search"
                placeholder={t('search-placeholder')}
                value={searchString}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchString(e.target.value)
                }
                prefix={
                  <MagnifyingGlassIcon className="h-5 w-5 text-th-fgd-4" />
                }
                suffix={
                  <IconButton disabled={!searchString} size="small">
                    <ArrowRightIcon className="h-5 w-5" />
                  </IconButton>
                }
              />
            </div> */}
          <div className="w-full md:w-48">
            <ButtonGroup
              activeValue={daysToShow}
              onChange={(v) => setDaysToShow(v)}
              names={['24h', '7d', '30d', t('all')]}
              values={['1DAY', '1WEEK', '1MONTH', 'ALLTIME']}
            />
          </div>
          {/* </div> */}
          <LeaderboardTable />
        </div>
      </div>
    </div>
  )
}

export default LeaderboardPage
