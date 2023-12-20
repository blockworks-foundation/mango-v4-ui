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
import Input from '@components/forms/Input'

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

const formatValue = (val: string | number | PublicKey) => {
  if (val instanceof PublicKey || typeof val === 'object') {
    return val.toString()
  }
  if (typeof val === 'string') {
    if (val === 'ask') {
      return 'Sell'
    }
    if (val === 'bid') {
      return 'Buy'
    }
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
  const [currentSearch, setCurrentSearch] = useState('')

  const filters = ['avg_price_impact', 'p90', 'p95']

  const heads = group
    ? [
        ...new Set([
          'Token',
          'Side',
          ...group.pis.map((x) => formatValue(x.target_amount)),
          'Init/Main Weight',
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
  const transformedPis = group?.pis
    .filter((x) => x.symbol.toLowerCase().includes(currentSearch.toLowerCase()))
    .reduce((acc, val) => {
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
                  <p className="flex items-center space-x-4 text-th-fgd-4">
                    <span>Slippage</span>
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
                    <Input
                      suffix="Token"
                      type="text"
                      value={currentSearch}
                      onChange={(e) => setCurrentSearch(e.target.value)}
                    ></Input>
                  </p>
                </div>
                <Table>
                  <thead>
                    <TrHead className="sticky top-0 border bg-th-bkg-1">
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
                      const isBid = row.side === 'bid'
                      const isAsk = row.side === 'ask'
                      const collateralEnabled = bank?.maintAssetWeight.isPos()
                      return (
                        <TrBody key={idx}>
                          {Object.entries(row).map(([key, val], valIdx) => {
                            const visibleValue =
                              typeof val === 'string' ? val : val[currentFilter]
                            const isNumericValue =
                              typeof visibleValue === 'number'
                            const targetAmount =
                              (key.includes('amount_') &&
                                Number(key.replace('amount_', ''))) ||
                              0
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
                              (hasAssetWeight || borrowsEnabled) &&
                              isNumericValue &&
                              visibleValue >
                                bank.liquidationFee.toNumber() * 100

                            const targetAmountVsDeposits =
                              isBid && targetAmount <= notionalDeposits
                            const targetAmountVsBorrows =
                              isAsk && targetAmount <= notionalBorrows

                            const targetAmountVsAssetWeightScale =
                              isBid &&
                              collateralEnabled &&
                              uiBorrowWeightScaleStartQuote &&
                              targetAmount <= uiBorrowWeightScaleStartQuote

                            const targetAmountVsLiabWeightScale =
                              isAsk &&
                              collateralEnabled &&
                              uiDepositWeightScaleStartQuote &&
                              targetAmount <= uiDepositWeightScaleStartQuote

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
                                  {isNumericValue && (
                                    <div className="ml-auto flex w-4">
                                      {(targetAmountVsBorrows ||
                                        targetAmountVsDeposits) && (
                                        <div className="w-2 bg-[#ffff99]"></div>
                                      )}
                                      {(targetAmountVsAssetWeightScale ||
                                        targetAmountVsLiabWeightScale) && (
                                        <div className="w-2 bg-[#0066ff]"></div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </Td>
                            )
                          })}
                          <Td xBorder>
                            {isBid &&
                              collateralEnabled &&
                              `${
                                bank &&
                                formatValue(
                                  bank
                                    ?.scaledInitAssetWeight(bank.price)
                                    .toNumber(),
                                )
                              } / ${
                                bank &&
                                formatValue(bank.maintAssetWeight.toNumber())
                              }`}

                            {isAsk &&
                              borrowsEnabled &&
                              `${
                                bank &&
                                formatValue(
                                  bank
                                    ?.scaledInitLiabWeight(bank.price)
                                    .toNumber(),
                                )
                              } / ${
                                bank &&
                                formatValue(bank.maintLiabWeight.toNumber())
                              }`}
                          </Td>
                        </TrBody>
                      )
                    })}
                  </tbody>
                </Table>
                <pre className="mt-6">
                  {`font color: Red  
sell: liquidation fee < price impact && init or main asset weight > 0
buy: liquidation fee < price impact && borrows enabled 

strip color: Yellow
sell: target amount <= notional amount of current deposit
buy: target amount <= notional amount of current borrows

strip color: Blue
sell: target amount <= ui deposit weight scale start quote && main asset weight > 0
buy: target amount <= ui borrows weight scale start quote && main asset weight > 0
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
