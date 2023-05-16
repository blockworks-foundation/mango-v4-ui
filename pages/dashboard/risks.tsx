import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { useQuery } from '@tanstack/react-query'
import mangoStore from '@store/mangoStore'
import { getRiskStats } from '@blockworks-foundation/mango-v4'
import { PublicKey } from '@solana/web3.js'
import { formatNumericValue } from 'utils/numbers'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

type TableData = {
  title: string
  data: Array<Record<string, { val: string | number | PublicKey }>>
}

const formatValue = (val: string | number | PublicKey) => {
  if (val instanceof PublicKey) {
    return val.toString()
  }
  if (typeof val === 'string') {
    return val
  } else {
    return formatNumericValue(val)
  }
}

const RiskDashboard: NextPage = () => {
  const { group } = useMangoGroup()
  const client = mangoStore((s) => s.client)

  const { data, isLoading, isFetching } = useQuery(
    ['risks'],
    () => group && getRiskStats(client, group),
    {
      cacheTime: 1000 * 60 * 10,
      retry: 3,
      refetchOnWindowFocus: true,
      enabled: !!group,
    }
  )

  console.log('resp', isLoading, isFetching, data)

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 xl:col-span-8 xl:col-start-3">
        <div className="p-8 pb-20 text-th-fgd-1 md:pb-16 xl:p-10">
          <h1>Dashboard</h1>
          <DashboardNavbar />
          {group && data ? (
            <div className="mt-4">
              {Object.entries(data).map(
                ([tableType, table]: [string, TableData]) => {
                  return (
                    <div className="mt-12" key={tableType}>
                      <div className="mb-4">
                        <p className="text-th-fgd-4">{table.title}</p>
                      </div>
                      <Table>
                        <thead>
                          <TrHead className="border">
                            {Object.keys(table.data[0]).map(
                              (colName: string) => {
                                return (
                                  <Th
                                    xBorder
                                    className="text-left"
                                    key={colName}
                                  >
                                    {colName}{' '}
                                    {colName.toLowerCase().includes('fee') ||
                                    colName.toLowerCase().includes('slippage')
                                      ? '(bps)'
                                      : ''}
                                    {colName.toLowerCase().includes('assets') ||
                                    colName.toLowerCase().includes('liabs') ||
                                    colName.toLowerCase().includes('equity') ||
                                    colName.toLowerCase().includes('price') ||
                                    colName.toLowerCase().includes('position')
                                      ? '($)'
                                      : ''}
                                  </Th>
                                )
                              }
                            )}
                          </TrHead>
                        </thead>
                        <tbody>
                          {table.data.map((rowData, index: number) => {
                            return (
                              <TrBody key={index}>
                                {Object.values(rowData).map(
                                  (
                                    col: {
                                      val: string | number | PublicKey
                                    },
                                    idx: number
                                  ) => {
                                    return (
                                      <Td
                                        xBorder
                                        className="text-left"
                                        key={idx}
                                      >
                                        {formatValue(col.val)}
                                      </Td>
                                    )
                                  }
                                )}
                              </TrBody>
                            )
                          })}
                        </tbody>
                      </Table>
                    </div>
                  )
                }
              )}
            </div>
          ) : (
            'Loading'
          )}
        </div>
      </div>
    </div>
  )
}

export default RiskDashboard
