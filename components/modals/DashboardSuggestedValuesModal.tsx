import { ReactNode, useCallback, useEffect, useState } from 'react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { useWallet } from '@solana/wallet-adapter-react'
import GovernanceStore from '@store/governanceStore'
import {
  formatSuggestedValues,
  getApiTokenName,
  getFormattedBankValues,
} from 'utils/governance/listingTools'
import {
  Bank,
  Group,
  OracleProvider,
  toUiDecimals,
} from '@blockworks-foundation/mango-v4'
import { AccountMeta, Transaction } from '@solana/web3.js'
import { BN } from '@project-serum/anchor'
import {
  MANGO_DAO_WALLET,
  MANGO_DAO_WALLET_GOVERNANCE,
} from 'utils/governance/constants'
import { createProposal } from 'utils/governance/instructions/createProposal'
import { notify } from 'utils/notifications'
import Button from '@components/shared/Button'
import {
  compareObjectsAndGetDifferentKeys,
  tryGetPubKey,
} from 'utils/governance/tools'
import { Disclosure } from '@headlessui/react'
import {
  LISTING_PRESET,
  LISTING_PRESETS,
  LISTING_PRESETS_KEY,
  MidPriceImpact,
  getPresetWithAdjustedDepositLimit,
  getPresetWithAdjustedNetBorrows,
} from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'
import Select from '@components/forms/Select'
import Loading from '@components/shared/Loading'
import Label from '@components/forms/Label'
import Input from '@components/forms/Input'
import Switch from '@components/forms/Switch'

const DashboardSuggestedValues = ({
  isOpen,
  onClose,
  bank,
  group,
  suggestedTierKey,
  currentTier,
  midPriceImp,
}: ModalProps & {
  bank: Bank
  group: Group
  suggestedTierKey: LISTING_PRESETS_KEY
  currentTier: LISTING_PRESET | undefined
  midPriceImp: MidPriceImpact[]
}) => {
  const client = mangoStore((s) => s.client)
  //do not deconstruct wallet is used for anchor to sign
  const wallet = useWallet()
  const connection = mangoStore((s) => s.connection)
  const fee = mangoStore((s) => s.priorityFee)
  const voter = GovernanceStore((s) => s.voter)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const proposals = GovernanceStore((s) => s.proposals)
  const [oracle, setOracle] = useState('')
  const [forcePythOracle, setForcePythOracle] = useState(false)
  const PRESETS = LISTING_PRESETS

  const [proposedTier, setProposedTier] =
    useState<LISTING_PRESETS_KEY>(suggestedTierKey)
  const [proposing, setProposing] = useState(false)

  useEffect(() => {
    setForcePythOracle(bank?.oracleProvider === OracleProvider.Pyth)
  }, [bank.oracleProvider])

  const proposeNewSuggestedValues = useCallback(
    async (
      bank: Bank,
      invalidFieldsKeys: string[],
      tokenTier: LISTING_PRESETS_KEY,
    ) => {
      const proposalTx = []
      const mintInfo = group!.mintInfosMapByTokenIndex.get(bank.tokenIndex)!
      const preset = getPresetWithAdjustedDepositLimit(
        getPresetWithAdjustedNetBorrows(
          PRESETS[tokenTier],
          bank.uiDeposits(),
          bank.uiPrice,
          toUiDecimals(PRESETS[tokenTier].netBorrowLimitPerWindowQuote, 6),
        ),
        bank.uiPrice,
        bank.mintDecimals,
      )
      console.log(preset)

      const fieldsToChange = invalidFieldsKeys.reduce(
        (obj, key) => ({ ...obj, [key]: preset[key as keyof typeof preset] }),
        {},
      ) as Partial<typeof preset>

      const oracleConfFilter =
        fieldsToChange.oracleConfFilter === undefined
          ? null
          : fieldsToChange.oracleConfFilter
      const maxStalenessSlots =
        (fieldsToChange.maxStalenessSlots as number | string) === '' ||
        fieldsToChange.maxStalenessSlots === -1
          ? null
          : fieldsToChange.maxStalenessSlots

      const isThereNeedOfSendingOracleConfig =
        bank.oracleConfig.confFilter.toNumber() !== oracleConfFilter ||
        bank.oracleConfig.maxStalenessSlots.toNumber() !== maxStalenessSlots
      const rateConfigs = {
        adjustmentFactor: getNullOrVal(fieldsToChange.adjustmentFactor),
        util0: getNullOrVal(fieldsToChange.util0),
        rate0: getNullOrVal(fieldsToChange.rate0),
        util1: getNullOrVal(fieldsToChange.util1),
        rate1: getNullOrVal(fieldsToChange.rate1),
        maxRate: getNullOrVal(fieldsToChange.maxRate),
      }

      const isThereNeedOfSendingRateConfigs = Object.values(rateConfigs).filter(
        (x) => x !== null,
      ).length
      const ix = await client!.program.methods
        .tokenEdit(
          oracle ? tryGetPubKey(oracle) : null,
          isThereNeedOfSendingOracleConfig
            ? {
                confFilter:
                  fieldsToChange.oracleConfFilter === undefined
                    ? bank.oracleConfig.confFilter.toNumber()
                    : fieldsToChange.oracleConfFilter,
                maxStalenessSlots:
                  fieldsToChange.maxStalenessSlots === undefined
                    ? bank.oracleConfig.maxStalenessSlots.toNumber() === -1
                      ? null
                      : bank.oracleConfig.maxStalenessSlots.toNumber()
                    : fieldsToChange.maxStalenessSlots === -1
                    ? null
                    : fieldsToChange.maxStalenessSlots,
              }
            : null,
          fieldsToChange.groupInsuranceFund === undefined
            ? null
            : fieldsToChange.groupInsuranceFund,
          isThereNeedOfSendingRateConfigs
            ? {
                adjustmentFactor:
                  fieldsToChange.adjustmentFactor ||
                  bank.adjustmentFactor.toNumber(),
                util0: fieldsToChange.util0 || bank.util0.toNumber(),
                rate0: fieldsToChange.rate0 || bank.rate0.toNumber(),
                util1: fieldsToChange.util1 || bank.util1.toNumber(),
                rate1: fieldsToChange.rate1 || bank.rate1.toNumber(),
                maxRate: fieldsToChange.maxRate || bank.maxRate.toNumber(),
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
          getNullOrVal(fieldsToChange.borrowWeightScaleStartQuote),
          getNullOrVal(fieldsToChange.depositWeightScaleStartQuote),
          false,
          false,
          getNullOrVal(fieldsToChange.reduceOnly),
          null,
          null,
          getNullOrVal(fieldsToChange.tokenConditionalSwapTakerFeeRate),
          getNullOrVal(fieldsToChange.tokenConditionalSwapMakerFeeRate),
          getNullOrVal(fieldsToChange.flashLoanSwapFeeRate),
          //do not edit of interest curve scaling
          null,
          getNullOrVal(fieldsToChange.interestTargetUtilization),
          null,
          null,
          null,
          null,
          false,
          false,
          getNullOrVal(fieldsToChange.depositLimit) !== null
            ? new BN(fieldsToChange.depositLimit!.toString())
            : null,
          getNullOrVal(fieldsToChange.zeroUtilRate),
          getNullOrVal(fieldsToChange.platformLiquidationFee),
          fieldsToChange.disableAssetLiquidation === undefined
            ? null
            : fieldsToChange.disableAssetLiquidation,
          getNullOrVal(fieldsToChange.collateralFeePerDay),
          null,
        )
        .accounts({
          group: group!.publicKey,
          fallbackOracle: bank.fallbackOracle,
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
        setProposing(true)
        const simTransaction = new Transaction({ feePayer: wallet.publicKey })
        simTransaction.add(...proposalTx)
        const simulation = await connection.simulateTransaction(simTransaction)

        if (!simulation.value.err) {
          const index = proposals ? Object.values(proposals).length : 0
          const proposalAddress = await createProposal(
            connection,
            client,
            walletSigner,
            MANGO_DAO_WALLET_GOVERNANCE,
            voter.tokenOwnerRecord!,
            `Edit token ${bank.name}`,
            'Adjust settings to current liquidity',
            index,
            proposalTx,
            vsrClient!,
            fee,
          )
          window.open(
            `https://dao.mango.markets/dao/MNGO/proposal/${proposalAddress.toBase58()}`,
            '_blank',
          )
        } else {
          throw simulation.value.logs
        }
      } catch (e) {
        notify({
          title: 'Error during proposal creation',
          description: `${e}`,
          type: 'error',
        })
      }
      setProposing(false)
    },
    [
      PRESETS,
      client,
      connection,
      fee,
      group,
      oracle,
      proposals,
      voter.tokenOwnerRecord,
      vsrClient,
      wallet,
    ],
  )

  const mintInfo = group.mintInfosMapByMint.get(bank.mint.toString())

  const formattedBankValues = getFormattedBankValues(group, bank)

  const suggestedValues = getPresetWithAdjustedDepositLimit(
    getPresetWithAdjustedNetBorrows(
      PRESETS[proposedTier as LISTING_PRESETS_KEY] as LISTING_PRESET,
      bank.uiDeposits(),
      bank.uiPrice,
      toUiDecimals(
        PRESETS[proposedTier as LISTING_PRESETS_KEY]
          .netBorrowLimitPerWindowQuote,
        6,
      ),
    ),
    bank.uiPrice,
    bank.mintDecimals,
  )

  const suggestedFormattedPreset = formatSuggestedValues(suggestedValues)

  type SuggestedFormattedPreset = typeof suggestedFormattedPreset

  const invalidKeys: (keyof SuggestedFormattedPreset)[] = Object.keys(
    suggestedValues,
  ).length
    ? compareObjectsAndGetDifferentKeys<SuggestedFormattedPreset>(
        formattedBankValues,
        suggestedFormattedPreset,
      ).filter(
        (x: string) =>
          suggestedFormattedPreset[x as keyof SuggestedFormattedPreset] !==
            undefined &&
          suggestedFormattedPreset[x as keyof SuggestedFormattedPreset] !==
            null,
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
    <Modal panelClassNames="!max-w-[800px]" isOpen={isOpen} onClose={onClose}>
      <h3 className="mb-6">
        <span>
          {bank.name} - Suggested tier: {PRESETS[suggestedTierKey].preset_name}{' '}
          Current tier: ~ {currentTier?.preset_name}
        </span>
        <div className="py-4">
          <p className="mb-2">
            I want to use pyth oracle (will show presets available for pyth)
          </p>
          <Switch
            checked={forcePythOracle}
            onChange={(checked) => setForcePythOracle(checked)}
          />
        </div>
        <Select
          value={PRESETS[proposedTier].preset_name}
          onChange={(tier: LISTING_PRESETS_KEY) => setProposedTier(tier)}
          className="w-full"
        >
          {Object.keys(PRESETS).map((name) => (
            <Select.Option key={name} value={name}>
              <div className="flex w-full items-center justify-between">
                {PRESETS[name as LISTING_PRESETS_KEY].preset_name}{' '}
                {`{${PRESETS[name as LISTING_PRESETS_KEY].preset_key}}`}
                {name === suggestedTierKey ? ' - suggested' : ''}
              </div>
            </Select.Option>
          ))}
        </Select>
      </h3>
      <div className="flex w-full flex-col">
        <div className="p-4">
          <div className="mb-2">
            <Label text="Oracle pk (Leave empty if no change)" />
            <Input
              type="text"
              value={oracle}
              onChange={(e) => {
                setOracle(e.target.value)
              }}
            />
            {oracle !== '' && !tryGetPubKey(oracle) && (
              <div className="text-th-error">Invalid publickey</div>
            )}
          </div>
        </div>
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
            value={`$${formattedBankValues.depositWeightScaleStartQuote}`}
            proposedValue={
              suggestedFields.depositWeightScaleStartQuote &&
              `$${suggestedFields.depositWeightScaleStartQuote}`
            }
          />
          <KeyValuePair
            label="Borrow weight scale start quote"
            value={`$${formattedBankValues.borrowWeightScaleStartQuote}`}
            proposedValue={
              suggestedFields.borrowWeightScaleStartQuote &&
              `$${suggestedFields.borrowWeightScaleStartQuote}`
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
            value={`$${formattedBankValues.netBorrowsInWindow} / $${formattedBankValues.netBorrowLimitPerWindowQuote}`}
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
          <KeyValuePair
            label="Group Insurance Fund"
            value={`${formattedBankValues.groupInsuranceFund}`}
            proposedValue={
              suggestedFields.groupInsuranceFund !== undefined &&
              `${suggestedFields.groupInsuranceFund}`
            }
          />
          <KeyValuePair
            label="Net Borrow Limit Window Size Ts"
            value={`${formattedBankValues.netBorrowLimitWindowSizeTs}`}
            proposedValue={
              suggestedFields.netBorrowLimitWindowSizeTs !== undefined &&
              `${suggestedFields.netBorrowLimitWindowSizeTs}`
            }
          />
          <KeyValuePair
            label="Stable Price Delay Interval Seconds"
            value={`${formattedBankValues.stablePriceDelayIntervalSeconds}`}
            proposedValue={
              suggestedFields.stablePriceDelayIntervalSeconds !== undefined &&
              `${suggestedFields.stablePriceDelayIntervalSeconds}`
            }
          />
          <KeyValuePair
            label="Stable Price Growth Limit"
            value={`${formattedBankValues.stablePriceGrowthLimit}`}
            proposedValue={
              suggestedFields.stablePriceGrowthLimit !== undefined &&
              `${suggestedFields.stablePriceGrowthLimit}`
            }
          />
          <KeyValuePair
            label="Stable Price Delay Growth Limit"
            value={`${formattedBankValues.stablePriceDelayGrowthLimit}`}
            proposedValue={
              suggestedFields.stablePriceDelayGrowthLimit !== undefined &&
              `${suggestedFields.stablePriceDelayGrowthLimit}`
            }
          />
          <KeyValuePair
            label="Token Conditional Swap Taker Fee Rate"
            value={`${formattedBankValues.tokenConditionalSwapTakerFeeRate}`}
            proposedValue={
              suggestedFields.tokenConditionalSwapTakerFeeRate !== undefined &&
              `${suggestedFields.tokenConditionalSwapTakerFeeRate}`
            }
          />
          <KeyValuePair
            label="Token Conditional Swap Maker Fee Rate"
            value={`${formattedBankValues.tokenConditionalSwapMakerFeeRate}`}
            proposedValue={
              suggestedFields.tokenConditionalSwapMakerFeeRate !== undefined &&
              `${suggestedFields.tokenConditionalSwapMakerFeeRate}`
            }
          />
          <KeyValuePair
            label="Interest Target Utilization"
            value={`${formattedBankValues.interestTargetUtilization}`}
            proposedValue={
              suggestedFields.interestTargetUtilization !== undefined &&
              `${suggestedFields.interestTargetUtilization}`
            }
          />
          <KeyValuePair
            label="Deposit Limit"
            value={`${formattedBankValues.depositLimit}`}
            proposedValue={
              suggestedFields.depositLimit !== undefined &&
              `${toUiDecimals(
                new BN(suggestedFields.depositLimit.toString()),
                bank.mintDecimals,
              )}`
            }
          />
          <KeyValuePair
            label="Flash Loan Swap Fee Rate"
            value={`${formattedBankValues.flashLoanSwapFeeRate}`}
            proposedValue={
              suggestedFields.flashLoanSwapFeeRate !== undefined &&
              `${suggestedFields.flashLoanSwapFeeRate}`
            }
          />
          <KeyValuePair
            label="Reduce Only"
            value={`${formattedBankValues.reduceOnly}`}
            proposedValue={
              suggestedFields.reduceOnly !== undefined &&
              `${suggestedFields.reduceOnly}`
            }
          />
          <KeyValuePair
            label="Zero Util Rate"
            value={`${formattedBankValues.zeroUtilRate} bps`}
            proposedValue={
              suggestedFields.zeroUtilRate &&
              `${suggestedFields.zeroUtilRate} bps`
            }
          />
          <KeyValuePair
            label="Liquidation Fee"
            value={`${formattedBankValues.platformLiquidationFee} bps`}
            proposedValue={
              suggestedFields.platformLiquidationFee &&
              `${suggestedFields.platformLiquidationFee} bps`
            }
          />
          <div>
            <h3 className="mb-4 pl-6">Price impacts</h3>
            {midPriceImp
              .filter((x) => x.symbol === getApiTokenName(bank.name))
              .map((x) => (
                <div className="flex pl-6" key={x.target_amount}>
                  <p className="mr-4 w-[150px] space-x-4">
                    <span>Amount:</span>
                    <span>${x.target_amount}</span>
                  </p>
                  <p className="space-x-4">
                    <span>Price impact:</span>{' '}
                    <span>{x.avg_price_impact_percent.toFixed(3)}%</span>
                  </p>
                </div>
              ))}
          </div>
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
                  proposedTier as LISTING_PRESETS_KEY,
                )
              }
              disabled={!wallet.connected || proposing}
            >
              {proposing ? <Loading></Loading> : 'Propose new suggested values'}
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
