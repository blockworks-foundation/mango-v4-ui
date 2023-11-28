import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { PublicKey } from '@solana/web3.js'
import { formatNumericValue } from 'utils/numbers'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { useState } from 'react'
import Select from '@components/forms/Select'

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
  const [currentFilter, setCurrentFilter] = useState<
    'avg_price_impact' | 'p90' | 'p95'
  >('avg_price_impact')
  const filters = ['avg_price_impact', 'p90', 'p95']

  const heads = group
    ? [
        ...new Set([
          'Token',
          'Side',
          ...group.pis.map((x) => formatValue(x.target_amount)),
          'Borrows',
          'Init/Maint Weight',
        ]),
      ]
    : []
  type FixedProperties = {
    symbol: string
    side: string
  }

  type DynamicProperties = {
    [key: string]:
      | {
          avg_price_impact: number
          p90: number
          p95: number
        }
      | string
  }

  type TransformedPis = FixedProperties & DynamicProperties
  const transformedPis = group?.pis.reduce((acc, val) => {
    const currentItem = acc.find(
      (x) => x.symbol === val.symbol && x.side === val.side,
    )

    if (currentItem) {
      currentItem['amount_' + val.target_amount] = {
        avg_price_impact: val.avg_price_impact_percent,
        p90: val.p90,
        p95: val.p95,
      }
    } else {
      const newItem = {
        symbol: val.symbol,
        side: val.side,
        ['amount_' + val.target_amount]: {
          avg_price_impact: val.avg_price_impact_percent,
          p90: val.p90,
          p95: val.p95,
        },
      }
      acc.push(newItem)
    }

    return acc
  }, [] as TransformedPis[])

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
                  <p className="text-th-fgd-4">
                    Slippage
                    <Select
                      value={currentFilter}
                      onChange={(filter) => setCurrentFilter(filter)}
                      className="w-full"
                    >
                      {filters.map((filter) => (
                        <Select.Option key={filter} value={filter}>
                          <div className="flex w-full items-center justify-between">
                            {filter}
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </p>
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
                    {transformedPis?.map((row, idx: number) => {
                      const banks = group?.banksMapByName?.get(
                        apiNameToBankName(row.symbol),
                      )
                      const bank = banks && banks[0]
                      const borrowsEnabled = bank?.reduceOnly === 0
                      const hasAssetWeight =
                        bank &&
                        (bank.initAssetWeight.toNumber() > 0 ||
                          bank.maintAssetWeight.toNumber() > 0)

                      return (
                        <TrBody key={idx}>
                          {Object.entries(row).map(([key, val], valIdx) => {
                            const visibleValue =
                              typeof val === 'string' ? val : val[currentFilter]
                            const targetAmount =
                              key.includes('amount_') &&
                              Number(key.replace('amount_', ''))

                            const uiBorrowWeightScaleStartQuote =
                              bank &&
                              toUiDecimals(bank.borrowWeightScaleStartQuote, 6)
                            const uiDepositWeightScaleStartQuote =
                              bank &&
                              toUiDecimals(bank.depositWeightScaleStartQuote, 6)

                            const notionalDeposits =
                              bank!.uiDeposits() * bank!.uiPrice
                            const notionalBorrows =
                              bank!.uiBorrows() * bank!.uiPrice

                            const isAboveLiqFee =
                              ((hasAssetWeight && row.side === 'bid') ||
                                (row.side && borrowsEnabled)) &&
                              typeof visibleValue === 'number' &&
                              visibleValue >
                                bank.liquidationFee.toNumber() * 100

                            const targetAmountVsBorrows =
                              targetAmount &&
                              row.side === 'bid' &&
                              targetAmount <= notionalDeposits
                            const targetAmountVsDeposits =
                              targetAmount &&
                              row.side === 'ask' &&
                              targetAmount <= notionalBorrows

                            const targetAmountVsAssetWeightScale =
                              targetAmount &&
                              row.side === 'bid' &&
                              (!uiBorrowWeightScaleStartQuote ||
                                targetAmount <= uiBorrowWeightScaleStartQuote)

                            const targetAmountVsLiabWeightScale =
                              targetAmount &&
                              uiDepositWeightScaleStartQuote &&
                              row.side === 'ask' &&
                              (!uiDepositWeightScaleStartQuote ||
                                targetAmount <= uiDepositWeightScaleStartQuote)

                            return (
                              <Td
                                xBorder
                                key={valIdx}
                                className={`!p-1 ${
                                  isAboveLiqFee ? 'text-th-error' : ''
                                }`}
                              >
                                <div className="flex">
                                  <div className="mr-2 h-full">
                                    {formatValue(visibleValue)}
                                  </div>
                                  <div className="ml-auto flex w-2">
                                    {(targetAmountVsBorrows ||
                                      targetAmountVsDeposits) && (
                                      <div className="w-2 bg-[#ffff99]"></div>
                                    )}
                                    {(targetAmountVsAssetWeightScale ||
                                      targetAmountVsLiabWeightScale) && (
                                      <div className="w-2 bg-[#0066ff]"></div>
                                    )}
                                  </div>
                                </div>
                              </Td>
                            )
                          })}
                          <Td xBorder>
                            {row.side === 'ask' && `${borrowsEnabled}`}
                          </Td>
                          <Td xBorder>
                            {row.side === 'bid' &&
                              `${
                                bank &&
                                formatValue(bank?.initAssetWeight.toNumber())
                              } / ${
                                bank &&
                                formatValue(bank.maintAssetWeight.toNumber())
                              }`}
                          </Td>
                        </TrBody>
                      )
                    })}
                  </tbody>
                </Table>
                <pre className="mt-6">
                  {`font color: Red  
ask: liquidation fee < price impact && borrows enabled 
bid: liquidation fee < price impact && init or main asset weight > 0

strip color: Yellow
ask: target amount <= notional amount of current deposit
bid: target amount <= notional amount of current borrows

strip color: Blue
ask: target amount <= ui deposit weight scale start quote 
bid: target amount <= ui borrows weight scale start quote
`}
                </pre>
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
