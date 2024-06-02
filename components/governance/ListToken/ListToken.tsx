import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button, { IconButton } from '@components/shared/Button'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import { Token } from 'types/jupiter'
import { handleGetRoutes } from '@components/swap/useQuoteRoutes'
import { JUPITER_PRICE_API_MAINNET, USDC_MINT } from 'utils/constants'
import {
  Connection,
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  Transaction,
} from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  OPENBOOK_PROGRAM_ID,
  toNative,
  toUiDecimals,
} from '@blockworks-foundation/mango-v4'
import {
  MANGO_DAO_FAST_LISTING_GOVERNANCE,
  MANGO_DAO_FAST_LISTING_WALLET,
  MANGO_DAO_WALLET,
  MANGO_DAO_WALLET_GOVERNANCE,
  MANGO_MINT_DECIMALS,
} from 'utils/governance/constants'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/20/solid'
import { createProposal } from 'utils/governance/instructions/createProposal'
import GovernanceStore from '@store/governanceStore'
import { notify } from 'utils/notifications'
import { useTranslation } from 'next-i18next'
import { emptyPk } from 'utils/governance/accounts/vsrAccounts'
import Loading from '@components/shared/Loading'
import ListingSuccess from '../ListingSuccess'
import InlineNotification from '@components/shared/InlineNotification'
import { Disclosure } from '@headlessui/react'
import { abbreviateAddress } from 'utils/formatting'
import { formatNumericValue } from 'utils/numbers'
import useMangoGroup from 'hooks/useMangoGroup'
import { getBestMarket, getOracle } from 'utils/governance/listingTools'
import { fmtTokenAmount, tryGetPubKey } from 'utils/governance/tools'
import OnBoarding from '../OnBoarding'
import CreateOpenbookMarketModal from '@components/modals/CreateOpenbookMarketModal'
import useJupiterMints from 'hooks/useJupiterMints'
import CreateSwitchboardOracleModal from '@components/modals/CreateSwitchboardOracleModal'
import {
  LISTING_PRESETS,
  calculateMarketTradingParams,
  LISTING_PRESET,
  getPresetWithAdjustedDepositLimit,
  LISTING_PRESETS_KEY,
} from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'
import Checkbox from '@components/forms/Checkbox'
import { BN } from '@coral-xyz/anchor'
import Select from '@components/forms/Select'
import { WRAPPED_SOL_MINT } from '@metaplex-foundation/js'
import { struct, u8, publicKey, u64, option } from '@raydium-io/raydium-sdk'

const feeFields = [u64('denominator'), u64('numerator')]
const StakePoolLayout = struct([
  u8('accountType'),
  publicKey('manager'),
  publicKey('staker'),
  publicKey('stakeDepositAuthority'),
  u8('stakeWithdrawBumpSeed'),
  publicKey('validatorList'),
  publicKey('reserveStake'),
  publicKey('poolMint'),
  publicKey('managerFeeAccount'),
  publicKey('tokenProgramId'),
  u64('totalLamports'),
  u64('poolTokenSupply'),
  u64('lastUpdateEpoch'),
  struct(
    [u64('unixTimestamp'), u64('epoch'), publicKey('custodian')],
    'lockup',
  ),
  struct(feeFields, 'epochFee'),
  option(struct(feeFields), 'nextEpochFee'),
  option(publicKey(), 'preferredDepositValidatorVoteAddress'),
  option(publicKey(), 'preferredWithdrawValidatorVoteAddress'),
  struct(feeFields, 'stakeDepositFee'),
  struct(feeFields, 'stakeWithdrawalFee'),
  option(struct(feeFields), 'nextStakeWithdrawalFee'),
  u8('stakeReferralFee'),
  option(publicKey(), 'solDepositAuthority'),
  struct(feeFields, 'solDepositFee'),
  u8('solReferralFee'),
  option(publicKey(), 'solWithdrawAuthority'),
  struct(feeFields, 'solWithdrawalFee'),
  option(struct(feeFields), 'nextSolWithdrawalFee'),
  u64('lastEpochPoolTokenSupply'),
  u64('lastEpochTotalLamports'),
])

type FormErrors = Partial<Record<keyof TokenListForm, string>>

type TokenListForm = {
  mintPk: string
  oraclePk: string
  name: string
  tokenIndex: number
  openBookMarketExternalPk: string
  baseBankPk: string
  quoteBankPk: string
  marketIndex: number
  openBookProgram: string
  marketName: string
  proposalTitle: string
  proposalDescription: string
  listForSwapOnly: boolean
  fastListing: boolean
}

const defaultTokenListFormValues: TokenListForm = {
  mintPk: '',
  oraclePk: '',
  name: '',
  tokenIndex: 0,
  openBookMarketExternalPk: '',
  baseBankPk: '',
  quoteBankPk: '',
  marketIndex: 0,
  openBookProgram: '',
  marketName: '',
  proposalTitle: '',
  proposalDescription: '',
  listForSwapOnly: false,
  fastListing: false,
}

const TWENTY_K_USDC_BASE = '20000000000'

const ListToken = ({ goBack }: { goBack: () => void }) => {
  //do not deconstruct wallet is used for anchor to sign
  const wallet = useWallet()
  const { jupiterTokens } = useJupiterMints()
  const connection = mangoStore((s) => s.connection)
  const client = mangoStore((s) => s.client)
  const { group } = useMangoGroup()
  const voter = GovernanceStore((s) => s.voter)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const governances = GovernanceStore((s) => s.governances)
  const loadingRealm = GovernanceStore((s) => s.loadingRealm)
  const fee = mangoStore((s) => s.priorityFee)
  const loadingVoter = GovernanceStore((s) => s.loadingVoter)
  const proposals = GovernanceStore((s) => s.proposals)
  const refetchProposals = GovernanceStore((s) => s.refetchProposals)
  const getCurrentVotingPower = GovernanceStore((s) => s.getCurrentVotingPower)
  const connectionContext = GovernanceStore((s) => s.connectionContext)
  const { t } = useTranslation(['governance'])

  const [advForm, setAdvForm] = useState<TokenListForm>({
    ...defaultTokenListFormValues,
  })

  const [loadingListingParams, setLoadingListingParams] = useState(false)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [priceImpact, setPriceImpact] = useState<number>(0)
  const [currentTokenInfo, setCurrentTokenInfo] = useState<
    Token | null | undefined
  >(null)
  const [baseTokenPrice, setBaseTokenPrice] = useState<number>(0)
  const [proposalPk, setProposalPk] = useState<string | null>(null)
  const [mint, setMint] = useState('')
  const [creatingProposal, setCreatingProposal] = useState(false)
  const [createOpenbookMarketModal, setCreateOpenbookMarket] = useState(false)
  const [orcaPoolAddress, setOrcaPoolAddress] = useState('')
  const [raydiumPoolAddress, setRaydiumPoolAddress] = useState('')
  const [oracleModalOpen, setOracleModalOpen] = useState(false)
  const [isSolPool, setIsSolPool] = useState(false)
  const presets = LISTING_PRESETS
  const [proposedPresetTargetAmount, setProposedProposedTargetAmount] =
    useState(0)
  const [preset, setPreset] = useState<LISTING_PRESET>(presets.UNTRUSTED)
  const [isLST, setIsLST] = useState(false)
  const [lstStakePoolAddress, setLstStakePoolAddress] = useState('')
  const QUOTE_MINT = isLST ? WRAPPED_SOL_MINT.toBase58() : USDC_MINT

  const proposedPreset = getPresetWithAdjustedDepositLimit(
    preset,
    baseTokenPrice,
    currentTokenInfo?.decimals || 0,
  )

  const suggestedPreset =
    Object.values(presets).find(
      (x) => x.preset_target_amount <= proposedPresetTargetAmount,
    ) || presets.UNTRUSTED

  useEffect(() => {
    if (advForm.fastListing) {
      setAdvForm((prevState) => ({
        ...prevState,
        fastListing: false,
      }))
    }
  }, [preset])

  useEffect(() => {
    const handleOracleUpdate = async () => {
      if (currentTokenInfo) {
        setLoadingListingParams(true)
        const { oraclePk } = await getOracle({
          baseSymbol: currentTokenInfo.symbol,
          quoteSymbol: 'usd',
          connection,
          targetAmount: proposedPreset.preset_target_amount,
        })
        setAdvForm((prevState) => ({
          ...prevState,
          oraclePk: oraclePk || '',
        }))
        setLoadingListingParams(false)
      }
    }
    handleOracleUpdate()
  }, [proposedPreset.preset_name])

  const quoteBank = group?.getFirstBankByMint(new PublicKey(QUOTE_MINT))
  const minVoterWeight = useMemo(
    () =>
      governances
        ? governances[MANGO_DAO_WALLET_GOVERNANCE.toBase58()].account.config
            .minCommunityTokensToCreateProposal
        : new BN(0),
    [governances],
  ) as BN
  const mintVoterWeightNumber = governances
    ? fmtTokenAmount(minVoterWeight, MANGO_MINT_DECIMALS)
    : 0
  const tradingParams = useMemo(() => {
    if (quoteBank && currentTokenInfo) {
      return calculateMarketTradingParams(
        baseTokenPrice,
        quoteBank.uiPrice,
        currentTokenInfo.decimals,
        quoteBank.mintDecimals,
      )
    }
    return {
      baseLots: 0,
      quoteLots: 0,
      minOrderValue: 0,
      baseLotExponent: 0,
      quoteLotExponent: 0,
      minOrderSize: 0,
      priceIncrement: 0,
      priceIncrementRelative: 0,
    }
  }, [quoteBank, currentTokenInfo, baseTokenPrice])

  const handleSetAdvForm = (
    propertyName: string,
    value: string | number | boolean,
  ) => {
    setFormErrors({})
    setAdvForm({ ...advForm, [propertyName]: value })
  }

  const getListingParams = useCallback(
    async (
      tokenInfo: Token,
      quoteMint: string,
      targetAmount: number,
      isLST: boolean,
    ) => {
      setLoadingListingParams(true)
      const [{ oraclePk }, marketPk] = await Promise.all([
        getOracle({
          baseSymbol: tokenInfo.symbol,
          quoteSymbol: 'usd',
          connection,
          targetAmount: targetAmount,
        }),
        getBestMarket({
          baseMint: mint,
          quoteMint: quoteMint,
          cluster: CLUSTER,
          connection,
        }),
      ])

      const index = proposals ? Object.values(proposals).length : 0

      const bankNum = 0

      const [baseBank] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('Bank'),
          group!.publicKey.toBuffer(),
          new BN(index).toArrayLike(Buffer, 'le', 2),
          new BN(bankNum).toArrayLike(Buffer, 'le', 4),
        ],
        client.programId,
      )
      setAdvForm({
        ...advForm,
        oraclePk: oraclePk || '',
        mintPk: mint,
        name: tokenInfo.symbol,
        tokenIndex: index,
        openBookProgram: OPENBOOK_PROGRAM_ID[CLUSTER].toBase58(),
        marketName: `${tokenInfo.symbol}/${isLST ? 'SOL' : 'USDC'}`,
        baseBankPk: baseBank.toBase58(),
        quoteBankPk: group!
          .getFirstBankByMint(new PublicKey(quoteMint))
          .publicKey.toBase58(),
        marketIndex: index,
        openBookMarketExternalPk: marketPk?.toBase58() || '',
        proposalTitle: `List ${tokenInfo.symbol} on Mango-v4`,
        listForSwapOnly: false,
        fastListing: false,
      })
      setLoadingListingParams(false)
    },
    [connection, mint, proposals, group, client.programId, advForm, quoteBank],
  )

  const handleGetRoutesWithFixedArgs = useCallback(
    (
      amount: number,
      tokenMint: PublicKey,
      mode: 'ExactIn' | 'ExactOut',
      onlyDirect = false,
    ) => {
      const SLIPPAGE_BPS = 50
      const walletForCheck = wallet.publicKey
        ? wallet.publicKey?.toBase58()
        : emptyPk

      return handleGetRoutes(
        USDC_MINT,
        tokenMint.toBase58(),
        toNative(amount, 6).toNumber(),
        SLIPPAGE_BPS,
        mode,
        walletForCheck,
        undefined, // mangoAccount
        onlyDirect ? 'JUPITER_DIRECT' : 'JUPITER',
        connection,
        undefined,
      )
    },
    [wallet.publicKey, connection],
  )

  const handleLiquidityCheck = useCallback(
    async (tokenMint: PublicKey, isLST: boolean) => {
      if (isLST) {
        const targetAmount = 250000
        setProposedProposedTargetAmount(targetAmount)
        setPreset(presets.asset_250)
        setPriceImpact(0.9)
        return targetAmount
      }
      try {
        const swaps = await Promise.all([
          handleGetRoutesWithFixedArgs(5000000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(250000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(100000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(20000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(10000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(5000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(3000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(1000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(5000000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(250000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(100000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(20000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(10000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(5000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(3000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(1000, tokenMint, 'ExactOut'),
        ])
        const bestRoutesSwaps = swaps
          .filter((x) => x.bestRoute)
          .map((x) => x.bestRoute!)

        const averageSwaps = bestRoutesSwaps.reduce(
          (acc: { amount: string; priceImpactPct: number }[], val) => {
            if (val.swapMode === 'ExactIn') {
              const exactOutRoute = bestRoutesSwaps.find(
                (x) =>
                  x.outAmount === val.inAmount && x.swapMode === 'ExactOut',
              )

              acc.push({
                amount: val.inAmount.toString(),
                priceImpactPct: exactOutRoute?.priceImpactPct
                  ? (Number(val.priceImpactPct) +
                      Number(exactOutRoute.priceImpactPct)) /
                    2
                  : Number(val.priceImpactPct),
              })
            }
            return acc
          },
          [],
        )

        const midTierCheck = averageSwaps.find(
          (x) => x.amount === TWENTY_K_USDC_BASE,
        )
        const indexForTargetAmount = averageSwaps.findIndex(
          (x) => x?.priceImpactPct && x?.priceImpactPct * 100 < 1,
        )
        const targetAmount =
          indexForTargetAmount > -1
            ? toUiDecimals(new BN(averageSwaps[indexForTargetAmount].amount), 6)
            : 0

        setProposedProposedTargetAmount(targetAmount)
        setPriceImpact(midTierCheck ? midTierCheck.priceImpactPct * 100 : 100)
        handleGetPoolParams(targetAmount, tokenMint)
        return targetAmount
      } catch (e) {
        notify({
          title: t('liquidity-check-error'),
          description: `${e}`,
          type: 'error',
        })
        return 0
      }
    },
    [t, handleGetRoutesWithFixedArgs],
  )

  const handleGetPoolParams = async (
    targetAmount: number,
    tokenMint: PublicKey,
  ) => {
    const swaps = await handleGetRoutesWithFixedArgs(
      targetAmount ? targetAmount : 100,
      tokenMint,
      'ExactIn',
      true,
    )

    const swapInfos = swaps?.bestRoute?.routePlan?.map((x) => x.swapInfo)
    const orcaPool = swapInfos?.find(
      (x) =>
        x.label?.toLowerCase().includes('orca') ||
        x.label?.toLowerCase().includes('whirlpool'),
    )
    const raydiumPool = swapInfos?.find(
      (x) => x.label?.toLowerCase().includes('raydium'),
    )

    if (!orcaPool?.ammKey && !raydiumPool?.ammKey) {
      try {
        const dex = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${tokenMint.toBase58()}`,
        )
        const resp = await dex.json()

        if (!resp?.pairs?.length) {
          return
        }
        const bestSolPool = resp.pairs.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (x: any) =>
            x.quoteToken.address === WRAPPED_SOL_MINT.toBase58() ||
            x.baseToken.address === WRAPPED_SOL_MINT.toBase58(),
        )

        if (bestSolPool?.dexId.includes('raydium')) {
          setRaydiumPoolAddress(bestSolPool.pairAddress)
        }
        if (bestSolPool?.dexId.includes('orca')) {
          setOrcaPoolAddress(bestSolPool.pairAddress)
        }
        setIsSolPool(true)
        return
      } catch (e) {
        console.log(e)
      }
    }
    setOrcaPoolAddress(orcaPool?.ammKey || '')
    setRaydiumPoolAddress(raydiumPool?.ammKey || '')
  }

  const handleTokenFind = useCallback(async () => {
    cancel()
    if (!tryGetPubKey(mint)) {
      notify({
        title: t('enter-valid-token-mint'),
        type: 'error',
      })
      return
    }
    const tokenInfo = jupiterTokens.find((x) => x.address === mint)
    const priceInfo = await (
      await fetch(`${JUPITER_PRICE_API_MAINNET}price?ids=${mint}`)
    ).json()
    //Note: if listing asset that don't have price on jupiter remember to edit this 0 to real price
    //in case of using 0 openbook market can be wrongly configured ignore if openbook market is existing
    setBaseTokenPrice(priceInfo.data[mint]?.price || 0)
    setCurrentTokenInfo(tokenInfo)
    if (tokenInfo) {
      const lstPool = await getLstStakePool(connection, mint)
      const targetAmount = await handleLiquidityCheck(
        new PublicKey(mint),
        !!lstPool,
      )
      getListingParams(
        tokenInfo,
        lstPool ? WRAPPED_SOL_MINT.toBase58() : USDC_MINT,
        lstPool ? targetAmount : 0,
        !!lstPool,
      )
      setIsLST(!!lstPool)
      setLstStakePoolAddress(lstPool)
    }
  }, [getListingParams, handleLiquidityCheck, jupiterTokens, mint, t])

  const cancel = () => {
    setCurrentTokenInfo(null)
    setPriceImpact(0)
    setAdvForm({ ...defaultTokenListFormValues })
    setProposalPk(null)
    setOrcaPoolAddress('')
    setRaydiumPoolAddress('')
    setProposedProposedTargetAmount(0)
    setBaseTokenPrice(0)
    setIsLST(false)
  }

  const isFormValid = useCallback(
    (advForm: TokenListForm) => {
      const invalidFields: FormErrors = {}
      setFormErrors({})
      const pubkeyFields: (keyof TokenListForm)[] = [
        'openBookProgram',
        'quoteBankPk',
        'baseBankPk',
        'openBookMarketExternalPk',
        'oraclePk',
      ]
      const numberFields: (keyof TokenListForm)[] = ['tokenIndex']
      const textFields: (keyof TokenListForm)[] = [
        'marketName',
        'proposalTitle',
      ]

      for (const key of pubkeyFields) {
        if (!tryGetPubKey(advForm[key] as string)) {
          if (advForm.listForSwapOnly && key === 'openBookMarketExternalPk') {
            continue
          }
          invalidFields[key] = t('invalid-pk')
        }
      }
      for (const key of numberFields) {
        if (isNaN(advForm[key] as number) || advForm[key] === '') {
          invalidFields[key] = t('invalid-num')
        }
      }
      for (const key of textFields) {
        if (!advForm[key]) {
          invalidFields[key] = t('field-req')
        }
      }
      if (Object.keys(invalidFields).length) {
        setFormErrors(invalidFields)
      }
      return invalidFields
    },
    [t],
  )

  const propose = useCallback(async () => {
    const invalidFields = isFormValid(advForm)
    if (Object.keys(invalidFields).length) {
      return
    }
    if (!wallet.publicKey || !vsrClient || !connectionContext) return
    await getCurrentVotingPower(wallet.publicKey, vsrClient, connectionContext)

    if (voter.voteWeight.cmp(minVoterWeight) === -1) {
      notify({
        title: `${t('on-boarding-description', {
          amount: formatNumericValue(mintVoterWeightNumber),
        })} ${t('mango-governance')}`,
        type: 'error',
      })
      return
    }
    const newProposals = await refetchProposals()

    const index = proposals ? Object.values(newProposals).length : 0

    const mint = new PublicKey(advForm.mintPk)
    const proposalTx = []

    if (Object.keys(proposedPreset).length && !advForm.fastListing) {
      const registerTokenIx = await client!.program.methods
        .tokenRegister(
          Number(index),
          advForm.name,
          {
            confFilter: Number(proposedPreset.oracleConfFilter),
            maxStalenessSlots:
              proposedPreset.maxStalenessSlots === -1
                ? null
                : proposedPreset.maxStalenessSlots,
          },
          {
            adjustmentFactor: Number(proposedPreset.adjustmentFactor),
            util0: Number(proposedPreset.util0),
            rate0: Number(proposedPreset.rate0),
            util1: Number(proposedPreset.util1),
            rate1: Number(proposedPreset.rate1),
            maxRate: Number(proposedPreset.maxRate),
          },
          Number(proposedPreset.loanFeeRate),
          Number(proposedPreset.loanOriginationFeeRate),
          Number(proposedPreset.maintAssetWeight),
          Number(proposedPreset.initAssetWeight),
          Number(proposedPreset.maintLiabWeight),
          Number(proposedPreset.initLiabWeight),
          Number(proposedPreset.liquidationFee),
          Number(proposedPreset.stablePriceDelayIntervalSeconds),
          Number(proposedPreset.stablePriceDelayGrowthLimit),
          Number(proposedPreset.stablePriceGrowthLimit),
          Number(proposedPreset.minVaultToDepositsRatio),
          new BN(proposedPreset.netBorrowLimitWindowSizeTs),
          new BN(proposedPreset.netBorrowLimitPerWindowQuote),
          Number(proposedPreset.borrowWeightScaleStartQuote),
          Number(proposedPreset.depositWeightScaleStartQuote),
          Number(proposedPreset.reduceOnly),
          Number(proposedPreset.tokenConditionalSwapTakerFeeRate),
          Number(proposedPreset.tokenConditionalSwapMakerFeeRate),
          Number(proposedPreset.flashLoanSwapFeeRate),
          Number(proposedPreset.interestCurveScaling),
          Number(proposedPreset.interestTargetUtilization),
          proposedPreset.groupInsuranceFund,
          new BN(proposedPreset.depositLimit.toString()),
          Number(proposedPreset.zeroUtilRate),
          Number(proposedPreset.platformLiquidationFee),
          proposedPreset.disableAssetLiquidation,
          Number(
            isLST
              ? 0.000027396999939810485
              : proposedPreset.collateralFeePerDay,
          ),
        )
        .accounts({
          fallbackOracle: PublicKey.default,
          admin: MANGO_DAO_WALLET,
          group: group!.publicKey,
          mint: mint,
          oracle: new PublicKey(advForm.oraclePk),
          payer: MANGO_DAO_WALLET,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .instruction()
      proposalTx.push(registerTokenIx)
    } else {
      const trustlessIx = await client!.program.methods
        .tokenRegisterTrustless(Number(index), advForm.name)
        .accounts({
          fallbackOracle: PublicKey.default,
          mint: mint,
          payer: MANGO_DAO_FAST_LISTING_WALLET,
          rent: SYSVAR_RENT_PUBKEY,
          oracle: new PublicKey(advForm.oraclePk),
          admin: MANGO_DAO_FAST_LISTING_WALLET,
          group: group!.publicKey,
        })
        .instruction()

      proposalTx.push(trustlessIx)
    }

    if (!advForm.listForSwapOnly) {
      const registerMarketix = await client!.program.methods
        .serum3RegisterMarket(
          Number(index),
          advForm.marketName,
          proposedPreset.oraclePriceBand,
        )
        .accounts({
          group: group!.publicKey,
          admin: advForm.fastListing
            ? MANGO_DAO_FAST_LISTING_WALLET
            : MANGO_DAO_WALLET,
          serumProgram: new PublicKey(advForm.openBookProgram),
          serumMarketExternal: new PublicKey(advForm.openBookMarketExternalPk),
          baseBank: new PublicKey(advForm.baseBankPk),
          quoteBank: new PublicKey(advForm.quoteBankPk),
          payer: advForm.fastListing
            ? MANGO_DAO_FAST_LISTING_WALLET
            : MANGO_DAO_WALLET,
        })
        .instruction()
      proposalTx.push(registerMarketix)
    }

    const walletSigner = wallet as never
    setCreatingProposal(true)

    try {
      const simTransaction = new Transaction({ feePayer: wallet.publicKey })
      simTransaction.add(...proposalTx)
      const simulation = await connection.simulateTransaction(simTransaction)

      if (!simulation.value.err) {
        const proposalAddress = await createProposal(
          connection,
          client,
          walletSigner,
          advForm.fastListing
            ? MANGO_DAO_FAST_LISTING_GOVERNANCE
            : MANGO_DAO_WALLET_GOVERNANCE,
          voter.tokenOwnerRecord!,
          advForm.proposalTitle,
          advForm.proposalDescription,
          index,
          proposalTx,
          vsrClient,
          fee,
        )
        setProposalPk(proposalAddress.toBase58())
      } else {
        throw simulation.value.logs
      }
    } catch (e) {
      console.log(e)
      notify({
        title: t('error-proposal-creation'),
        description: `${e}`,
        type: 'error',
      })
    }

    setCreatingProposal(false)
  }, [
    isFormValid,
    advForm,
    wallet,
    vsrClient,
    connectionContext,
    getCurrentVotingPower,
    voter.voteWeight,
    voter.tokenOwnerRecord,
    minVoterWeight,
    refetchProposals,
    proposals,
    proposedPreset,
    t,
    mintVoterWeightNumber,
    client,
    group,
    connection,
    fee,
    isLST,
  ])

  const closeCreateOpenBookMarketModal = () => {
    setCreateOpenbookMarket(false)
    if (currentTokenInfo && proposedPresetTargetAmount) {
      getListingParams(
        currentTokenInfo,
        QUOTE_MINT,
        isLST ? proposedPresetTargetAmount : 0,
        isLST,
      )
    }
  }
  const closeCreateOracleModal = (oraclePk?: PublicKey) => {
    setOracleModalOpen(false)
    if (oraclePk) {
      handleSetAdvForm('oraclePk', oraclePk.toBase58())
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center">
        <IconButton className="mr-4" onClick={goBack} size="medium">
          <ArrowLeftIcon className="h-5 w-5" />
        </IconButton>
        <h1 className="flex items-center">{t('list-token')}</h1>
      </div>
      <OnBoarding />
      {!currentTokenInfo ? (
        <>
          <div>
            <Label text={t('token-mint')} />
            <div className="max-w-[460px]">
              <Input
                type="text"
                value={mint}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setMint(e.target.value)
                }
              />
            </div>
            <Button
              className="mt-6 flex w-36 items-center justify-center"
              onClick={handleTokenFind}
              disabled={loadingVoter || loadingRealm}
              size="large"
            >
              {loadingRealm || loadingVoter ? (
                <Loading className="w-4"></Loading>
              ) : (
                t('find-token')
              )}
            </Button>
            <div className="text-th-warning">
              {currentTokenInfo === undefined && t('token-not-found')}
            </div>
          </div>
        </>
      ) : (
        <>
          {proposalPk ? (
            <ListingSuccess
              proposalPk={proposalPk}
              token={currentTokenInfo?.name}
            />
          ) : (
            <>
              <div className="rounded-md bg-th-bkg-2 p-4">
                <h3 className="mb-2">{t('token-details')}</h3>
                <div className="mb-2 flex items-center justify-between">
                  <p>{t('name')}</p>
                  <div className="flex items-center">
                    <img
                      src={currentTokenInfo?.logoURI}
                      className="mr-2 h-5 w-5"
                    ></img>
                    <p className="text-th-fgd-2">{currentTokenInfo?.name}</p>
                  </div>
                </div>
                <div className="mb-2 flex items-center justify-between">
                  <p>{t('symbol')}</p>
                  <p className="text-th-fgd-2">{currentTokenInfo?.symbol}</p>
                </div>
                {isLST && (
                  <div className="mb-2 flex items-center justify-between">
                    <p>LST detected</p>
                    <p className="text-th-fgd-2">Quote token SOL</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <p>{t('mint')}</p>
                  <p className="flex items-center">
                    {abbreviateAddress(
                      new PublicKey(currentTokenInfo?.address),
                    )}
                  </p>
                </div>
                {priceImpact > 2 && (
                  <div className="mt-4">
                    <InlineNotification
                      desc={t('liquidity-warning', {
                        priceImpactPct: priceImpact.toPrecision(2).toString(),
                      })}
                      type="warning"
                    />
                  </div>
                )}
              </div>
              <div className="mb-6">
                <Disclosure>
                  {({ open }) => (
                    <>
                      <Disclosure.Button
                        className={`mt-4 w-full rounded-md bg-th-bkg-2 p-4 md:hover:bg-th-bkg-3 ${
                          open ? 'rounded-b-none' : ''
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between ${
                            Object.values(formErrors).length
                              ? 'text-th-warning'
                              : ''
                          }`}
                        >
                          {t('adv-fields')}
                          <ChevronDownIcon
                            className={`h-5 w-5 text-th-fgd-3 ${
                              open ? 'rotate-180' : 'rotate-0'
                            }`}
                          />
                        </div>
                      </Disclosure.Button>
                      <Disclosure.Panel>
                        <div className="space-y-4 rounded-md rounded-t-none bg-th-bkg-2 p-4">
                          <div className="mb-2 flex items-center justify-between">
                            <p>
                              {t('tier')} (suggested:{' '}
                              {suggestedPreset.preset_name})
                            </p>
                            <Select
                              value={proposedPreset.preset_name}
                              onChange={(val) => {
                                setPreset(
                                  LISTING_PRESETS[val as LISTING_PRESETS_KEY]!,
                                )
                              }}
                              className="w-[200px]"
                            >
                              {Object.keys(LISTING_PRESETS).map((name) => (
                                <Select.Option key={name} value={name}>
                                  <div className="flex w-full items-center justify-between">
                                    {
                                      LISTING_PRESETS[
                                        name as LISTING_PRESETS_KEY
                                      ].preset_name
                                    }{' '}
                                    {`{${
                                      LISTING_PRESETS[
                                        name as LISTING_PRESETS_KEY
                                      ].preset_key
                                    }}`}
                                    {LISTING_PRESETS[
                                      name as LISTING_PRESETS_KEY
                                    ].preset_target_amount ===
                                    proposedPresetTargetAmount
                                      ? ' - suggested'
                                      : ''}
                                  </div>
                                </Select.Option>
                              ))}
                            </Select>
                          </div>
                          <div>
                            <Label text={t('oracle')} />
                            <Input
                              hasError={formErrors.oraclePk !== undefined}
                              type="text"
                              value={advForm.oraclePk}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSetAdvForm('oraclePk', e.target.value)
                              }
                            />
                            {formErrors.oraclePk ? (
                              <div className="mt-1.5 flex items-center space-x-1">
                                <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                <p className="mb-0 text-xs text-th-down">
                                  {formErrors.oraclePk}
                                </p>
                              </div>
                            ) : null}
                          </div>
                          <div>
                            <Label text={t('token-index')} />
                            <Input
                              disabled={true}
                              hasError={formErrors.tokenIndex !== undefined}
                              type="number"
                              value={advForm.tokenIndex.toString()}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSetAdvForm('tokenIndex', e.target.value)
                              }
                            />
                            {formErrors.tokenIndex && (
                              <div className="mt-1.5 flex items-center space-x-1">
                                <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                <p className="mb-0 text-xs text-th-down">
                                  {formErrors.tokenIndex}
                                </p>
                              </div>
                            )}
                          </div>
                          {!advForm.listForSwapOnly && (
                            <div>
                              <Label text={t('openbook-market-external')} />
                              <Input
                                hasError={
                                  formErrors.openBookMarketExternalPk !==
                                  undefined
                                }
                                type="text"
                                value={advForm.openBookMarketExternalPk.toString()}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  handleSetAdvForm(
                                    'openBookMarketExternalPk',
                                    e.target.value,
                                  )
                                }
                              />
                              {formErrors.openBookMarketExternalPk && (
                                <div className="mt-1.5 flex items-center space-x-1">
                                  <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                  <p className="mb-0 text-xs text-th-down">
                                    {formErrors.openBookMarketExternalPk}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                          <div>
                            <Label text={t('list-for-swap-only')} />
                            <Checkbox
                              checked={advForm.listForSwapOnly}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSetAdvForm(
                                  'listForSwapOnly',
                                  e.target.checked,
                                )
                              }
                            >
                              <></>
                            </Checkbox>
                            {formErrors.openBookMarketExternalPk && (
                              <div className="mt-1.5 flex items-center space-x-1">
                                <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                <p className="mb-0 text-xs text-th-down">
                                  {formErrors.openBookMarketExternalPk}
                                </p>
                              </div>
                            )}
                          </div>
                          {proposedPreset.preset_key === 'UNTRUSTED' && (
                            <div>
                              <Label text={t('fast-listing')} />
                              <Checkbox
                                checked={advForm.fastListing}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                  handleSetAdvForm(
                                    'fastListing',
                                    e.target.checked,
                                  )
                                }
                              >
                                <></>
                              </Checkbox>
                            </div>
                          )}
                          <div>
                            <Label text={t('base-bank')} />
                            <Input
                              hasError={formErrors.baseBankPk !== undefined}
                              type="text"
                              value={advForm.baseBankPk.toString()}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSetAdvForm('baseBankPk', e.target.value)
                              }
                            />
                            {formErrors.baseBankPk && (
                              <div className="mt-1.5 flex items-center space-x-1">
                                <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                <p className="mb-0 text-xs text-th-down">
                                  {formErrors.baseBankPk}
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label text={t('quote-bank')} />
                            <Input
                              hasError={formErrors.quoteBankPk !== undefined}
                              type="text"
                              value={advForm.quoteBankPk.toString()}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSetAdvForm('quoteBankPk', e.target.value)
                              }
                            />
                            {formErrors.quoteBankPk && (
                              <div className="mt-1.5 flex items-center space-x-1">
                                <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                <p className="mb-0 text-xs text-th-down">
                                  {formErrors.quoteBankPk}
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label text={t('openbook-program')} />
                            <Input
                              hasError={
                                formErrors.openBookProgram !== undefined
                              }
                              type="text"
                              value={advForm.openBookProgram.toString()}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSetAdvForm(
                                  'openBookProgram',
                                  e.target.value,
                                )
                              }
                            />
                            {formErrors.openBookProgram && (
                              <div className="mt-1.5 flex items-center space-x-1">
                                <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                <p className="mb-0 text-xs text-th-down">
                                  {formErrors.openBookProgram}
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label text={t('market-name')} />
                            <Input
                              hasError={formErrors.marketName !== undefined}
                              type="text"
                              value={advForm.marketName.toString()}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSetAdvForm('marketName', e.target.value)
                              }
                            />
                            {formErrors.marketName && (
                              <div className="mt-1.5 flex items-center space-x-1">
                                <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                <p className="mb-0 text-xs text-th-down">
                                  {formErrors.marketName}
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label text={t('proposal-title')} />
                            <Input
                              hasError={formErrors.proposalTitle !== undefined}
                              type="text"
                              value={advForm.proposalTitle.toString()}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSetAdvForm(
                                  'proposalTitle',
                                  e.target.value,
                                )
                              }
                            />
                            {formErrors.proposalTitle && (
                              <div className="mt-1.5 flex items-center space-x-1">
                                <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                <p className="mb-0 text-xs text-th-down">
                                  {formErrors.proposalTitle}
                                </p>
                              </div>
                            )}
                          </div>
                          <div>
                            <Label text={t('proposal-des')} />
                            <Input
                              hasError={
                                formErrors.proposalDescription !== undefined
                              }
                              type="text"
                              value={advForm.proposalDescription.toString()}
                              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                handleSetAdvForm(
                                  'proposalDescription',
                                  e.target.value,
                                )
                              }
                            />
                            {formErrors.proposalDescription && (
                              <div className="mt-1.5 flex items-center space-x-1">
                                <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                                <p className="mb-0 text-xs text-th-down">
                                  {formErrors.proposalDescription}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              </div>
              <ol className="list-decimal pl-4">
                {!advForm.openBookMarketExternalPk &&
                !advForm.listForSwapOnly &&
                !loadingListingParams ? (
                  <li className="pl-2">
                    <div className="mb-4">
                      <InlineNotification
                        desc={
                          <div>
                            <a
                              onClick={() => setCreateOpenbookMarket(true)}
                              className="cursor-pointer underline"
                            >
                              {t('cant-list-no-openbook-market')}
                            </a>
                          </div>
                        }
                        type="error"
                      />
                    </div>
                    {createOpenbookMarketModal ? (
                      <CreateOpenbookMarketModal
                        quoteMint={quoteBank?.mint.toBase58() || ''}
                        baseMint={currentTokenInfo?.address || ''}
                        baseDecimals={currentTokenInfo.decimals}
                        quoteDecimals={quoteBank?.mintDecimals || 0}
                        isOpen={createOpenbookMarketModal}
                        onClose={closeCreateOpenBookMarketModal}
                        tradingParams={tradingParams}
                      />
                    ) : null}
                  </li>
                ) : null}
                {!advForm.oraclePk &&
                !loadingListingParams &&
                proposedPreset.oracle !== 0 ? (
                  <li
                    className={`my-4 pl-2 ${
                      !advForm.openBookMarketExternalPk &&
                      !advForm.listForSwapOnly
                        ? 'disabled pointer-events-none opacity-60'
                        : ''
                    }`}
                  >
                    <InlineNotification
                      desc={
                        <div>
                          <a
                            onClick={() => setOracleModalOpen(true)}
                            className="cursor-pointer underline"
                          >
                            {t('cant-list-oracle-not-found-switch')}
                          </a>
                        </div>
                      }
                      type="error"
                    />
                    <CreateSwitchboardOracleModal
                      tierKey={proposedPreset.preset_key}
                      orcaPoolAddress={orcaPoolAddress}
                      raydiumPoolAddress={raydiumPoolAddress}
                      baseTokenName={currentTokenInfo.symbol}
                      baseTokenPk={currentTokenInfo.address}
                      openbookMarketPk={advForm.openBookMarketExternalPk}
                      isOpen={oracleModalOpen}
                      onClose={closeCreateOracleModal}
                      isSolPool={isSolPool}
                      stakePoolAddress={lstStakePoolAddress}
                      tokenDecimals={currentTokenInfo.decimals}
                      tokenPrice={baseTokenPrice}
                    ></CreateSwitchboardOracleModal>
                  </li>
                ) : null}
              </ol>
              <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
                <Button secondary onClick={cancel} size="large">
                  {t('cancel')}
                </Button>
                {wallet.connected ? (
                  <Button
                    className="flex w-full items-center justify-center sm:w-44"
                    onClick={propose}
                    disabled={
                      loadingRealm ||
                      loadingVoter ||
                      (!advForm.openBookMarketExternalPk &&
                        !loadingListingParams &&
                        !advForm.listForSwapOnly)
                    }
                    size="large"
                  >
                    {loadingListingParams ||
                    loadingVoter ||
                    loadingRealm ||
                    creatingProposal ? (
                      <Loading className="w-4"></Loading>
                    ) : (
                      t('propose-listing')
                    )}
                  </Button>
                ) : (
                  <Button onClick={wallet.connect} size="large">
                    {t('connect-wallet')}
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ListToken

const getLstStakePool = async (connection: Connection, mint: string) => {
  try {
    let poolAddress = ''
    const addresses = [
      'GUAMR8ciiaijraJeLDEDrFVaueLm9YzWWY9R7CBPL9rA',
      'F8h46pYkaqPJNP2MRkUUUtRkf8efCkpoqehn9g1bTTm7',
      '5oc4nmbNTda9fx8Tw57ShLD132aqDK65vuHH4RU1K4LZ',
      'GutG5bcmEZw15WmPHNVMWHU77c6t8CEinUEdPLYz3doa',
      '9Z8yimuc3bQCWLDyMhe6jfWqNk9EggyJZUo8TLnYsqhN',
      'GM7TwD34n8HmDP9XcT6bD3JJuNniKJkrKQinHqmqHarz',
      '8VpRhuxa7sUUepdY3kQiTmX9rS5vx4WgaXiAnXq4KCtr',
      '4mBwcXKJN2vz6MJikNTgVBSY5vYnyjZk7txd8j3K46Ei',
      'phasejkG1akKgqkLvfWzWY17evnH6mSWznnUspmpyeG',
      '4fdMvFuyNboQ5Kr93X16f1tFcTeEkvfNwNAeSrzY3afb',
      'EVXQHaLSJyUNrnBGfXUnvEi4DvVz4UJ3GnoKGVQVxrjr',
      '5FYTvZgc7QEGZSDmbJn5hrtjtRtyFZo5vR7gL1jJYanE',
      'DfiQgSvpW3Dy4gKfhtdHnWGHwFUrE8exvaxqjtMtAVxk',
      '4dZDUL3BFJUFeqS3Y3cwkc84Rs6mgVHRYGt1LJvhooW4',
      'AZGSr2fUyKkPLMhAW6WUEKEsQiRMAFKf8Fjnt4MFFaGv',
      'ArAQfbzsdotoKB5jJcZa3ajQrrPcWr2YQoDAEAiFxJAC',
      '9mhGNSPArRMHpLDMSmxAvuoizBqtBGqYdT8WGuqgxNdn',
      'AwDeTcW6BovNYR34Df1TPm4bFwswa4CJY4YPye2LXtPS',
      '8Dv3hNYcEWEaa4qVx9BTN1Wfvtha1z8cWDUXb7KVACVe',
      '6e2LpgytfG3RqMdYuPr3dnedv6bmHQUk9hH9h2fzVk9o',
      'ECRqn7gaNASuvTyC5xfCUjehWZCSowMXstZiM5DNweyB',
      'GZDX5JYXDzCEDL3kybhjN7PSixL4ams3M2G4CvWmMmm5',
      'LW3qEdGWdVrxNgxSXW8vZri7Jifg4HuKEQ1UABLxs3C',
      '2jjK1MsLgsPgVjnp97HUJeovNj3jp4XgyQ3nuiWMwiS8',
      '8WHCJsUduwDBhPL9uVADQSdWkUi2LPZNFAMyX1n2HGMD',
      '3wK2g8ZdzAH8FJ7PKr2RcvGh7V9VYson5hrVsJM5Lmws',
      'CgntPoLka5pD5fesJYhGmUCF8KU1QS1ZmZiuAuMZr2az',
      '2qyEeSAWKfU18AFthrF7JA8z8ZCi1yt76Tqs917vwQTV',
      'Fu9BYC6tWBo1KMKaP3CFoKfRhqv9akmy3DuYwnCyWiyC',
      'stk9ApL5HeVAwPLr3TLhDXdZS8ptVu7zp6ov8HFDuMi',
      '7ge2xKsZXmqPxa3YmXxXmzCp9Hc2ezrTxh6PECaxCwrL',
      'Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb',
      'CtMyWsrUtAwXWiGr9WjHT5fC3p3fgV8cyGpLTo2LJzG1',
      'DqhH94PjkZsjAqEze2BEkWhFQJ6EyU6MdtMphMgnXqeK',
      'DxRFpqBQBC2nKcvh14gD1eizCj9Xi7ruMR3nCR3Hvw8f',
      'edgejNWAqkePLpi5sHRxT9vHi7u3kSHP9cocABPKiWZ',
      'G9WdMBxWSo1X3fKxbuyGrv1nGXrVqGg5zBKAkBFkb37g',
      'CWM1VcNPd2A5WF2x2mmEUCgA1PGSKNZCGAH5GsoQw7h8',
      '2RUTyfN8iq7Hsd2s9rLgrRT9VhHLuqkx2mGNgbuzbhTc',
      '7qJ34Vq7nGZvk5YExkJsDZB6to6vz9RpcPmNEK84HjrV',
      '4qYufFsPQETukkXd5z9fxDsdwm8AEaSqzYpuzmZzCJxR',
      '9pffpv2w65TSeZpD988hAjvvzUiF1KZN1Swx5j2zPCdy',
      'BmEgS5XpWJJDqT3FVfB6ZmoELQrWkJxDXo3cNoJVsNFK',
      '5bzgfi7nidWWrp3DCwPwLzepw7PGgawRmMH9tqqXMZRj',
      'Fvy5L7f3rduuYfRf9GR9fDqEgmJkYagDPh3Ddkp5jcoP',
      '9dP2MvpoFuVgW31NbwyRJzybcjH2gMZS5YkSWEC7NDhD',
      'GrrASJmjz19gHDsUUGv9y3gtRAwYJcdrtFESCRAosd44',
      'EYwMHf8Ajnpvy3PqMMkq1MPkTyhCsBEesXFgnK9BZfmu',
      '6LXCxeyQZqdAL4yLCtgATFYF6dcayWvsiwjtBFYVfb1N',
      '4gT1GaFtJK5pnX3CnjnSYwy8VUV9UdmozoQV9GCNk9RQ',
      'GEGRQNw17Y5s44dRH69sk8bvhyj3i6VwgqGmN1MBHKHp',
      '9j2mFdABTCCnWnzLtpMjp86AEcm4e3XistVeuujds7Au',
      'DYuSikgwzHidFo2b8jqrViW1psAb7hpawJnszBothRzp',
      'pjwKqvtt4ij6VJW4HxNxSaufSrkWHRc6iCTHoC4gFs4',
      '5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx',
    ]
    //remove duplicates
    const possibleStakePoolsAddresses = [...new Set(addresses)].map(
      (x) => new PublicKey(x),
    )
    const accounts = await connection.getMultipleAccountsInfo(
      possibleStakePoolsAddresses,
    )
    for (const idx in accounts) {
      try {
        const acc = accounts[idx]
        const stakeAddressPk = possibleStakePoolsAddresses[idx]
        if (acc?.data) {
          const decoded = StakePoolLayout.decode(acc?.data)
          if (decoded.poolMint.toBase58() === mint && stakeAddressPk) {
            poolAddress = stakeAddressPk?.toBase58()
            break
          }
        }
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }

    return poolAddress
  } catch (e) {
    console.log(e)
    return ''
  }
}
