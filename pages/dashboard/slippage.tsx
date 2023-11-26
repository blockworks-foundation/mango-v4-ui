import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { PublicKey } from '@solana/web3.js'
import { formatNumericValue } from 'utils/numbers'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'

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
  const heads = group
    ? [
        ...new Set([
          'Token',
          'Side',
          ...group.pis.map((x) => formatValue(x.target_amount)),
        ]),
      ]
    : []

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
                      {heads.map((x) => (
                        <Th key={x} xBorder className="text-left">
                          {x}
                        </Th>
                      ))}
                    </TrHead>
                  </thead>
                  <tbody>
                    {group.pis.map((row, idx: number) => {
                      return (
                        <TrBody key={idx}>
                          {Object.entries(row).map(([key, val], valIdx) => {
                            const banks = group?.banksMapByName?.get(
                              apiNameToBankName(row.symbol),
                            )
                            if (!banks?.length) {
                              console.log(row.symbol, banks)
                            }

                            const bank = banks && banks[0]
                            const uiBorrowWeightScaleStartQuote =
                              bank &&
                              toUiDecimals(bank.borrowWeightScaleStartQuote, 6)
                            const uiDepositWeightScaleStartQuote =
                              bank &&
                              toUiDecimals(bank.depositWeightScaleStartQuote, 6)

                            const keysForLiqFee = [
                              'avg_price_impact_percent',
                              'max_price_impact_percent',
                              'min_price_impact_percent',
                              'p95',
                              'p90',
                            ]

                            //if liquidation fee is lower then price impact
                            const isAboveLiqFee =
                              keysForLiqFee.includes(key) &&
                              bank &&
                              typeof val === 'number' &&
                              val > bank.liquidationFee.toNumber() * 100

                            //if side is bid and borrowWeightScaleStartQuote is bigger then target_amount
                            const isAmountBelowBorrowWeightScale =
                              uiBorrowWeightScaleStartQuote === undefined ||
                              (key === 'target_amount' &&
                                typeof val === 'number' &&
                                val < uiBorrowWeightScaleStartQuote &&
                                row.side === 'bid')

                            //if side is ask and borrowDepositWeightScaleStartQuote is bigger then target_amount
                            const isAmountBelowDepositWeightScale =
                              uiDepositWeightScaleStartQuote === undefined ||
                              (key === 'target_amount' &&
                                typeof val === 'number' &&
                                val < uiDepositWeightScaleStartQuote &&
                                row.side === 'ask')

                            return (
                              <Td
                                xBorder
                                className={`${
                                  isAboveLiqFee ||
                                  isAmountBelowBorrowWeightScale ||
                                  isAmountBelowDepositWeightScale
                                    ? 'text-th-error'
                                    : ''
                                }`}
                                key={valIdx}
                              >
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

const apiNameToBankName = (val: string) => {
  if (val === 'ETH') {
    return 'ETH (Portal)'
  }
  return val
}
