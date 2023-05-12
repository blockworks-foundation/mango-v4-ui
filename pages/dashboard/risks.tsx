import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
// import { ReactNode, useCallback, useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
// import {
//   toUiDecimalsForQuote,
//   HealthType,
//   PerpOrder,
// } from '@blockworks-foundation/mango-v4'
// import mangoStore from '@store/mangoStore'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

const RiskDashboard: NextPage = () => {
  const { group } = useMangoGroup()
  // const { mangoTokens } = useJupiterMints()
  // const client = mangoStore(s => s.client)

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 xl:col-span-8 xl:col-start-3">
        <div className="p-8 pb-20 text-th-fgd-1 md:pb-16 xl:p-10">
          <h1>Dashboard</h1>
          <DashboardNavbar />
          {group ? (
            <div className="mt-4">
              <div className="mt-12">
                <div className="mb-4">
                  <p className="text-th-fgd-4">
                    Table 1a: Liqors acquire liabs and assets. The assets and
                    liabs are sum of max assets and max liabs for any token
                    which would be liquidated to fix the health of a mango
                    account. This would be the slippage they would face on
                    buying-liabs/offloading-assets tokens acquired from unhealth
                    accounts after a 20% drop
                  </p>
                </div>
                <Table>
                  <thead>
                    <TrHead className="border">
                      <Th xBorder className="text-left">
                        Coin
                      </Th>
                      <Th xBorder className="text-right">
                        Oracle price
                      </Th>
                      <Th xBorder className="text-right">
                        On-chain price
                      </Th>
                      <Th xBorder className="text-right">
                        Future price
                      </Th>
                      <Th xBorder className="text-right">
                        Liq fee
                      </Th>
                      <Th xBorder className="text-right">
                        Liabs
                      </Th>
                      <Th xBorder className="text-right">
                        Liabs slippage
                      </Th>
                      <Th xBorder className="text-right">
                        Assets
                      </Th>
                      <Th xBorder className="text-right">
                        Assets slippage
                      </Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    <TrBody>
                      <Td xBorder className="text-left">
                        Bonk
                      </Td>
                      <Td xBorder className="text-right">
                        4.432e-7
                      </Td>
                      <Td xBorder className="text-right">
                        4.432e-7
                      </Td>
                      <Td xBorder className="text-right">
                        2.6592e-7
                      </Td>
                      <Td xBorder className="text-right">
                        20.000%
                      </Td>
                      <Td xBorder className="text-right">
                        0$
                      </Td>
                      <Td xBorder className="text-right">
                        0.00%
                      </Td>
                      <Td xBorder className="text-right">
                        0.671$
                      </Td>
                      <Td xBorder className="text-right">
                        0.29%
                      </Td>
                    </TrBody>
                  </tbody>
                </Table>
              </div>
              <div className="mt-12">
                <div className="mb-4">
                  <p className="text-th-fgd-4">
                    Table 1b: Liqors acquire liabs and assets. The assets and
                    liabs are sum of max assets and max liabs for any token
                    which would be liquidated to fix the health of a mango
                    account. This would be the slippage they would face on
                    buying-liabs/offloading-assets tokens acquired from unhealth
                    accounts after a 20% rally
                  </p>
                </div>
                <Table>
                  <thead>
                    <TrHead className="border">
                      <Th xBorder className="text-left">
                        Coin
                      </Th>
                      <Th xBorder className="text-right">
                        Oracle price
                      </Th>
                      <Th xBorder className="text-right">
                        On-chain price
                      </Th>
                      <Th xBorder className="text-right">
                        Future price
                      </Th>
                      <Th xBorder className="text-right">
                        Liq fee
                      </Th>
                      <Th xBorder className="text-right">
                        Liabs
                      </Th>
                      <Th xBorder className="text-right">
                        Liabs slippage
                      </Th>
                      <Th xBorder className="text-right">
                        Assets
                      </Th>
                      <Th xBorder className="text-right">
                        Assets slippage
                      </Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    <TrBody>
                      <Td xBorder className="text-left">
                        Bonk
                      </Td>
                      <Td xBorder className="text-right">
                        4.432e-7
                      </Td>
                      <Td xBorder className="text-right">
                        4.432e-7
                      </Td>
                      <Td xBorder className="text-right">
                        2.6592e-7
                      </Td>
                      <Td xBorder className="text-right">
                        20.000%
                      </Td>
                      <Td xBorder className="text-right">
                        0$
                      </Td>
                      <Td xBorder className="text-right">
                        0.00%
                      </Td>
                      <Td xBorder className="text-right">
                        0.671$
                      </Td>
                      <Td xBorder className="text-right">
                        0.29%
                      </Td>
                    </TrBody>
                  </tbody>
                </Table>
              </div>
              <div className="mt-12">
                <div className="mb-4">
                  <p className="text-th-fgd-4">
                    Table 2a: Perp notional that liqor need to liquidate after a
                    20% drop
                  </p>
                </div>
                <Table>
                  <thead>
                    <TrHead className="border">
                      <Th xBorder className="text-left">
                        Market
                      </Th>
                      <Th xBorder className="text-right">
                        Price
                      </Th>
                      <Th xBorder className="text-right">
                        Future Price
                      </Th>
                      <Th xBorder className="text-right">
                        Notional Position
                      </Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    <TrBody>
                      <Td xBorder className="text-left">
                        ETH-PERP
                      </Td>
                      <Td xBorder className="text-right">
                        1878.63
                      </Td>
                      <Td xBorder className="text-right">
                        1127.18
                      </Td>
                      <Td xBorder className="text-right">
                        1,851.732$
                      </Td>
                    </TrBody>
                  </tbody>
                </Table>
              </div>
              <div className="mt-12">
                <div className="mb-4">
                  <p className="text-th-fgd-4">
                    Table 2b: Perp notional that liqor need to liquidate after a
                    20% rally
                  </p>
                </div>
                <Table>
                  <thead>
                    <TrHead className="border">
                      <Th xBorder className="text-left">
                        Market
                      </Th>
                      <Th xBorder className="text-right">
                        Price
                      </Th>
                      <Th xBorder className="text-right">
                        Future Price
                      </Th>
                      <Th xBorder className="text-right">
                        Notional Position
                      </Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    <TrBody>
                      <Td xBorder className="text-left">
                        ETH-PERP
                      </Td>
                      <Td xBorder className="text-right">
                        1878.63
                      </Td>
                      <Td xBorder className="text-right">
                        1127.18
                      </Td>
                      <Td xBorder className="text-right">
                        1,851.732$
                      </Td>
                    </TrBody>
                  </tbody>
                </Table>
              </div>
              <div className="mt-12">
                <div className="mb-4">
                  <p className="text-th-fgd-4">
                    Table 3: Equity of known liqors from last month
                  </p>
                </div>
                <Table>
                  <thead>
                    <TrHead className="border">
                      <Th xBorder className="text-left">
                        Account
                      </Th>
                      <Th xBorder className="text-right">
                        Equity
                      </Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    <TrBody>
                      <Td xBorder className="text-left">
                        BNTDZJQrjNkjFxYAMCdKH2ShSM6Uwc28aAgit7ytVQJc
                      </Td>
                      <Td xBorder className="text-right">
                        15,034.376$
                      </Td>
                    </TrBody>
                  </tbody>
                </Table>
              </div>
              <div className="mt-12">
                <div className="mb-4">
                  <p className="text-th-fgd-4">
                    Table 4: Equity of known makers from last month
                  </p>
                </div>
                <Table>
                  <thead>
                    <TrHead className="border">
                      <Th xBorder className="text-left">
                        Account
                      </Th>
                      <Th xBorder className="text-right">
                        Equity
                      </Th>
                    </TrHead>
                  </thead>
                  <tbody>
                    <TrBody>
                      <Td xBorder className="text-left">
                        BNTDZJQrjNkjFxYAMCdKH2ShSM6Uwc28aAgit7ytVQJc
                      </Td>
                      <Td xBorder className="text-right">
                        529.325$
                      </Td>
                    </TrBody>
                  </tbody>
                </Table>
              </div>
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
