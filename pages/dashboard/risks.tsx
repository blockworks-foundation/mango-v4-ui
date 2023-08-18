import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { useQuery } from '@tanstack/react-query'
import { emptyWallet } from '@store/mangoStore'
import {
  MANGO_V4_ID,
  MangoClient,
  getRiskStats,
} from '@blockworks-foundation/mango-v4'
import { PublicKey } from '@solana/web3.js'
import { formatNumericValue } from 'utils/numbers'
import { AnchorProvider, web3 } from '@coral-xyz/anchor'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
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
    () => {
      const provider = new AnchorProvider(
        new web3.Connection(
          process.env.NEXT_PUBLIC_ENDPOINT ||
            'https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88',
          'processed',
        ),
        emptyWallet,
        AnchorProvider.defaultOptions(),
      )
      const client = MangoClient.connect(
        provider,
        'mainnet-beta',
        MANGO_V4_ID['mainnet-beta'],
      )
      if (group) {
        return getRiskStats(client, group)
      }
    },
    {
      cacheTime: 1000 * 60 * 5,
      staleTime: 1000 * 60 * 5,
      retry: 0,
      refetchOnWindowFocus: false,
      enabled: !!group,
    },
  )

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 lg:col-span-8 lg:col-start-3">
        <div className="p-8 pb-20 md:pb-16 lg:p-10">
          <h1>Dashboard</h1>
          <DashboardNavbar />
          {group && data ? (
            <div className="mt-4">
              {Object.entries(data).map(
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
                              },
                            )}
                          </TrHead>
                        </thead>
                        <tbody>
                          {table.data.map((rowData, index: number) => {
                            return (
                              <TrBody key={index}>
                                {Object.values(rowData).map(
                                  (val, idx: number) => {
                                    return (
                                      <Td
                                        xBorder
                                        className={`${
                                          val?.highlight ? 'bg-th-bkg-2' : ''
                                        }`}
                                        key={idx}
                                      >
                                        {formatValue(val?.val)}
                                      </Td>
                                    )
                                  },
                                )}
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
      </div>
    </div>
  )
}

export default RiskDashboard
