import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button, { IconButton } from '@components/shared/Button'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import { Token } from 'types/jupiter'
import { handleGetRoutes } from '@components/swap/useQuoteRoutes'
import {
  JUPITER_PRICE_API_MAINNET,
  JUPITER_REFERRAL_PK,
  USDC_MINT,
} from 'utils/constants'
import { PublicKey, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { OPENBOOK_PROGRAM_ID, toNative } from '@blockworks-foundation/mango-v4'
import {
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
  getSwitchBoardPresets,
  getPythPresets,
  LISTING_PRESET,
} from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'
import Checkbox from '@components/forms/Checkbox'
import { ReferralProvider } from '@jup-ag/referral-sdk'
import { BN } from '@coral-xyz/anchor'

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
  const [isPyth, setIsPyth] = useState(false)
  const presets = useMemo(() => {
    return !isPyth
      ? getSwitchBoardPresets(LISTING_PRESETS)
      : getPythPresets(LISTING_PRESETS)
  }, [isPyth])
  const [proposedPresetTargetAmount, setProposedProposedTargetAmount] =
    useState(0)

  const proposedPreset: LISTING_PRESET =
    Object.values(presets).find(
      (x) => x.preset_target_amount === proposedPresetTargetAmount,
    ) || presets.UNTRUSTED

  const quoteBank = group?.getFirstBankByMint(new PublicKey(USDC_MINT))
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
    async (tokenInfo: Token, targetAmount: number) => {
      setLoadingListingParams(true)
      const [{ oraclePk, isPyth }, marketPk] = await Promise.all([
        getOracle({
          baseSymbol: tokenInfo.symbol,
          quoteSymbol: 'usd',
          connection,
          targetAmount: targetAmount,
        }),
        getBestMarket({
          baseMint: mint,
          quoteMint: USDC_MINT,
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
        marketName: `${tokenInfo.symbol}/USDC`,
        baseBankPk: baseBank.toBase58(),
        quoteBankPk: group!
          .getFirstBankByMint(new PublicKey(USDC_MINT))
          .publicKey.toBase58(),
        marketIndex: index,
        openBookMarketExternalPk: marketPk?.toBase58() || '',
        proposalTitle: `List ${tokenInfo.symbol} on Mango-v4`,
        listForSwapOnly: false,
      })
      setLoadingListingParams(false)
      setIsPyth(isPyth)
    },
    [advForm, client.programId, connection, group, mint, proposals],
  )

  const handleGetRoutesWithFixedArgs = useCallback(
    (
      amount: number,
      tokenMint: PublicKey,
      mode: 'ExactIn' | 'ExactOut',
      onlyDirect = false,
    ) => {
      const SLIPPAGE_BPS = 50
      const FEE = 0
      const walletForCheck = wallet.publicKey
        ? wallet.publicKey?.toBase58()
        : emptyPk

      return handleGetRoutes(
        USDC_MINT,
        tokenMint.toBase58(),
        toNative(amount, 6).toNumber(),
        SLIPPAGE_BPS,
        mode,
        FEE,
        walletForCheck,
        undefined, // mangoAccount
        'JUPITER',
        onlyDirect,
      )
    },
    [wallet.publicKey],
  )

  const handleLiquidityCheck = useCallback(
    async (tokenMint: PublicKey) => {
      try {
        const targetAmounts = [
          ...new Set([
            ...Object.values(presets).map((x) => x.preset_target_amount),
          ]),
        ]
        const swaps = await Promise.all([
          handleGetRoutesWithFixedArgs(250000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(100000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(20000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(10000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(5000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(1000, tokenMint, 'ExactIn'),
          handleGetRoutesWithFixedArgs(250000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(100000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(20000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(10000, tokenMint, 'ExactOut'),
          handleGetRoutesWithFixedArgs(5000, tokenMint, 'ExactOut'),
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
                  x.outAmount === val.outAmount && x.swapMode === 'ExactOut',
              )
              acc.push({
                amount: val.outAmount.toString(),
                priceImpactPct: exactOutRoute?.priceImpactPct
                  ? (val.priceImpactPct + exactOutRoute.priceImpactPct) / 2
                  : val.priceImpactPct,
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
          indexForTargetAmount > -1 ? targetAmounts[indexForTargetAmount] : 0
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
      const targetAmount = await handleLiquidityCheck(new PublicKey(mint))
      getListingParams(tokenInfo, targetAmount)
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
    const mint = new PublicKey(advForm.mintPk)
    const proposalTx = []

    if (Object.keys(proposedPreset).length) {
      const registerTokenIx = await client!.program.methods
        .tokenRegister(
          Number(advForm.tokenIndex),
          advForm.name,
          {
            confFilter: Number(proposedPreset.oracleConfFilter),
            maxStalenessSlots: proposedPreset.maxStalenessSlots,
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
          new BN(proposedPreset.depositLimit),
        )
        .accounts({
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
        .tokenRegisterTrustless(Number(advForm.tokenIndex), advForm.name)
        .accounts({
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
          Number(advForm.marketIndex),
          advForm.marketName,
          proposedPreset.oraclePriceBand,
        )
        .accounts({
          group: group!.publicKey,
          admin: MANGO_DAO_WALLET,
          serumProgram: new PublicKey(advForm.openBookProgram),
          serumMarketExternal: new PublicKey(advForm.openBookMarketExternalPk),
          baseBank: new PublicKey(advForm.baseBankPk),
          quoteBank: new PublicKey(advForm.quoteBankPk),
          payer: MANGO_DAO_WALLET,
        })
        .instruction()
      proposalTx.push(registerMarketix)
    }
    const rp = new ReferralProvider(connection)

    const tx = await rp.initializeReferralTokenAccount({
      payerPubKey: MANGO_DAO_WALLET,
      referralAccountPubKey: JUPITER_REFERRAL_PK,
      mint: mint,
    })
    const isExistingAccount =
      (await connection.getBalance(tx.referralTokenAccountPubKey)) > 1

    if (!isExistingAccount) {
      proposalTx.push(...tx.tx.instructions)
    }

    const walletSigner = wallet as never
    setCreatingProposal(true)

    try {
      const proposalAddress = await createProposal(
        connection,
        walletSigner,
        MANGO_DAO_WALLET,
        voter.tokenOwnerRecord!,
        advForm.proposalTitle,
        advForm.proposalDescription,
        advForm.tokenIndex,
        proposalTx,
        vsrClient,
        fee,
      )
      setProposalPk(proposalAddress.toBase58())
    } catch (e) {
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
    proposedPreset,
    connection,
    t,
    mintVoterWeightNumber,
    client,
    group,
    fee,
  ])

  const closeCreateOpenBookMarketModal = () => {
    setCreateOpenbookMarket(false)
    if (currentTokenInfo && proposedPresetTargetAmount) {
      getListingParams(currentTokenInfo, proposedPresetTargetAmount)
    }
  }
  const closeCreateOracleModal = () => {
    setOracleModalOpen(false)
    if (currentTokenInfo && proposedPresetTargetAmount) {
      getListingParams(currentTokenInfo, proposedPresetTargetAmount)
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
                <div className="mb-2 flex items-center justify-between">
                  <p>{t('tier')}</p>
                  <p className="text-th-fgd-2">{proposedPreset.preset_name}</p>
                </div>
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
                              open ? 'rotate-180' : 'rotate-360'
                            }`}
                          />
                        </div>
                      </Disclosure.Button>
                      <Disclosure.Panel>
                        <div className="space-y-4 rounded-md rounded-t-none bg-th-bkg-2 p-4">
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
                {!advForm.oraclePk && !loadingListingParams ? (
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
