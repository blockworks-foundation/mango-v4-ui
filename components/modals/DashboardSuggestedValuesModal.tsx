import { ReactNode, useCallback, useEffect, useState } from 'react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import {
  LISTING_PRESETS,
  LISTING_PRESETS_KEYS,
  formatSuggestedValues,
  getFormattedBankValues,
} from 'utils/governance/listingTools'
import { Bank, Group } from '@blockworks-foundation/mango-v4'
import { AccountMeta } from '@solana/web3.js'
import { BN } from '@project-serum/anchor'
import {
  MANGO_DAO_WALLET,
  MANGO_DAO_WALLET_GOVERNANCE,
} from 'utils/governance/constants'
import { createProposal } from 'utils/governance/instructions/createProposal'
import { notify } from 'utils/notifications'
import Button from '@components/shared/Button'
import { compareObjectsAndGetDifferentKeys } from 'utils/governance/tools'
import { Disclosure } from '@headlessui/react'

const DashboardSuggestedValues = ({
  isOpen,
  onClose,
  bank,
  group,
}: ModalProps & {
  bank: Bank
  group: Group
}) => {
  const client = mangoStore((s) => s.client)
  //do not deconstruct wallet is used for anchor to sign
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
    type PriceImpactRespWithoutSide = Omit<PriceImpactResp, 'side'>
    const resp = await fetch(
      'https://api.mngo.cloud/data/v4/risk/listed-tokens-one-week-price-impacts',
    )
    const jsonReps = (await resp.json()) as PriceImpactResp[]
    const filteredResp = jsonReps
      .reduce((acc: PriceImpactRespWithoutSide[], val: PriceImpactResp) => {
        if (val.side === 'ask') {
          const bidSide = jsonReps.find(
            (x) =>
              x.symbol === val.symbol &&
              x.target_amount === val.target_amount &&
              x.side === 'bid',
          )
          acc.push({
            target_amount: val.target_amount,
            avg_price_impact_percent: bidSide
              ? (bidSide.avg_price_impact_percent +
                  val.avg_price_impact_percent) /
                2
              : val.avg_price_impact_percent,
            symbol: val.symbol,
          })
        }
        return acc
      }, [])
      .filter((x) => x.avg_price_impact_percent < 1)
      .reduce(
        (
          acc: { [key: string]: PriceImpactRespWithoutSide },
          val: PriceImpactRespWithoutSide,
        ) => {
          if (
            !acc[val.symbol] ||
            val.target_amount > acc[val.symbol].target_amount
          ) {
            acc[val.symbol] = val
          }
          return acc
        },
        {},
      )
    const suggestedTiers = Object.keys(filteredResp).reduce(
      (acc: { [key: string]: string | undefined }, key: string) => {
        acc[key] = Object.values(LISTING_PRESETS).find(
          (x) => x.target_amount === filteredResp[key].target_amount,
        )?.preset_key
        return acc
      },
      {},
    )

    setSuggestedTiers(suggestedTiers)
  }, [])

  const proposeNewSuggestedValues = useCallback(
    async (
      bank: Bank,
      invalidFieldsKeys: string[],
      tokenTier: LISTING_PRESETS_KEYS,
    ) => {
      const proposalTx = []
      const mintInfo = group!.mintInfosMapByTokenIndex.get(bank.tokenIndex)!
      const preset = LISTING_PRESETS[tokenTier]
      const fieldsToChange = invalidFieldsKeys.reduce(
        (obj, key) => ({ ...obj, [key]: preset[key as keyof typeof preset] }),
        {},
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
          bank.reduceOnly ? 0 : null,
          null,
          null,
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
          vsrClient!,
        )
        window.open(
          `https://dao.mango.markets/dao/MNGO/proposal/${proposalAddress.toBase58()}`,
          '_blank',
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
    ],
  )

  const extractTokenTierForName = (
    suggestedTokenObj: Partial<{
      [key: string]: string
    }>,
    tier: string,
  ) => {
    if (tier === 'ETH (Portal)') {
      return suggestedTokenObj['ETH']
    }
    return suggestedTokenObj[tier]
  }

  useEffect(() => {
    getSuggestedTierForListedTokens()
  }, [getSuggestedTierForListedTokens])

  const mintInfo = group.mintInfosMapByMint.get(bank.mint.toString())

  const formattedBankValues = getFormattedBankValues(group, bank)

  const suggestedTier = extractTokenTierForName(suggestedTiers, bank.name)
    ? extractTokenTierForName(suggestedTiers, bank.name)!
    : 'SHIT'

  const suggestedVaules = LISTING_PRESETS[suggestedTier as LISTING_PRESETS_KEYS]
  const suggestedFormattedPreset = formatSuggestedValues(suggestedVaules)

  type SuggestedFormattedPreset = typeof suggestedFormattedPreset

  const invalidKeys: (keyof SuggestedFormattedPreset)[] = Object.keys(
    suggestedVaules,
  ).length
    ? compareObjectsAndGetDifferentKeys<SuggestedFormattedPreset>(
        formattedBankValues,
        suggestedFormattedPreset,
      ).filter(
        (x: string) =>
          suggestedFormattedPreset[x as keyof SuggestedFormattedPreset],
      )
    : []

  const suggestedFields: Partial<SuggestedFormattedPreset> = invalidKeys.reduce(
    (obj, key) => {
      return {
        ...obj,
        [key]: suggestedFormattedPreset[key],
      }
    },
    {},
  )

  return (
    <Modal
      panelClassNames={' !max-w-[800px]'}
      isOpen={isOpen}
      onClose={onClose}
    >
      <h3 className="mb-6">{bank.name}</h3>
      <div className="flex flex-col max-h-[600px] w-full overflow-auto">
        <Disclosure.Panel>
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
                  {`${suggestedFields.rate0 || formattedBankValues.rate0}% @ ${
                    suggestedFields.util0 || formattedBankValues.util0
                  }% util, `}
                  {`${suggestedFields.rate1 || formattedBankValues.rate1}% @ ${
                    suggestedFields.util1 || formattedBankValues.util1
                  }% util, `}
                  {`${
                    suggestedFields.maxRate || formattedBankValues.maxRate
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
        </Disclosure.Panel>

        {invalidKeys.length && (
          <div className="flex items-center p-4">
            <p className="mr-auto ">
              Green values are params that needs to change suggested by current
              liquidity
            </p>
            <Button
              onClick={() =>
                proposeNewSuggestedValues(
                  bank,
                  invalidKeys,
                  suggestedTier as LISTING_PRESETS_KEYS,
                )
              }
              disabled={!wallet.connected}
            >
              Propose new suggested values
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default DashboardSuggestedValues

const getNullOrVal = (val: number | undefined) => {
  if (val !== undefined) {
    return val
  }

  return null
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
