import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { useQuery } from '@tanstack/react-query'
import { Risk } from '@blockworks-foundation/mango-v4'
import { PublicKey } from '@solana/web3.js'
import { formatNumericValue } from 'utils/numbers'
import { MANGO_DATA_API_URL } from 'utils/constants'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'account',
        'close-account',
        'common',
        'notifications',
        'onboarding',
        'profile',
        'search',
        'settings',
        'token',
        'trade',
      ])),
    },
  }
}

type TableRow = {
  val: string | number | PublicKey
  highlight: boolean
}

type TableData = {
  title: string
  data: Array<Record<string, TableRow>>
}

type RiskData = {
  timestamp: string
  payload: Risk
}

const formatValue = (val: string | number | PublicKey) => {
  if (val instanceof PublicKey || typeof val === 'object') {
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

  const { data } = useQuery(
    ['risks'],
    async () => {
      try {
        const data = await fetch(
          `${MANGO_DATA_API_URL}/user-data/risk-dashboard`,
        )
        const res = await data.json()
        console.log(res)
        return res as RiskData
      } catch (e) {
        console.log('Failed to load current season', e)
      }
    },
    {
      cacheTime: 1000 * 60 * 5,
      staleTime: 1000 * 60 * 5,
      retry: 0,
      refetchOnWindowFocus: false,
      enabled: true,
    },
  )

  return (
    <div className="col-span-12 lg:col-span-8 lg:col-start-3">
      <DashboardNavbar />
      {data?.timestamp ? <h6> As of: {data.timestamp} UTC </h6> : null}
      {group && data && data.payload ? (
        <div className="mt-4">
          {Object.entries(data.payload).map(
            ([tableType, table]: [string, TableData]) => {
              if (!table?.data?.length) return null
              return (
                <div className="mt-12" key={tableType}>
                  <div className="mb-4">
                    <p className="text-th-fgd-4">{table.title}</p>
                  </div>
                  <Table>
                    <thead>
                      <TrHead className="border">
                        {Object.keys(table.data[0]).map((colName: string) => {
                          return (
                            <Th xBorder className="text-left" key={colName}>
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
                        })}
                      </TrHead>
                    </thead>
                    <tbody>
                      {table.data.map((rowData, index: number) => {
                        return (
                          <TrBody
                            className={index % 2 === 0 ? 'bg-th-bkg-2 ' : ''}
                            key={index}
                          >
                            {Object.values(rowData).map((val, idx: number) => {
                              return (
                                <Td
                                  xBorder
                                  className={`${
                                    val?.highlight ? 'bg-th-bkg-4' : ''
                                  }`}
                                  key={idx}
                                >
                                  {formatValue(val?.val)}
                                </Td>
                              )
                            })}
                          </TrBody>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              )
            },
          )}
        </div>
      ) : (
        <div className="mt-8 w-full text-center">
          Loading... make take up to 60 seconds
        </div>
      )}
    </div>
  )
}

export default RiskDashboard
