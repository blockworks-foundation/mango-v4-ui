import {
  Bank,
  toUiDecimals,
  I80F48,
  ZERO_I80F48,
  ONE_I80F48,
} from '@blockworks-foundation/mango-v4'
import ExplorerLink from '@components/shared/ExplorerLink'

import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { RouteInfo } from 'types/jupiter'
import Input from '@components/forms/Input'

function sumMap<T>(is: T[], f: (i: T) => number | undefined) {
  return is.reduce((a, i) => a + (f(i) || 0), 0)
}
function avgMap<T>(is: T[], f: (i: T) => number | undefined) {
  return sumMap<T>(is, f) / is.length
}

function sumMapF<T>(is: T[], f: (i: T) => I80F48 | undefined) {
  return is.reduce((a, i) => a.add(f(i) || ZERO_I80F48()), ZERO_I80F48())
}
function avgMapF<T>(is: T[], f: (i: T) => I80F48 | undefined) {
  return sumMapF<T>(is, f).div(I80F48.fromNumber(is.length))
}

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

async function fetchJupRoutes(
  mint: string,
  side: 'asset' | 'liab',
  amount: any,
  slippageBps: any
): Promise<RouteInfo[]> {
  const paramsString = new URLSearchParams({
    inputMint:
      side === 'asset' ? mint : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    outputMint:
      side === 'liab' ? mint : 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    amount: Math.ceil(amount).toString(),
    onlyDirectRoutes: 'false',
    slippageBps: slippageBps.toString(),
    swapMode: side === 'asset' ? 'ExactIn' : 'ExactOut',
  }).toString()

  const response = await fetch(
    `https://quote-api.jup.ag/v3/quote?${paramsString}`
  )

  const res = await response.json()

  console.log(
    'fairValue',
    mint,
    side,
    Math.ceil(amount).toString(),
    `https://quote-api.jup.ag/v3/quote?${paramsString}`,
    res.data
  )
  return res.data
}

interface AssetStats {
  name: string
  mint: string
  banks: Bank[]
  nativeDeposits: I80F48
  nativeBorrows: I80F48
  uiDeposits: string
  uiBorrows: string
  util: string
  initAssetWeight: string
  maintAssetWeight: string
  initLiabWeight: string
  maintLiabWeight: string
  oraclePrice: string
  stablePrice: I80F48
  assetPrice: string
  liabPrice: string
  assetValue: string
  liabValue: string
  liqFee: string
}

const Risk: NextPage = () => {
  const { group } = useMangoGroup()
  // const { mangoTokens } = useJupiterMints()
  // const client = mangoStore(s => s.client)

  // const handleClickScroll = (id: string) => {
  //   const element = document.getElementById(id)
  //   if (element) {
  //     element.scrollIntoView({ behavior: 'smooth' })
  //   }
  // }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [assetStats, setAssetStats] = useState<AssetStats[]>([])
  const [form, setForm] = useState<AssetStats[]>([])
  const onItemInRowChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number,
    name: string
  ) => {
    setForm((prevState) => {
      const newState = prevState.map((obj, objIdx) => {
        if (objIdx === idx) {
          return { ...obj, [name]: e.target.value }
        }

        return obj
      })
      debounce.debounceFcn(async () => {
        //will be called after someone stop typing
        calc(newState)
      })
      return newState
    })
  }
  const calc = (form: AssetStats[]) => {
    console.log(form)
    //calc and update state
  }
  useEffect(() => {
    let active = true
    load()
    return () => {
      active = false
    }

    async function load() {
      if (!group) return
      const res = await Promise.all(
        Array.from(group.banksMapByMint.entries()).map(
          async ([mint, banks]) => {
            const name = banks[0].name
            const nativeDeposits = sumMapF(banks, (b) => b.nativeDeposits())
            const nativeBorrows = sumMapF(banks, (b) => b.nativeBorrows())
            const uiDeposits = toUiDecimals(
              nativeDeposits,
              banks[0].mintDecimals
            )
            const uiBorrows = toUiDecimals(nativeBorrows, banks[0].mintDecimals)
            const util = nativeBorrows
              .div(nativeDeposits.add(ONE_I80F48()))
              .toNumber()
            const initAssetWeight = avgMapF(banks, (b) =>
              b.scaledInitAssetWeight()
            )
            const maintAssetWeight = avgMapF(banks, (b) => b.maintAssetWeight)
            const initLiabWeight = avgMapF(banks, (b) =>
              b.scaledInitLiabWeight()
            )
            const maintLiabWeight = avgMapF(banks, (b) => b.maintLiabWeight)

            const oraclePrice = avgMapF(banks, (b) => b._price)
            const stablePrice = I80F48.fromNumber(
              avgMap(banks, (b) => b.stablePriceModel.stablePrice)
            )
            const assetPrice = group.toUiPrice(
              oraclePrice.min(stablePrice),
              banks[0].mintDecimals
            )
            const liabPrice = group.toUiPrice(
              oraclePrice.max(stablePrice),
              banks[0].mintDecimals
            )

            const liqFee = avgMapF(banks, (b) => b.liquidationFee)

            const [assetRoutes, liabRoutes] = await Promise.all([
              fetchJupRoutes(mint, 'asset', nativeDeposits, 10000),
              fetchJupRoutes(mint, 'liab', nativeBorrows, 10000),
            ])
            const assetValue =
              assetRoutes.length > 0 ? assetRoutes[0].outAmount / 1_000_000 : 0
            const liabValue =
              uiBorrows < 0.1
                ? 0
                : liabRoutes.length > 0
                ? liabRoutes[0].inAmount / 1_000_000
                : Number.POSITIVE_INFINITY

            return {
              name,
              mint,
              banks,
              nativeDeposits,
              nativeBorrows,
              uiDeposits: uiDeposits.toFixed(1),
              uiBorrows: uiBorrows.toFixed(1),
              util: util.toFixed(4),
              initAssetWeight: initAssetWeight.toFixed(4),
              maintAssetWeight: maintAssetWeight.toFixed(4),
              initLiabWeight: initLiabWeight.toFixed(4),
              maintLiabWeight: maintLiabWeight.toFixed(4),
              oraclePrice: oraclePrice.toFixed(4),
              stablePrice,
              assetPrice: assetPrice.toFixed(4),
              liabPrice: liabPrice.toFixed(4),
              assetValue: assetValue.toFixed(0),
              liabValue: liabValue.toFixed(0),
              liqFee: liqFee.toFixed(4),
            }
          }
        )
      )
      if (!active) {
        return
      }

      setAssetStats(res)
      setForm(res)
    }
  }, [group?.publicKey.toBase58()])

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 border-b border-th-bkg-3">
        <div className="p-8 pb-20 md:pb-16 lg:p-10">
          <h1>Risk</h1>
          {group ? (
            <div className="mt-4">
              <h2 className="mb-2">Group</h2>
              <ExplorerLink
                address={group?.publicKey.toString()}
                anchorData
              ></ExplorerLink>

              <table className="table-auto border-separate border-spacing-2 border">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Banks</th>
                    <th>Util</th>
                    <th>IAW</th>
                    <th>MAW</th>
                    <th>ILW</th>
                    <th>MLW</th>
                    <th>liqFee</th>
                    <th>Borrows</th>
                    <th>Price</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {form.map((s) => {
                    return (
                      <tr key={s.mint}>
                        <th>{s.name}</th>
                        <th>{s.banks.length}</th>
                        <th>{s.util}</th>
                        <th>{s.initAssetWeight.toString()}</th>
                        <th>{s.maintAssetWeight.toString()}</th>
                        <th>{s.initLiabWeight.toString()}</th>
                        <th>{s.maintLiabWeight.toString()}</th>
                        <th>{s.liqFee.toString()}</th>
                        <th>{s.uiBorrows.toString()}</th>
                        <th>${s.oraclePrice.toString()}</th>
                        <th>
                          $
                          {(
                            Number(s.oraclePrice) * Number(s.uiBorrows)
                          ).toFixed(0)}
                        </th>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <table className="mt-4 w-full table-auto border-spacing-4 border-4">
                <thead>
                  <tr className="border-4">
                    <th className="border-x p-2">Token</th>
                    <th className="border-x p-2">T</th>
                    <th className="border-x p-2">InitW</th>
                    <th className="border-x p-2">MaintW</th>
                    <th className="border-x p-2">Amount</th>
                    <th className="border-x p-2">Price</th>
                    <th className="border-x p-2">Risk</th>
                    <th className="border-x p-2">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {form.map((s, idx) => {
                    const borderStyleCell = 'border-x border-slate-300 p-1'
                    return (
                      <>
                        <tr key={`${s.mint}-assets`} className="border-t">
                          <th className={borderStyleCell}>{s.name}</th>
                          <th className={borderStyleCell}>As</th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.initAssetWeight}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => onItemInRowChange(e, idx, 'initAssetWeight')}
                            ></Input>
                          </th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.maintAssetWeight}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) =>
                                onItemInRowChange(e, idx, 'maintAssetWeight')
                              }
                            ></Input>
                          </th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.uiDeposits}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => onItemInRowChange(e, idx, 'uiDeposits')}
                            ></Input>
                          </th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.assetPrice}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => onItemInRowChange(e, idx, 'assetPrice')}
                            ></Input>
                          </th>
                          <th className={borderStyleCell}>
                            ${Number(s.uiDeposits) * Number(s.assetPrice)}
                          </th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.assetValue}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => onItemInRowChange(e, idx, 'assetValue')}
                            ></Input>
                          </th>
                        </tr>
                        <tr key={`${s.mint}-liabs`} className="border-b">
                          <th className={borderStyleCell}></th>
                          <th className={borderStyleCell}>Li</th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.initLiabWeight}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => onItemInRowChange(e, idx, 'initLiabWeight')}
                            ></Input>
                          </th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.maintLiabWeight}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => onItemInRowChange(e, idx, 'maintLiabWeight')}
                            ></Input>
                          </th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.uiBorrows}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => onItemInRowChange(e, idx, 'uiBorrows')}
                            ></Input>
                          </th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.liabPrice}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => onItemInRowChange(e, idx, 'liabPrice')}
                            ></Input>
                          </th>
                          <th className={borderStyleCell}>
                            $
                            {(
                              Number(s.uiBorrows) * Number(s.liabPrice)
                            ).toFixed(0)}
                          </th>
                          <th className={borderStyleCell}>
                            <Input
                              value={s.liabValue}
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => onItemInRowChange(e, idx, 'liabValue')}
                            ></Input>
                          </th>
                        </tr>
                      </>
                    )
                  })}
                </tbody>
              </table>

              {/* <h3 className="mt-6 text-sm text-th-fgd-3">Banks</h3>
              {Array.from(group.banksMapByMint).map(([mintAddress, banks]) => {
                return (
                  <div
                    key={mintAddress}
                    className="mt-6 border-b border-th-bkg-3"
                  >
                    {banks.map((bank) => {
                      const logoUri = mangoTokens.length
                        ? mangoTokens.find((t) => t.address === mintAddress)
                            ?.logoURI
                        : ''
                      return (
                        <div
                          key={bank.publicKey.toString()}
                          id={bank.name}
                          className="scroll-mt-28"
                        >
                          <div className="mb-3 flex items-center">
                            {logoUri ? (
                              <Image
                                alt=""
                                width="24"
                                height="24"
                                src={logoUri}
                              />
                            ) : (
                              <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
                            )}
                            <h4 className="ml-2 text-lg font-bold text-th-fgd-2">
                              {bank.name} Bank
                            </h4>
                          </div>
                          <KeyValuePair
                            label="Mint"
                            value={<ExplorerLink address={mintAddress} />}
                          />
                          <KeyValuePair
                            label="Bank"
                            value={
                              <ExplorerLink
                                address={bank.publicKey.toString()}
                                anchorData
                              />
                            }
                          />
                          <KeyValuePair
                            label="Vault"
                            value={
                              <ExplorerLink
                                address={bank.vault.toString()}
                                anchorData
                              />
                            }
                          />
                          <KeyValuePair
                            label="Oracle"
                            value={
                              <ExplorerLink address={bank.oracle.toString()} />
                            }
                          />
                          <KeyValuePair
                            label="Token Index"
                            value={bank.tokenIndex}
                          />
                          <KeyValuePair
                            label="Oracle Price"
                            value={`$${bank.uiPrice}`}
                          />
                          <KeyValuePair
                            label="Stable Price"
                            value={`$${group.toUiPrice(
                              I80F48.fromNumber(
                                bank.stablePriceModel.stablePrice
                              ),
                              bank.mintDecimals
                            )}`}
                          />
                          <VaultData bank={bank} />
                          <KeyValuePair
                            label="Loan Fee Rate"
                            value={`${(
                              10000 * bank.loanFeeRate.toNumber()
                            ).toFixed(2)} bps`}
                          />
                          <KeyValuePair
                            label="Loan origination fee rate"
                            value={`${(
                              10000 * bank.loanOriginationFeeRate.toNumber()
                            ).toFixed(2)} bps`}
                          />
                          <KeyValuePair
                            label="Collected fees native"
                            value={bank.collectedFeesNative.toNumber()}
                          />
                          <KeyValuePair
                            label="Liquidation fee"
                            value={`${(
                              10000 * bank.liquidationFee.toNumber()
                            ).toFixed(2)} bps`}
                          />
                          <KeyValuePair
                            label="Dust"
                            value={bank.dust.toNumber()}
                          />
                          <KeyValuePair
                            label="Deposits"
                            value={toUiDecimals(
                              bank.indexedDeposits
                                .mul(bank.depositIndex)
                                .toNumber(),
                              bank.mintDecimals
                            )}
                          />
                          <KeyValuePair
                            label="Borrows"
                            value={toUiDecimals(
                              bank.indexedBorrows
                                .mul(bank.borrowIndex)
                                .toNumber(),
                              bank.mintDecimals
                            )}
                          />
                          <KeyValuePair
                            label="Avg Utilization"
                            value={`${bank.avgUtilization.toNumber() * 100}%`}
                          />
                          <KeyValuePair
                            label="Maint Asset/Liab Weight"
                            value={`${bank.maintAssetWeight.toFixed(2)}/
                              ${bank.maintLiabWeight.toFixed(2)}`}
                          />
                          <KeyValuePair
                            label="Init Asset/Liab Weight"
                            value={`${bank.initAssetWeight.toFixed(2)}/
                              ${bank.initLiabWeight.toFixed(2)}`}
                          />
                          <KeyValuePair
                            label="Scaled Init Asset/Liab Weight"
                            value={`${bank.scaledInitAssetWeight().toFixed(4)}/
                              ${bank.scaledInitLiabWeight().toFixed(4)}`}
                          />
                          <KeyValuePair
                            label="Deposit weight scale start quote"
                            value={bank.depositWeightScaleStartQuote}
                          />
                          <KeyValuePair
                            label="Borrow weight scale start quote"
                            value={bank.borrowWeightScaleStartQuote}
                          />
                          <KeyValuePair
                            label="Rate params"
                            value={
                              <span className="text-right">
                                {`${(100 * bank.rate0.toNumber()).toFixed(
                                  2
                                )}% @ ${(
                                  100 * bank.util0.toNumber()
                                ).toFixed()}% util, `}
                                {`${(100 * bank.rate1.toNumber()).toFixed(
                                  2
                                )}% @ ${(
                                  100 * bank.util1.toNumber()
                                ).toFixed()}% util, `}
                                {`${(100 * bank.maxRate.toNumber()).toFixed(
                                  2
                                )}% @ 100% util`}
                              </span>
                            }
                          />
                          <KeyValuePair
                            label="Deposit rate"
                            value={`${bank.getDepositRateUi()}%`}
                          />
                          <KeyValuePair
                            label="Borrow rate"
                            value={`${bank.getBorrowRateUi()}%`}
                          />
                          <KeyValuePair
                            label="Last index update"
                            value={new Date(
                              1000 * bank.indexLastUpdated.toNumber()
                            ).toUTCString()}
                          />
                          <KeyValuePair
                            label="Last rates updated"
                            value={new Date(
                              1000 * bank.bankRateLastUpdated.toNumber()
                            ).toUTCString()}
                          />
                          <KeyValuePair
                            label="Last stable price updated"
                            value={new Date(
                              1000 *
                                bank.stablePriceModel.lastUpdateTimestamp.toNumber()
                            ).toUTCString()}
                          />
                          <KeyValuePair
                            label="Stable Price: delay interval"
                            value={`${bank.stablePriceModel.delayIntervalSeconds}s`}
                          />
                          <KeyValuePair
                            label="Stable Price: growth limits"
                            value={`${(
                              100 * bank.stablePriceModel.delayGrowthLimit
                            ).toFixed(2)}% delay / ${(
                              100 * bank.stablePriceModel.stableGrowthLimit
                            ).toFixed(2)}% stable`}
                          />
                          <KeyValuePair
                            label="Oracle: Conf Filter"
                            value={`${(
                              100 * bank.oracleConfig.confFilter.toNumber()
                            ).toFixed(2)}%`}
                          />
                          <KeyValuePair
                            label="Oracle: Max Staleness"
                            value={`${bank.oracleConfig.maxStalenessSlots} slots`}
                          />
                          <KeyValuePair
                            label="netBorrowsInWindow / netBorrowLimitPerWindowQuote"
                            value={`${bank.netBorrowsInWindow.toNumber()} / ${bank.netBorrowLimitPerWindowQuote.toNumber()}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              })} */}

              {/* <h3 className="mt-6 text-sm text-th-fgd-3">Perp Markets</h3>
              {Array.from(group.perpMarketsMapByOracle).map(
                ([oracle, perpMarket]) => {
                  return (
                    <div
                      key={oracle.toString()}
                      className="mt-6 border-b border-th-bkg-3"
                    >
                      <div
                        key={perpMarket.publicKey.toString()}
                        id={perpMarket.name}
                        className="scroll-mt-28"
                      >
                        <div className="mb-3 flex items-center">
                          <h4 className="ml-2 text-lg font-bold text-th-fgd-2">
                            {perpMarket.name} Perp Market
                          </h4>
                        </div>
                        <KeyValuePair
                          label="Perp Market"
                          value={
                            <ExplorerLink
                              address={perpMarket.publicKey.toString()}
                              anchorData
                            />
                          }
                        />
                        <KeyValuePair
                          label="Bids"
                          value={
                            <ExplorerLink
                              address={perpMarket.bids.toString()}
                              anchorData
                            />
                          }
                        />
                        <KeyValuePair
                          label="Asks"
                          value={
                            <ExplorerLink
                              address={perpMarket.asks.toString()}
                              anchorData
                            />
                          }
                        />
                        <KeyValuePair
                          label="Event Queue"
                          value={
                            <ExplorerLink
                              address={perpMarket.eventQueue.toString()}
                              anchorData
                            />
                          }
                        />
                        <KeyValuePair
                          label="Oracle"
                          value={
                            <ExplorerLink
                              address={perpMarket.oracle.toString()}
                            />
                          }
                        />
                        <KeyValuePair
                          label="Perp Market Index"
                          value={perpMarket.perpMarketIndex}
                        />
                        <KeyValuePair
                          label="Oracle Price"
                          value={`$${perpMarket.uiPrice}`}
                        />
                        <KeyValuePair
                          label="Stable Price"
                          value={`$${group.toUiPrice(
                            I80F48.fromNumber(
                              perpMarket.stablePriceModel.stablePrice
                            ),
                            perpMarket.baseDecimals
                          )}`}
                        />
                        <KeyValuePair
                          label="Open Interest"
                          value={`${perpMarket.openInterest} lots`}
                        />
                        <KeyValuePair
                          label="Lot Sizes"
                          value={`${perpMarket.baseLotSize} base /
                          ${perpMarket.quoteLotSize} quote`}
                        />
                        <KeyValuePair
                          label="Maint Asset/Liab Weight"
                          value={`${perpMarket.maintAssetWeight.toFixed(4)}/
                          ${perpMarket.maintLiabWeight.toFixed(4)}`}
                        />
                        <KeyValuePair
                          label="Init Asset/Liab Weight"
                          value={`${perpMarket.initAssetWeight.toFixed(4)}/
                          ${perpMarket.initLiabWeight.toFixed(4)}`}
                        />
                        <KeyValuePair
                          label="Liquidation Fee"
                          value={`${(
                            100 * perpMarket.liquidationFee.toNumber()
                          ).toFixed(4)}%`}
                        />
                        <KeyValuePair
                          label="Trading Fees"
                          value={`${(
                            10000 * perpMarket.makerFee.toNumber()
                          ).toFixed(2)} bps maker / ${(
                            10000 * perpMarket.takerFee.toNumber()
                          ).toFixed(2)} bps taker`}
                        />
                        <KeyValuePair
                          label="Funding Limits"
                          value={`${(
                            100 * perpMarket.minFunding.toNumber()
                          ).toFixed(2)}% to ${(
                            100 * perpMarket.maxFunding.toNumber()
                          ).toFixed(2)}%`}
                        />
                        <KeyValuePair
                          label="Fees Accrued"
                          value={`$${toUiDecimals(perpMarket.feesAccrued, 6)}`}
                        />
                        <KeyValuePair
                          label="Fees Settled"
                          value={`$${toUiDecimals(perpMarket.feesSettled, 6)}`}
                        />
                        <KeyValuePair
                          label="Oracle: Conf Filter"
                          value={`${(
                            100 * perpMarket.oracleConfig.confFilter.toNumber()
                          ).toFixed(2)}%`}
                        />
                        <KeyValuePair
                          label="Oracle: Max Staleness"
                          value={`${perpMarket.oracleConfig.maxStalenessSlots} slots`}
                        />
                        <KeyValuePair
                          label="Trusted Market"
                          value={`${perpMarket.trustedMarket}`}
                        />
                        <KeyValuePair
                          label="Group Insurance Fund"
                          value={`${perpMarket.groupInsuranceFund}`}
                        />
                      </div>
                    </div>
                  )
                }
              )} */}
            </div>
          ) : (
            'Loading'
          )}
        </div>
      </div>
    </div>
  )
}
/*
const KeyValuePair = ({
  label,
  value,
}: {
  label: string
  value: number | ReactNode | string
}) => {
  return (
    <div className="flex justify-between border-t border-th-bkg-3 py-4 xl:py-1.5">
      <span className="mr-4 whitespace-nowrap text-th-fgd-3">{label}</span>
      {value}
    </div>
  )
}


const VaultData = ({ bank }: { bank: Bank }) => {
  const [vault, setVault] = useState<any>()
  const client = mangoStore((s) => s.client)

  const getVaultData = useCallback(async () => {
    const res = await client.program.provider.connection.getAccountInfo(
      bank.vault
    )
    const v = res?.data ? coder().accounts.decode('token', res.data) : undefined

    setVault(v)
  }, [bank.vault])

  useEffect(() => {
    getVaultData()
  }, [getVaultData])

  return (
    <KeyValuePair
      label="Vault balance"
      value={
        vault ? toUiDecimals(vault.amount.toNumber(), bank.mintDecimals) : '...'
      }
    />
  )
}
*/

export default Risk

class Debounce {
  typingTimeout: null | ReturnType<typeof setTimeout>
  constructor() {
    this.typingTimeout = null
  }
  debounceFcn = (callback: any, timeoutDuration = 900) => {
    if (!callback) {
      console.log('missing argument callback')
    }
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout)
    }
    this.typingTimeout = setTimeout(() => {
      callback()
    }, timeoutDuration)
  }
}
export const debounce = new Debounce()
