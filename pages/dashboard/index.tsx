import { Bank, toUiDecimals, I80F48 } from '@blockworks-foundation/mango-v4'
import ExplorerLink from '@components/shared/ExplorerLink'
import { coder } from '@project-serum/anchor/dist/cjs/spl/token'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { ReactNode, useCallback, useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { Disclosure } from '@headlessui/react'
import MarketLogos from '@components/trade/MarketLogos'
import Button from '@components/shared/Button'
import BN from 'bn.js'
import { useRouter } from 'next/router'
import Link from 'next/link'
import {
  LISTING_PRESETS,
  formatSuggestedValues,
  LISTING_PRESETS_KEYS,
  getFormattedBankValues,
} from 'utils/governance/listingTools'
import { compareObjectsAndGetDifferentKeys } from 'utils/governance/tools'
import {
  MANGO_DAO_WALLET,
  MANGO_DAO_WALLET_GOVERNANCE,
} from 'utils/governance/constants'
import { AccountMeta } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import { createProposal } from 'utils/governance/instructions/createProposal'
import { notify } from 'utils/notifications'
import GovernancePageWrapper from '@components/governance/GovernancePageWrapper'
import TokenLogo from '@components/shared/TokenLogo'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
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

const Dashboard: NextPage = () => {
  const { group } = useMangoGroup()
  const client = mangoStore((s) => s.client)
  const wallet = useWallet()
  const connection = mangoStore((s) => s.connection)
  const voter = GovernanceStore((s) => s.voter)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const proposals = GovernanceStore((s) => s.proposals)

  const [suggestedTiers, setSuggestedTiers] = useState<
    Partial<{ [key: string]: string }>
  >({})

  const getSuggestedTierForListedTokens = useCallback(async () => {
    type PriceImpactResp = {
      avg_price_impact_percent: number
      side: 'ask' | 'bid'
      target_amount: number
      symbol: string
      //there is more fileds they are just not used on ui
    }
    const resp = await fetch(
      'https://api.mngo.cloud/data/v4/risk/listed-tokens-one-week-price-impacts'
    )
    const jsonReps = await resp.json()

    const filteredResp = (jsonReps as PriceImpactResp[])
      .filter((x) => x.avg_price_impact_percent < 1 && x.side === 'ask')
      .reduce(
        (acc: { [key: string]: PriceImpactResp }, val: PriceImpactResp) => {
          if (
            !acc[val.symbol] ||
            val.target_amount > acc[val.symbol].target_amount
          ) {
            acc[val.symbol] = val
          }
          return acc
        },
        {}
      )

    const suggestedTiers = Object.keys(filteredResp).reduce(
      (acc: { [key: string]: string | undefined }, key: string) => {
        acc[key] = Object.values(LISTING_PRESETS).find(
          (x) => x.target_amount === filteredResp[key].target_amount
        )?.preset_key
        return acc
      },
      {}
    )
    setSuggestedTiers(suggestedTiers)
  }, [])

  const proposeNewSuggestedValues = useCallback(
    async (
      bank: Bank,
      invalidFieldsKeys: string[],
      tokenTier: LISTING_PRESETS_KEYS
    ) => {
      const proposalTx = []
      const mintInfo = group!.mintInfosMapByTokenIndex.get(bank.tokenIndex)!
      const preset = LISTING_PRESETS[tokenTier]
      const fieldsToChange = invalidFieldsKeys.reduce(
        (obj, key) => ({ ...obj, [key]: preset[key as keyof typeof preset] }),
        {}
      ) as Partial<typeof preset>

      const isThereNeedOfSendingOracleConfig =
        fieldsToChange.oracleConfFilter !== undefined ||
        fieldsToChange.maxStalenessSlots !== undefined
      const isThereNeedOfSendingRateConfigs =
        fieldsToChange.adjustmentFactor !== undefined ||
        fieldsToChange.util0 !== undefined ||
        fieldsToChange.rate0 !== undefined ||
        fieldsToChange.util1 !== undefined ||
        fieldsToChange.rate1 !== undefined ||
        fieldsToChange.maxRate !== undefined

      const ix = await client!.program.methods
        .tokenEdit(
          null,
          isThereNeedOfSendingOracleConfig
            ? {
                confFilter: fieldsToChange.oracleConfFilter!,
                maxStalenessSlots: fieldsToChange.maxStalenessSlots!,
              }
            : null,
          null,
          isThereNeedOfSendingRateConfigs
            ? {
                adjustmentFactor: fieldsToChange.adjustmentFactor!,
                util0: fieldsToChange.util0!,
                rate0: fieldsToChange.rate0!,
                util1: fieldsToChange.util1!,
                rate1: fieldsToChange.rate1!,
                maxRate: fieldsToChange.maxRate!,
              }
            : null,
          getNullOrVal(fieldsToChange.loanFeeRate),
          getNullOrVal(fieldsToChange.loanOriginationFeeRate),
          getNullOrVal(fieldsToChange.maintAssetWeight),
          getNullOrVal(fieldsToChange.initAssetWeight),
          getNullOrVal(fieldsToChange.maintLiabWeight),
          getNullOrVal(fieldsToChange.initLiabWeight),
          getNullOrVal(fieldsToChange.liquidationFee),
          null,
          null,
          null,
          getNullOrVal(fieldsToChange.minVaultToDepositsRatio),
          getNullOrVal(fieldsToChange.netBorrowLimitPerWindowQuote)
            ? new BN(fieldsToChange.netBorrowLimitPerWindowQuote!)
            : null,
          getNullOrVal(fieldsToChange.netBorrowLimitWindowSizeTs)
            ? new BN(fieldsToChange.netBorrowLimitWindowSizeTs!)
            : null,
          getNullOrVal(fieldsToChange.borrowWeightScale),
          getNullOrVal(fieldsToChange.depositWeightScale),
          false,
          false,
          null,
          null,
          null
        )
        .accounts({
          group: group!.publicKey,
          oracle: bank.oracle,
          admin: MANGO_DAO_WALLET,
          mintInfo: mintInfo.publicKey,
        })
        .remainingAccounts([
          {
            pubkey: bank.publicKey,
            isWritable: true,
            isSigner: false,
          } as AccountMeta,
        ])
        .instruction()
      proposalTx.push(ix)

      const walletSigner = wallet as never
      try {
        const index = proposals ? Object.values(proposals).length : 0
        const proposalAddress = await createProposal(
          connection,
          walletSigner,
          MANGO_DAO_WALLET_GOVERNANCE,
          voter.tokenOwnerRecord!,
          `Edit token ${bank.name}`,
          'Adjust settings to current liquidity',
          index,
          proposalTx,
          vsrClient!
        )
        window.open(
          `https://dao.mango.markets/dao/MNGO/proposal/${proposalAddress.toBase58()}`,
          '_blank'
        )
      } catch (e) {
        notify({
          title: 'Error during proposal creation',
          description: `${e}`,
          type: 'error',
        })
      }
    },
    [
      client,
      connection,
      group,
      proposals,
      voter.tokenOwnerRecord,
      vsrClient,
      wallet,
    ]
  )

  const extractTokenTierForName = (
    suggestedTokenObj: Partial<{
      [key: string]: string
    }>,
    tier: string
  ) => {
    if (tier === 'ETH (Portal)') {
      return suggestedTokenObj['ETH']
    }
    return suggestedTokenObj[tier]
  }

  useEffect(() => {
    getSuggestedTierForListedTokens()
  }, [getSuggestedTierForListedTokens])

  return (
    <GovernancePageWrapper noStyles={true}>
      <div className="grid grid-cols-12">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          <div className="p-8 pb-20 md:pb-16 lg:p-10">
            <h1>Dashboard</h1>
            <DashboardNavbar />
            {group ? (
              <div className="mt-4">
                <ExplorerLink
                  address={group?.publicKey.toString()}
                  anchorData
                ></ExplorerLink>
                <div className="mt-4 flex space-x-4">
                  <Button
                    secondary
                    size="small"
                    onClick={() => {
                      const panels = [
                        ...document.querySelectorAll(
                          '[aria-expanded=false][aria-label=panel]'
                        ),
                      ]
                      panels.map((panel) => (panel as HTMLElement).click())
                    }}
                  >
                    Expand All
                  </Button>
                  <Button
                    secondary
                    size="small"
                    onClick={() => {
                      const panels = [
                        ...document.querySelectorAll(
                          '[aria-expanded=true][aria-label=panel]'
                        ),
                      ]
                      panels.map((panel) => (panel as HTMLElement).click())
                    }}
                  >
                    Collpase All
                  </Button>
                </div>
                <h3 className="mt-6 mb-3 text-base text-th-fgd-3">Banks</h3>
                <div className="border-b border-th-bkg-3">
                  {Array.from(group.banksMapByMint)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([mintAddress, banks]) =>
                      banks.map((bank) => {
                        const mintInfo = group.mintInfosMapByMint.get(
                          bank.mint.toString()
                        )

                        const formattedBankValues = getFormattedBankValues(
                          group,
                          bank
                        )

                        const suggestedTier = extractTokenTierForName(
                          suggestedTiers,
                          bank.name
                        )
                          ? extractTokenTierForName(suggestedTiers, bank.name)!
                          : 'SHIT'

                        const suggestedVaules =
                          LISTING_PRESETS[suggestedTier as LISTING_PRESETS_KEYS]
                        const suggestedFormattedPreset =
                          formatSuggestedValues(suggestedVaules)

                        type SuggestedFormattedPreset =
                          typeof suggestedFormattedPreset

                        const invalidKeys: (keyof SuggestedFormattedPreset)[] =
                          Object.keys(suggestedVaules).length
                            ? compareObjectsAndGetDifferentKeys<SuggestedFormattedPreset>(
                                formattedBankValues,
                                suggestedFormattedPreset
                              ).filter(
                                (x: string) =>
                                  suggestedFormattedPreset[
                                    x as keyof SuggestedFormattedPreset
                                  ]
                              )
                            : []

                        const suggestedFields: Partial<SuggestedFormattedPreset> =
                          invalidKeys.reduce((obj, key) => {
                            return {
                              ...obj,
                              [key]: suggestedFormattedPreset[key],
                            }
                          }, {})

                        return (
                          <Disclosure key={bank.publicKey.toString()}>
                            {({ open }) => (
                              <>
                                <Disclosure.Button
                                  aria-label="panel"
                                  className={`flex w-full items-center justify-between border-t border-th-bkg-3 p-4 md:hover:bg-th-bkg-4 ${
                                    open ? 'bg-th-bkg-4' : ''
                                  }`}
                                >
                                  <div className="flex items-center">
                                    <TokenLogo bank={bank} />
                                    <p className="ml-2 text-th-fgd-2">
                                      {formattedBankValues.name} Bank
                                    </p>
                                  </div>
                                  <ChevronDownIcon
                                    className={`${
                                      open ? 'rotate-180' : 'rotate-360'
                                    } h-5 w-5 text-th-fgd-3`}
                                  />
                                </Disclosure.Button>
                                <Disclosure.Panel>
                                  <KeyValuePair
                                    label="Mint"
                                    value={
                                      <ExplorerLink address={mintAddress} />
                                    }
                                  />
                                  <KeyValuePair
                                    label="Bank"
                                    value={
                                      <ExplorerLink
                                        address={formattedBankValues.publicKey.toString()}
                                        anchorData
                                      />
                                    }
                                  />
                                  <KeyValuePair
                                    label="MintInfo"
                                    value={
                                      <ExplorerLink
                                        address={mintInfo!.publicKey.toString()}
                                        anchorData
                                      />
                                    }
                                  />
                                  <KeyValuePair
                                    label="Vault"
                                    value={
                                      <ExplorerLink
                                        address={formattedBankValues.vault}
                                        anchorData
                                      />
                                    }
                                  />
                                  <KeyValuePair
                                    label="Oracle"
                                    value={
                                      <ExplorerLink
                                        address={formattedBankValues.oracle}
                                      />
                                    }
                                  />
                                  <KeyValuePair
                                    label="Token Index"
                                    value={formattedBankValues.tokenIndex}
                                  />
                                  <KeyValuePair
                                    label="Mint Decimals"
                                    value={formattedBankValues.mintDecimals}
                                  />
                                  <KeyValuePair
                                    label="Oracle Price"
                                    value={`$${bank.uiPrice}`}
                                  />
                                  <KeyValuePair
                                    label="Stable Price"
                                    value={`$${formattedBankValues.stablePrice}`}
                                  />
                                  <KeyValuePair
                                    label="Last stable price updated"
                                    value={
                                      formattedBankValues.lastStablePriceUpdated
                                    }
                                  />
                                  <KeyValuePair
                                    label="Stable Price: delay interval"
                                    value={`${formattedBankValues.stablePriceModel.delayIntervalSeconds}s`}
                                  />
                                  <KeyValuePair
                                    label="Stable Price: growth limits"
                                    value={`${formattedBankValues.stablePriceGrowthLimitsDelay}% delay / ${formattedBankValues.stablePriceGrowthLimitsStable}% stable`}
                                  />
                                  <VaultData bank={bank} />
                                  <KeyValuePair
                                    label="Loan Fee Rate"
                                    value={`${formattedBankValues.loanFeeRate} bps`}
                                    proposedValue={
                                      suggestedFields.loanFeeRate &&
                                      `${suggestedFields.loanFeeRate} bps`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Loan origination fee rate"
                                    value={`${formattedBankValues.loanOriginationFeeRate} bps`}
                                    proposedValue={
                                      suggestedFields.loanOriginationFeeRate &&
                                      `${suggestedFields.loanOriginationFeeRate} bps`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Collected fees native"
                                    value={`${formattedBankValues.collectedFeesNative} ($${formattedBankValues.collectedFeesNativePrice})`}
                                  />
                                  <KeyValuePair
                                    label="Dust"
                                    value={formattedBankValues.dust}
                                  />
                                  <KeyValuePair
                                    label="Deposits"
                                    value={`${formattedBankValues.deposits} ($${formattedBankValues.depositsPrice})`}
                                  />
                                  <KeyValuePair
                                    label="Borrows"
                                    value={`${formattedBankValues.borrows} ($${formattedBankValues.borrowsPrice})`}
                                  />
                                  <KeyValuePair
                                    label="Avg Utilization"
                                    value={`${formattedBankValues.avgUtilization}%`}
                                  />
                                  <KeyValuePair
                                    label="Maint Asset/Liab Weight"
                                    value={`${formattedBankValues.maintAssetWeight} /
                              ${formattedBankValues.maintLiabWeight}`}
                                    proposedValue={
                                      (suggestedFields.maintAssetWeight ||
                                        suggestedFields.maintLiabWeight) &&
                                      `${
                                        suggestedFields.maintAssetWeight ||
                                        formattedBankValues.maintAssetWeight
                                      } /
                              ${
                                suggestedFields.maintLiabWeight ||
                                formattedBankValues.maintLiabWeight
                              }`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Init Asset/Liab Weight"
                                    value={`${formattedBankValues.initAssetWeight} /
                              ${formattedBankValues.initLiabWeight}`}
                                    proposedValue={
                                      (suggestedFields.initAssetWeight ||
                                        suggestedFields.initLiabWeight) &&
                                      `${
                                        suggestedFields.initAssetWeight ||
                                        formattedBankValues.initAssetWeight
                                      } /
                              ${
                                suggestedFields.initLiabWeight ||
                                formattedBankValues.initLiabWeight
                              }`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Scaled Init Asset/Liab Weight"
                                    value={`${formattedBankValues.scaledInitAssetWeight} / ${formattedBankValues.scaledInitLiabWeight}`}
                                  />
                                  <KeyValuePair
                                    label="Deposit weight scale start quote"
                                    value={`$${formattedBankValues.depositWeightScale}`}
                                    proposedValue={
                                      suggestedFields.depositWeightScale &&
                                      `$${suggestedFields.depositWeightScale}`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Borrow weight scale start quote"
                                    value={`$${formattedBankValues.borrowWeightScale}`}
                                    proposedValue={
                                      suggestedFields.borrowWeightScale &&
                                      `$${suggestedFields.borrowWeightScale}`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Rate params"
                                    value={
                                      <span className="text-right">
                                        {`${formattedBankValues.rate0}% @ ${formattedBankValues.util0}% util, `}
                                        {`${formattedBankValues.rate1}% @ ${formattedBankValues.util1}% util, `}
                                        {`${formattedBankValues.maxRate}% @ 100% util`}
                                      </span>
                                    }
                                    proposedValue={
                                      (suggestedFields.rate0 ||
                                        suggestedFields.rate1 ||
                                        suggestedFields.util0 ||
                                        suggestedFields.util1 ||
                                        suggestedFields.maxRate) && (
                                        <span className="text-right">
                                          {`${
                                            suggestedFields.rate0 ||
                                            formattedBankValues.rate0
                                          }% @ ${
                                            suggestedFields.util0 ||
                                            formattedBankValues.util0
                                          }% util, `}
                                          {`${
                                            suggestedFields.rate1 ||
                                            formattedBankValues.rate1
                                          }% @ ${
                                            suggestedFields.util1 ||
                                            formattedBankValues.util1
                                          }% util, `}
                                          {`${
                                            suggestedFields.maxRate ||
                                            formattedBankValues.maxRate
                                          }% @ 100% util`}
                                        </span>
                                      )
                                    }
                                  />
                                  <KeyValuePair
                                    label="Adjustment factor"
                                    value={`${formattedBankValues.adjustmentFactor}%`}
                                    proposedValue={
                                      suggestedFields.adjustmentFactor &&
                                      `${suggestedFields.adjustmentFactor}%`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Deposit rate"
                                    value={`${formattedBankValues.depositRate}%`}
                                  />
                                  <KeyValuePair
                                    label="Borrow rate"
                                    value={`${formattedBankValues.borrowRate}%`}
                                  />
                                  <KeyValuePair
                                    label="Last index update"
                                    value={formattedBankValues.lastIndexUpdate}
                                  />
                                  <KeyValuePair
                                    label="Last rates updated"
                                    value={formattedBankValues.lastRatesUpdate}
                                  />
                                  <KeyValuePair
                                    label="Oracle: Conf Filter"
                                    value={`${formattedBankValues.oracleConfFilter}%`}
                                    proposedValue={
                                      suggestedFields.oracleConfFilter &&
                                      `${suggestedFields.oracleConfFilter}%`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Oracle: Max Staleness"
                                    value={`${bank.oracleConfig.maxStalenessSlots} slots`}
                                    proposedValue={
                                      suggestedFields.maxStalenessSlots &&
                                      `${suggestedFields.maxStalenessSlots} slots`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Group Insurance Fund"
                                    value={`${mintInfo!.groupInsuranceFund}`}
                                  />
                                  <KeyValuePair
                                    label="Min vault to deposits ratio"
                                    value={`${formattedBankValues.minVaultToDepositsRatio}%`}
                                    proposedValue={
                                      suggestedFields.minVaultToDepositsRatio &&
                                      `${suggestedFields.minVaultToDepositsRatio}%`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Net borrows in window / Net borrow limit per window quote"
                                    value={`$${formattedBankValues.minVaultToDepositsRatio} / $${formattedBankValues.netBorrowLimitPerWindowQuote}`}
                                    proposedValue={
                                      (suggestedFields.minVaultToDepositsRatio ||
                                        suggestedFields.netBorrowLimitPerWindowQuote) &&
                                      `$${
                                        suggestedFields.minVaultToDepositsRatio ||
                                        formattedBankValues.minVaultToDepositsRatio
                                      } / $${
                                        suggestedFields.netBorrowLimitPerWindowQuote ||
                                        formattedBankValues.netBorrowLimitPerWindowQuote
                                      }`
                                    }
                                  />
                                  <KeyValuePair
                                    label="Liquidation fee"
                                    value={`${formattedBankValues.liquidationFee}%`}
                                    proposedValue={
                                      suggestedFields.liquidationFee &&
                                      `${suggestedFields.liquidationFee}%`
                                    }
                                  />
                                  {invalidKeys.length && (
                                    <div className="flex items-center p-4">
                                      <div className="mr-auto">
                                        Green values are params that needs to
                                        change suggested by current liquidity
                                      </div>
                                      <Button
                                        onClick={() =>
                                          proposeNewSuggestedValues(
                                            bank,
                                            invalidKeys,
                                            suggestedTier as LISTING_PRESETS_KEYS
                                          )
                                        }
                                        disabled={!wallet.connected}
                                      >
                                        Propose new suggested values
                                      </Button>
                                    </div>
                                  )}
                                </Disclosure.Panel>
                              </>
                            )}
                          </Disclosure>
                        )
                      })
                    )}
                </div>

                <h3 className="mt-6 mb-3 text-base text-th-fgd-3">
                  Perp Markets
                </h3>
                <div className="border-b border-th-bkg-3">
                  {Array.from(group.perpMarketsMapByOracle)
                    .filter(
                      ([_, perpMarket]) => !perpMarket.name.includes('OLD')
                    )
                    .map(([oracle, perpMarket]) => {
                      return (
                        <Disclosure key={oracle.toString()}>
                          {({ open }) => (
                            <>
                              <Disclosure.Button
                                aria-label="panel"
                                className={`flex w-full items-center justify-between border-t border-th-bkg-3 p-4 md:hover:bg-th-bkg-2 ${
                                  open ? 'bg-th-bkg-2' : ''
                                }`}
                              >
                                <div className="flex items-center">
                                  <MarketLogos market={perpMarket} />
                                  <p className="text-th-fgd-2">
                                    {perpMarket.name}
                                  </p>
                                </div>
                                <ChevronDownIcon
                                  className={`${
                                    open ? 'rotate-180' : 'rotate-360'
                                  } h-5 w-5 text-th-fgd-3`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel>
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
                                  label="Base Decimals"
                                  value={perpMarket.baseDecimals}
                                />
                                <KeyValuePair
                                  label="Reduce Only"
                                  value={
                                    perpMarket.reduceOnly ? 'True' : 'False'
                                  }
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
                                  label="Last stable price updated"
                                  value={new Date(
                                    1000 *
                                      perpMarket.stablePriceModel.lastUpdateTimestamp.toNumber()
                                  ).toUTCString()}
                                />
                                <KeyValuePair
                                  label="Stable Price: delay interval"
                                  value={`${perpMarket.stablePriceModel.delayIntervalSeconds}s`}
                                />
                                <KeyValuePair
                                  label="Stable Price: growth limits"
                                  value={`${(
                                    100 *
                                    perpMarket.stablePriceModel.delayGrowthLimit
                                  ).toFixed(2)}% delay / ${(
                                    100 *
                                    perpMarket.stablePriceModel
                                      .stableGrowthLimit
                                  ).toFixed(2)}% stable`}
                                />
                                <KeyValuePair
                                  label="Open Interest"
                                  value={`${perpMarket.openInterest} lots ($${(
                                    perpMarket.baseLotsToUi(
                                      perpMarket.openInterest
                                    ) * perpMarket.uiPrice
                                  ).toFixed(2)})`}
                                />
                                <KeyValuePair
                                  label="Lot Sizes"
                                  value={`${perpMarket.baseLotSize} base /
                          ${
                            perpMarket.quoteLotSize
                          } quote (tick size: $${perpMarket.priceLotsToUi(
                                    new BN(1)
                                  )}, 1 base lot: $${(
                                    perpMarket.baseLotsToUi(new BN(1)) *
                                    perpMarket.uiPrice
                                  ).toFixed(3)})`}
                                />
                                <KeyValuePair
                                  label="Maint Asset/Liab Weight"
                                  value={`${perpMarket.maintBaseAssetWeight.toFixed(
                                    4
                                  )}/
                          ${perpMarket.maintBaseLiabWeight.toFixed(
                            4
                          )} (maint leverage: ${(
                                    1 /
                                    (perpMarket.maintBaseLiabWeight.toNumber() -
                                      1)
                                  ).toFixed(2)}x, init leverage: ${(
                                    1 /
                                    (perpMarket.initBaseLiabWeight.toNumber() -
                                      1)
                                  ).toFixed(2)}x)`}
                                />
                                <KeyValuePair
                                  label="Init Asset/Liab Weight"
                                  value={`${perpMarket.initBaseAssetWeight.toFixed(
                                    4
                                  )}/
                          ${perpMarket.initBaseLiabWeight.toFixed(4)}`}
                                />
                                <KeyValuePair
                                  label="Base liquidation fee"
                                  value={`${(
                                    10000 *
                                    perpMarket.baseLiquidationFee.toNumber()
                                  ).toFixed(2)} bps`}
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
                                  label="Funding impacty quantity"
                                  value={`${perpMarket.impactQuantity.toNumber()} ($${(
                                    perpMarket.baseLotsToUi(
                                      perpMarket.impactQuantity
                                    ) * perpMarket.uiPrice
                                  ).toFixed(2)})`}
                                />
                                <KeyValuePair
                                  label="Fees Accrued"
                                  value={`$${toUiDecimals(
                                    perpMarket.feesAccrued,
                                    6
                                  ).toFixed(2)}`}
                                />
                                <KeyValuePair
                                  label="Fees Settled"
                                  value={`$${toUiDecimals(
                                    perpMarket.feesSettled,
                                    6
                                  )}`}
                                />
                                <KeyValuePair
                                  label="Oracle: Conf Filter"
                                  value={`${(
                                    100 *
                                    perpMarket.oracleConfig.confFilter.toNumber()
                                  ).toFixed(2)}%`}
                                />
                                <KeyValuePair
                                  label="Oracle: Max Staleness"
                                  value={`${perpMarket.oracleConfig.maxStalenessSlots} slots`}
                                />
                                <KeyValuePair
                                  label="Group Insurance Fund"
                                  value={`${perpMarket.groupInsuranceFund}`}
                                />
                                <KeyValuePair
                                  label="Fee penalty"
                                  value={`$${toUiDecimals(
                                    perpMarket.feePenalty,
                                    6
                                  )}`}
                                />
                                <KeyValuePair
                                  label="Settle fee flat"
                                  value={`$${toUiDecimals(
                                    perpMarket.settleFeeFlat,
                                    6
                                  )}`}
                                />
                                <KeyValuePair
                                  label="Settle fee amount threshold"
                                  value={`$${toUiDecimals(
                                    perpMarket.settleFeeAmountThreshold,
                                    6
                                  )}`}
                                />
                                <KeyValuePair
                                  label="Settle fee fraction low health"
                                  value={`${perpMarket.settleFeeFractionLowHealth.toFixed(
                                    4
                                  )}`}
                                />
                                <KeyValuePair
                                  label="Settle pnl limit factor"
                                  value={`${perpMarket.settlePnlLimitFactor}`}
                                />
                                <KeyValuePair
                                  label="Settle pnl limit window size"
                                  value={`${perpMarket.settlePnlLimitWindowSizeTs.toNumber()} secs`}
                                />
                                <KeyValuePair
                                  label="Maint overall asset weight"
                                  value={`${perpMarket.maintOverallAssetWeight.toNumber()}`}
                                />
                                <KeyValuePair
                                  label="Init overall asset weight"
                                  value={`${perpMarket.initOverallAssetWeight.toNumber()}`}
                                />
                                <KeyValuePair
                                  label="Positive pnl liquidation fee"
                                  value={`${(
                                    10000 *
                                    perpMarket.positivePnlLiquidationFee.toNumber()
                                  ).toFixed(
                                    2
                                  )} bps (${perpMarket.positivePnlLiquidationFee
                                    .div(perpMarket.baseLiquidationFee)
                                    .toNumber()
                                    .toFixed(2)}x of Base liquidation fee)`}
                                />
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>
                      )
                    })}
                </div>
                <h3 className="mt-6 mb-3 text-base text-th-fgd-3">
                  Spot Markets
                </h3>
                <div className="border-b border-th-bkg-3">
                  {Array.from(group.serum3MarketsMapByExternal.values()).map(
                    (market) => {
                      const externalMarket = group.getSerum3ExternalMarket(
                        market.serumMarketExternal
                      )
                      return (
                        <Disclosure key={market.marketIndex}>
                          {({ open }) => (
                            <>
                              <Disclosure.Button
                                aria-label="panel"
                                className={`flex w-full items-center justify-between border-t border-th-bkg-3 p-4 md:hover:bg-th-bkg-2 ${
                                  open ? 'bg-th-bkg-2' : ''
                                }`}
                              >
                                <div className="flex items-center">
                                  <MarketLogos market={market} />
                                  <p className="text-th-fgd-2">{market.name}</p>
                                </div>
                                <ChevronDownIcon
                                  className={`${
                                    open ? 'rotate-180' : 'rotate-360'
                                  } h-5 w-5 text-th-fgd-3`}
                                />
                              </Disclosure.Button>
                              <Disclosure.Panel>
                                <KeyValuePair
                                  label="Public Key"
                                  value={
                                    <ExplorerLink
                                      address={market.publicKey.toString()}
                                      anchorData
                                    />
                                  }
                                />
                                <KeyValuePair
                                  label="Serum Market External Public Key"
                                  value={
                                    <ExplorerLink
                                      address={market.serumMarketExternal.toString()}
                                    />
                                  }
                                />
                                <KeyValuePair
                                  label="Base Mint"
                                  value={
                                    <ExplorerLink
                                      address={externalMarket.baseMintAddress.toString()}
                                    />
                                  }
                                />
                                <KeyValuePair
                                  label="Quote Mint"
                                  value={
                                    <ExplorerLink
                                      address={externalMarket.quoteMintAddress.toString()}
                                    />
                                  }
                                />
                                <KeyValuePair
                                  label="Base Token Index"
                                  value={market.baseTokenIndex}
                                />
                                <KeyValuePair
                                  label="Quote Token Index"
                                  value={market.quoteTokenIndex}
                                />
                                <KeyValuePair
                                  label="Min Order Size"
                                  value={externalMarket.minOrderSize}
                                />
                                <KeyValuePair
                                  label="Tick Size"
                                  value={externalMarket.tickSize}
                                />
                                <KeyValuePair
                                  label="Max Bid Leverage"
                                  value={`${market
                                    .maxBidLeverage(group)
                                    .toFixed(1)}x`}
                                />
                                <KeyValuePair
                                  label="Max Ask Leverage"
                                  value={`${market
                                    .maxAskLeverage(group)
                                    .toFixed(1)}x`}
                                />
                                <KeyValuePair
                                  label="Reduce Only"
                                  value={market.reduceOnly ? 'True' : 'False'}
                                />
                                <KeyValuePair
                                  label="Force Close"
                                  value={market.forceClose ? 'True' : 'False'}
                                />
                                <KeyValuePair
                                  label="Maker/Taker Fees"
                                  value={`${market.getFeeRates(
                                    false
                                  )}/${market.getFeeRates(true)}`}
                                />
                              </Disclosure.Panel>
                            </>
                          )}
                        </Disclosure>
                      )
                    }
                  )}
                </div>
              </div>
            ) : (
              'Loading'
            )}
          </div>
        </div>
      </div>
    </GovernancePageWrapper>
  )
}

const KeyValuePair = ({
  label,
  value,
  proposedValue,
}: {
  label: string
  value: number | ReactNode | string
  proposedValue?: number | ReactNode | string
}) => {
  return (
    <div className="flex items-center justify-between border-t border-th-bkg-2 px-6 py-3">
      <span className="mr-4 flex flex-col whitespace-nowrap text-th-fgd-3">
        {label}
      </span>
      <span className="flex flex-col font-mono text-th-fgd-2">
        <div>
          {proposedValue && <span>Current: </span>}
          <span className={`${proposedValue ? 'text-th-warning' : ''}`}>
            {value}
          </span>
        </div>
        <div>
          {proposedValue && <span>Suggested: </span>}
          <span>
            {proposedValue && (
              <span className="text-th-success">{proposedValue}</span>
            )}
          </span>
        </div>
      </span>
    </div>
  )
}

type Vault = {
  amount: BN
}

const VaultData = ({ bank }: { bank: Bank }) => {
  const [vault, setVault] = useState<Vault>()
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

export const DashboardNavbar = () => {
  const { asPath } = useRouter()

  return (
    <div className="mt-4 mb-2 flex border border-th-bkg-3">
      <div>
        <Link href={'/dashboard'} shallow={true}>
          <h4
            className={`${
              asPath === '/dashboard' ? 'bg-th-bkg-2 text-th-active' : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Group
          </h4>
        </Link>
      </div>
      <div>
        <Link href={'/dashboard/risks'} shallow={true}>
          <h4
            className={`${
              asPath === '/dashboard/risks' ? 'bg-th-bkg-2 text-th-active' : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Risks
          </h4>
        </Link>
      </div>
      <div>
        <Link
          href={
            '/dashboard/mangoaccount?address=DNjtajTW6PZps3gCerWEPBRvu1vZPEieVEoqXFrXWn3k'
          }
          shallow={true}
        >
          <h4
            className={`${
              asPath.includes('/dashboard/mangoaccount')
                ? 'bg-th-bkg-2 text-th-active'
                : ''
            } cursor-pointer border-r border-th-bkg-3 px-6 py-4`}
          >
            Mango Account
          </h4>
        </Link>
      </div>
    </div>
  )
}

const getNullOrVal = (val: number | undefined) => {
  if (val !== undefined) {
    return val
  }

  return null
}

export default Dashboard
