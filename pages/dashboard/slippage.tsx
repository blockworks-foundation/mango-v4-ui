import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { PublicKey } from '@solana/web3.js'
import { formatNumericValue } from 'utils/numbers'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'settings'])),
    },
  }
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

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 lg:col-span-8 lg:col-start-3">
        <div className="p-8 pb-20 md:pb-16 lg:p-10">
          <h1>Dashboard</h1>
          <DashboardNavbar />
          {group ? (
            <div className="mt-4">
              <div className="mt-12">
                <div className="mb-4">
                  <p className="text-th-fgd-4">Slippage</p>
                </div>
                <Table>
                  <thead>
                    <TrHead className="border">
                      <Th xBorder className="text-left">
                        Token
                      </Th>
                      <Th xBorder className="text-left">
                        Side
                      </Th>
                      <Th xBorder className="text-left">
                        Amount
                      </Th>
                      <Th>Avg PI %</Th>
                      <Th>Min PI %</Th>
                      <Th>Max PI %</Th>
                      <Th>P90</Th>
                      <Th>P95</Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    {group.pis.map((row, idx: number) => {
                      return (
                        <TrBody key={idx}>
                          {Object.values(row).map((val, valIdx) => {
                            return (
                              <Td xBorder key={valIdx}>
                                {formatValue(val)}
                              </Td>
                            )
                          })}
                        </TrBody>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
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
