import type { NextPage } from 'next'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useBanks from 'hooks/useBanks'
import { Bank } from '@blockworks-foundation/mango-v4'
import { formatCurrencyValue } from 'utils/numbers'
import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import { useRouter } from 'next/router' // Import the useRouter hook
import { useTokenStats } from 'hooks/useTokenStats'
import { TokenStatsItem } from 'types'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import Loading from '@components/shared/Loading'

const Marketing: NextPage = () => {
  const banks = useBanks()['banks']
  const router = useRouter()
  const { data: tokenStats, isLoading } = useTokenStats()

  // const getColorForPercent = (percent: number) => {
  //   // Use a smoother gradient of colors from red to green based on the percentage
  //   if (percent < 10) return '#ff073a' // Deep red
  //   else if (percent < 20) return '#ff6347' // Tomato
  //   else if (percent < 30) return '#ff7f50' // Coral
  //   else if (percent < 40) return '#ffa500' // Orange
  //   else if (percent < 50) return '#ffd700' // Gold
  //   else if (percent < 60) return '#ffff00' // Yellow
  //   else if (percent < 70) return '#adff2f' // Green Yellow
  //   else if (percent < 80) return '#7fff00' // Chartreuse
  //   else if (percent < 90) return '#32cd32' // Lime Green
  //   return '#00ff00' // Green
  // }

  const getColorForPercent = (percent: number) => {
    // Use a smoother gradient of colors from red to green based on the percentage
    if (percent < 20) return 'var(--down)' // Deep red
    else if (percent < 60) return 'var(--warning)' // Yellow
    return 'var(--up)' // Green
  }

  const handleRowClick = (tokenName: string) => {
    router.push(`/stats?token=${tokenName}`)
  }

  const findClosestDate = (targetDate: Date, stats: TokenStatsItem[]) => {
    if (stats?.length) {
      return stats.reduce((closest, date) => {
        const dateObj = new Date(date.date_hour)
        const diff = Math.abs(dateObj.getTime() - targetDate.getTime())
        return diff <
          Math.abs(new Date(closest.date_hour).getTime() - targetDate.getTime())
          ? date
          : closest
      })
    }
  }

  return (
    <div className="col-span-12 w-full lg:col-span-8 lg:col-start-3">
      <DashboardNavbar />
      <div className="mt-4">
        <div className="mx-20 mb-4">
          <p className="flex items-center space-x-4 text-th-fgd-4">
            <span>Fullness of Token Deposits</span>
          </p>
        </div>
        <div
          className="thin-scroll w-full overflow-y-auto"
          style={{ maxHeight: '70vh' }}
        >
          <Table className="h-full">
            <thead>
              <TrHead
                style={{ boxShadow: '1px -5px 1px rgba(0,0,0,1)', zIndex: 19 }}
                className="sticky top-0 border-t bg-th-bkg-2"
              >
                <Th
                  className="text-left"
                  style={{ borderLeft: '1px solid #ccc' }}
                >
                  {'Symbol'}
                </Th>
                <Th className="text-right">{'Leverage'}</Th>
                <Th className="text-right">{'Deposits'}</Th>
                <Th className="text-right">{'Limit'}</Th>
                <Th className="text-right">{'Percent'}</Th>
                <Th className="text-right">{'Deposits Change 1d'}</Th>
                <Th className="text-right">{'Deposits Change 1w'}</Th>
              </TrHead>
            </thead>
            <tbody>
              {banks.map((bank: Bank, idx) => {
                const depositsValue = bank?.uiDeposits() * bank?.uiPrice
                const depositLimit = Number(
                  toUiDecimalsForQuote(bank.borrowWeightScaleStartQuote),
                )
                const percent = (100 * depositsValue) / depositLimit

                const bankStats = tokenStats?.data?.length
                  ? tokenStats.data.filter(
                      (stats) => stats.symbol === bank.name,
                    )
                  : []

                const currentDate = new Date()
                const oneDayAgo = new Date(currentDate)
                oneDayAgo.setDate(oneDayAgo.getDate() - 1)

                const oneWeekAgo = new Date(currentDate)
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

                const closestToOneDayAgo = findClosestDate(oneDayAgo, bankStats)
                const closestToOneWeekAgo = findClosestDate(
                  oneWeekAgo,
                  bankStats,
                )

                const deposits = bank.uiDeposits()

                const depositsChangeDay = closestToOneDayAgo?.total_deposits
                  ? deposits - closestToOneDayAgo.total_deposits
                  : null
                const depositsChangeWeek = closestToOneWeekAgo?.total_deposits
                  ? deposits - closestToOneWeekAgo.total_deposits
                  : null

                if (
                  bank?.name !== 'USDC' &&
                  bank?.maintAssetWeight.toNumber() > 0
                ) {
                  return (
                    <TrBody
                      key={idx}
                      className="h-10 cursor-pointer text-xs md:hover:bg-th-bkg-2"
                      onClick={() => handleRowClick(bank.name)}
                    >
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        <p>{bank?.name}</p>
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        <p className="text-right">
                          {(
                            1 /
                            (1 - bank?.initAssetWeight.toNumber())
                          ).toFixed()}
                          x
                        </p>
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        <p className="text-right">
                          $
                          {(bank?.uiDeposits() * bank?.uiPrice).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            },
                          )}
                        </p>
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        <p className="text-right">
                          {formatCurrencyValue(
                            toUiDecimalsForQuote(
                              bank.borrowWeightScaleStartQuote,
                            ),
                          )}
                        </p>
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        <div className="flex justify-end">
                          <p
                            style={{
                              color: getColorForPercent(percent),
                            }}
                          >
                            {percent.toFixed(2)}%
                          </p>
                          {/* <div
                              style={{
                                width: `${percent}%`,
                                backgroundColor: getColorForPercent(percent),
                                minHeight: '1rem',
                                marginLeft: '70px', // Offset to the right to avoid overlap
                              }}
                              className="transition-all duration-300 ease-in-out"
                            /> */}
                        </div>
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        <div className="flex justify-end">
                          {isLoading ? (
                            <Loading />
                          ) : depositsChangeDay ? (
                            <BankAmountWithValue
                              amount={depositsChangeDay}
                              bank={bank}
                              stacked
                              textColorClass={
                                depositsChangeDay > 0
                                  ? 'text-th-up'
                                  : depositsChangeDay < 0
                                  ? 'text-th-down'
                                  : ''
                              }
                            />
                          ) : (
                            '–'
                          )}
                        </div>
                      </Td>
                      <Td className={`sticky left-0 z-10 !py-3`}>
                        <div className="flex justify-end">
                          {isLoading ? (
                            <Loading />
                          ) : depositsChangeWeek ? (
                            <BankAmountWithValue
                              amount={depositsChangeWeek}
                              bank={bank}
                              stacked
                              textColorClass={
                                depositsChangeWeek > 0
                                  ? 'text-th-up'
                                  : depositsChangeWeek < 0
                                  ? 'text-th-down'
                                  : ''
                              }
                            />
                          ) : (
                            '–'
                          )}
                        </div>
                      </Td>
                    </TrBody>
                  )
                }
              })}
            </tbody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export default Marketing
