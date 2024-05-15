import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { DashboardNavbar } from '.'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { PublicKey } from '@solana/web3.js'
import { formatNumericValue } from 'utils/numbers'
import { OracleProvider, toUiDecimals } from '@blockworks-foundation/mango-v4'
import { useMemo, useState } from 'react'
import Select from '@components/forms/Select'
import Input from '@components/forms/Input'
import {
  LISTING_PRESETS,
  getMidPriceImpacts,
  getPythPresets,
  getSwitchBoardPresets,
} from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'

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
  const filterLabels = {
    avg_price_impact: 'Average Price Impact',
    p90: '90th Percentile',
    p95: '95th Percentile',
  }

  const heads = group
    ? [
        ...new Set([
          'Token',
          'Side',
          ...group.pis.map((x) => formatValue(x.target_amount)),
          'Init/Main Weight',
          '~Current tier',
          'Suggested tier',
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
          target_amount: number
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
          target_amount: val.target_amount,
        }
      } else {
        const newItem = {
          symbol: val.symbol,
          side: val.side,
          ['amount_' + val.target_amount]: {
            avg_price_impact: val.avg_price_impact_percent,
            p90: val.p90,
            p95: val.p95,
            target_amount: val.target_amount,
          },
        }
        acc.push(newItem)
      }

      return acc
    }, [] as TransformedPis[])
  const symbolToSuggestedPresetName = useMemo(
    () => (group ? getMidPriceImpacts(group.pis) : []),
    [group],
  )
    .filter((x) => x.avg_price_impact_percent < 1)
    .reduce(
      (acc, val, index, pisFiltred) => {
        const bank = group?.banksMapByName.get(apiNameToBankName(val.symbol))
        const firstBank = bank ? bank[0] : undefined
        const avaPreests =
          firstBank?.oracleProvider === OracleProvider.Pyth
            ? getPythPresets(LISTING_PRESETS)
            : getSwitchBoardPresets(LISTING_PRESETS)
        if (!acc[val.symbol]) {
          acc[val.symbol] =
            Object.values(avaPreests).find(
              (x) =>
                x.preset_target_amount <=
                pisFiltred
                  .filter((pis) => pis.symbol === val.symbol)
                  .sort(
                    (a, b) =>
                      b.avg_price_impact_percent - a.avg_price_impact_percent,
                  )[0].target_amount,
            )?.preset_name || 'C'
        }
        return acc
      },
      {} as { [symbol: string]: string },
    )

  return (
    <div className="col-span-12 w-full lg:col-span-8 lg:col-start-3">
      <DashboardNavbar />
      {group ? (
        <div className="mt-4">
          <div className="mb-4 ml-20 mr-20">
            <p className="flex items-center space-x-4 text-th-fgd-4">
              <span>Slippage</span>
              <Select
                value={currentFilter}
                onChange={(filter) => setCurrentFilter(filter)}
                className="w-full"
                renderValue={(selected) =>
                  filterLabels[selected as keyof typeof filterLabels]
                }
              >
                {filters.map((filter) => {
                  return (
                    <Select.Option key={filter} value={filter}>
                      <div className="flex w-full items-center justify-between">
                        {filterLabels[filter as keyof typeof filterLabels]}
                      </div>
                    </Select.Option>
                  )
                })}
              </Select>
              <Input
                suffix="Token"
                type="text"
                heightClass={'h-10'}
                value={currentSearch}
                onChange={(e) => setCurrentSearch(e.target.value)}
              ></Input>
            </p>
          </div>
          <div className="w-full overflow-scroll" style={{ maxHeight: '70vh' }}>
            <Table className="h-full">
              <thead>
                <TrHead
                  style={{ boxShadow: '1px -5px 1px #1d1924', zIndex: 19 }}
                  className="sticky top-0 border-t bg-th-bkg-2"
                >
                  {heads.map((x, i: number) => (
                    <Th key={x} xBorder={i != 0} className={`text-left`}>
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
                    <TrBody
                      key={idx}
                      className="h-10 text-xs md:hover:bg-th-bkg-2"
                    >
                      {Object.entries(row).map(([key, val], valIdx) => {
                        const visibleValue =
                          typeof val === 'string' ? val : val[currentFilter]
                        const isNumericValue = typeof visibleValue === 'number'
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
                          (bank && bank!.uiDeposits() * bank!.uiPrice) || 0
                        const notionalBorrows =
                          (bank && bank!.uiBorrows() * bank!.uiPrice) || 0

                        const isAboveLiqFee =
                          (hasAssetWeight || borrowsEnabled) &&
                          isNumericValue &&
                          visibleValue > bank.liquidationFee.toNumber() * 100

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
                            xBorder={valIdx != 0}
                            key={valIdx}
                            className={`!py-3 
                          ${valIdx == 0 ? 'z-1 sticky left-0 bg-th-bkg-2' : ''}
                          ${isAboveLiqFee ? 'text-th-error' : ''}`}
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
                              bank?.scaledInitLiabWeight(bank.price).toNumber(),
                            )
                          } / ${
                            bank && formatValue(bank.maintLiabWeight.toNumber())
                          }`}
                      </Td>
                      <Td>
                        {idx % 2 === 0 && bank
                          ? Object.values(LISTING_PRESETS).find((x) => {
                              return x.initLiabWeight.toFixed(1) === '1.8'
                                ? x.initLiabWeight.toFixed(1) ===
                                    bank?.initLiabWeight
                                      .toNumber()
                                      .toFixed(1) &&
                                    x.reduceOnly === bank.reduceOnly
                                : x.initLiabWeight.toFixed(1) ===
                                    bank?.initLiabWeight.toNumber().toFixed(1)
                            })?.preset_name || ''
                          : ''}
                      </Td>
                      <Td xBorder>
                        {idx % 2 === 0
                          ? symbolToSuggestedPresetName[row.symbol]
                            ? symbolToSuggestedPresetName[row.symbol]
                            : 'C'
                          : ''}
                      </Td>
                    </TrBody>
                  )
                })}
              </tbody>
            </Table>
          </div>
          <div className="mb-10 ml-20 mr-20 mt-1">
            <span>
              <h4 className="border-th-bkg-3 px-6 py-4">Annotation Key</h4>
            </span>
            <Table className="h-full text-xs">
              <thead>
                <TrHead
                  style={{ boxShadow: '1px -5px 1px #1d1924', zIndex: 19 }}
                  className=" bg-th-bkg-2"
                >
                  <Th xBorder className={`text-left`}>
                    Annotation
                  </Th>
                  <Th xBorder className={`text-left`}>
                    Sell
                  </Th>
                  <Th xBorder className={`text-left`}>
                    Buy
                  </Th>
                </TrHead>
              </thead>
              <tbody>
                <TrBody className="h-10">
                  <Td>
                    <div className="flex text-th-error">Red Text</div>
                  </Td>
                  <Td>
                    <div className="flex">
                      {`liquidation fee < price impact && init or main asset weight > 0`}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex">
                      {`liquidation fee < price impact && borrows enabled `}
                    </div>
                  </Td>
                </TrBody>
                <TrBody className="h-10">
                  <Td>
                    <div className="flex">
                      <div className="flex">
                        <div className="mr-2 h-full"></div>
                        <div className="ml-auto flex items-center">
                          <div className="h-5 w-2 bg-[#ffff99]"></div>{' '}
                          {/* Fixed width and height */}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex">
                      {`target amount <= notional amount of current deposit`}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex">
                      {`target amount <= notional amount of current borrows `}
                    </div>
                  </Td>
                </TrBody>
                <TrBody className="h-10">
                  <Td>
                    <div className="flex">
                      <div className="flex">
                        <div className="mr-2 h-full"></div>
                        <div className="ml-auto flex items-center">
                          <div className="h-5 w-2 bg-[#0066ff]"></div>{' '}
                          {/* Fixed width and height */}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex">
                      {`target amount <= ui deposit weight scale start quote && main asset weight > 0`}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex">
                      {`target amount <= ui borrows weight scale start quote && main asset weight > 0`}
                    </div>
                  </Td>
                </TrBody>
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
  )
}

export default RiskDashboard

const apiNameToBankName = (val: string) => {
  if (val === 'ETH') {
    return 'ETH (Portal)'
  }
  if (val === '$WIF') {
    return 'WIF'
  }
  return val
}
