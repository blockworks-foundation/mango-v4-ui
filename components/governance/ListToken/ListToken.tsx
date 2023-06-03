import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button, { IconButton } from '@components/shared/Button'
import { ChangeEvent, useCallback, useMemo, useState } from 'react'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import { Token } from 'types/jupiter'
import { handleGetRoutes } from '@components/swap/useQuoteRoutes'
import { JUPITER_PRICE_API_MAINNET, USDC_MINT } from 'utils/constants'
import { PublicKey, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  OPENBOOK_PROGRAM_ID,
  RouteInfo,
  toNative,
} from '@blockworks-foundation/mango-v4'
import {
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
import { useEnhancedWallet } from '@components/wallet/EnhancedWalletProvider'
import { abbreviateAddress } from 'utils/formatting'
import { formatNumericValue } from 'utils/numbers'
import useMangoGroup from 'hooks/useMangoGroup'
import {
  LISTING_PRESETS,
  getBestMarket,
  getOracle,
} from 'utils/governance/listingTools'
import { fmtTokenAmount, tryGetPubKey } from 'utils/governance/tools'
import OnBoarding from '../OnBoarding'
import CreateOpenbookMarketModal from '@components/modals/CreateOpenbookMarketModal'
import { calculateTradingParameters } from 'utils/governance/listingTools'
import useJupiterMints from 'hooks/useJupiterMints'
import CreateSwitchboardOracleModal from '@components/modals/CreateSwitchboardOracleModal'
import { BN } from '@project-serum/anchor'

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
}

const ListToken = ({ goBack }: { goBack: () => void }) => {
  const wallet = useWallet()
  const { jupiterTokens } = useJupiterMints()
  const connection = mangoStore((s) => s.connection)
  const client = mangoStore((s) => s.client)
  const { group } = useMangoGroup()
  const { handleConnect } = useEnhancedWallet()
  const voter = GovernanceStore((s) => s.voter)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const governances = GovernanceStore((s) => s.governances)
  const loadingRealm = GovernanceStore((s) => s.loadingRealm)
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
  const [coinTier, setCoinTier] = useState('')
  const tierPreset = useMemo(() => {
    return LISTING_PRESETS[coinTier]
  }, [coinTier])

  const quoteBank = group?.getFirstBankByMint(new PublicKey(USDC_MINT))
  const minVoterWeight = useMemo(
    () =>
      governances
        ? governances[MANGO_DAO_WALLET_GOVERNANCE.toBase58()].account.config
            .minCommunityTokensToCreateProposal
        : new BN(0),
    [governances]
  ) as BN
  const mintVoterWeightNumber = governances
    ? fmtTokenAmount(minVoterWeight, MANGO_MINT_DECIMALS)
    : 0
  const tradingParams = useMemo(() => {
    if (quoteBank && currentTokenInfo) {
      return calculateTradingParameters(
        baseTokenPrice,
        quoteBank.uiPrice,
        currentTokenInfo.decimals,
        quoteBank.mintDecimals
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

  const handleSetAdvForm = (propertyName: string, value: string | number) => {
    setFormErrors({})
    setAdvForm({ ...advForm, [propertyName]: value })
  }

  const getListingParams = useCallback(
    async (tokenInfo: Token) => {
      setLoadingListingParams(true)
      const [oraclePk, marketPk] = await Promise.all([
        getOracle({
          baseSymbol: tokenInfo.symbol,
          quoteSymbol: 'usd',
          connection,
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
        client.programId
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
      })
      setLoadingListingParams(false)
    },
    [advForm, client.programId, connection, group, mint, proposals]
  )

  const handleLiqudityCheck = useCallback(
    async (tokenMint: PublicKey) => {
      try {
        const SLIPPAGE_BPS = 50
        const MODE = 'ExactIn'
        const FEE = 0
        const walletForCheck = wallet.publicKey
          ? wallet.publicKey?.toBase58()
          : emptyPk
        const shitCoinIdx = 3

        const TIERS = ['PREMIUM', 'MID', 'MEME', 'SHIT']
        const swaps = await Promise.all([
          handleGetRoutes(
            USDC_MINT,
            tokenMint.toBase58(),
            toNative(100000, 6).toNumber(),
            SLIPPAGE_BPS,
            MODE,
            FEE,
            walletForCheck,
            'JUPITER'
          ),
          handleGetRoutes(
            USDC_MINT,
            tokenMint.toBase58(),
            toNative(20000, 6).toNumber(),
            SLIPPAGE_BPS,
            MODE,
            FEE,
            walletForCheck,
            'JUPITER'
          ),
          handleGetRoutes(
            USDC_MINT,
            tokenMint.toBase58(),
            toNative(5000, 6).toNumber(),
            SLIPPAGE_BPS,
            MODE,
            FEE,
            walletForCheck,
            'JUPITER'
          ),
          handleGetRoutes(
            USDC_MINT,
            tokenMint.toBase58(),
            toNative(1000, 6).toNumber(),
            SLIPPAGE_BPS,
            MODE,
            FEE,
            walletForCheck,
            'JUPITER'
          ),
        ])
        const mid = swaps[1]
        const indexForTierFromSwaps = swaps.findIndex(
          (x) =>
            x.bestRoute?.priceImpactPct && x.bestRoute?.priceImpactPct * 100 < 1
        )
        const tierIdx: number =
          indexForTierFromSwaps > -1 ? indexForTierFromSwaps : shitCoinIdx
        const tier = TIERS[tierIdx]
        setCoinTier(tier)
        setPriceImpact(mid.bestRoute ? mid.bestRoute.priceImpactPct * 100 : 100)
        handleGetPoolParams(mid.routes)
      } catch (e) {
        notify({
          title: t('liquidity-check-error'),
          description: `${e}`,
          type: 'error',
        })
      }
    },
    [t, wallet.publicKey]
  )

  const handleGetPoolParams = (routes: never[] | RouteInfo[]) => {
    const marketInfos = routes.flatMap((x) => x.marketInfos)
    const orcaPool = marketInfos.find((x) => x.label === 'Orca')
    const raydiumPool = marketInfos.find((x) => x.label === 'Raydium')
    setOrcaPoolAddress(orcaPool?.id || '')
    setRaydiumPoolAddress(raydiumPool?.id || '')
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
      await fetch(`${JUPITER_PRICE_API_MAINNET}/price?ids=${mint}`)
    ).json()
    setBaseTokenPrice(priceInfo.data[mint]?.price || 0)
    setCurrentTokenInfo(tokenInfo)
    if (tokenInfo) {
      handleLiqudityCheck(new PublicKey(mint))
      getListingParams(tokenInfo)
    }
  }, [getListingParams, handleLiqudityCheck, jupiterTokens, mint, t])

  const cancel = () => {
    setCurrentTokenInfo(null)
    setPriceImpact(0)
    setAdvForm({ ...defaultTokenListFormValues })
    setProposalPk(null)
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
    [t]
  )

  const propose = useCallback(async () => {
    const invalidFields = isFormValid(advForm)
    if (Object.keys(invalidFields).length) {
      return
    }
    if (!wallet?.publicKey || !vsrClient || !connectionContext) return
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

    const proposalTx = []

    const registerTokenIx = await client!.program.methods
      .tokenRegister(
        Number(advForm.tokenIndex),
        advForm.name,
        {
          confFilter: Number(tierPreset.oracleConfFilter),
          maxStalenessSlots: Number(tierPreset.maxStalenessSlots),
        },
        {
          adjustmentFactor: Number(tierPreset.adjustmentFactor),
          util0: Number(tierPreset.util0),
          rate0: Number(tierPreset.rate0),
          util1: Number(tierPreset.util1),
          rate1: Number(tierPreset.rate1),
          maxRate: Number(tierPreset.maxRate),
        },
        Number(tierPreset.loanFeeRate),
        Number(tierPreset.loanOriginationFeeRate),
        Number(tierPreset.maintAssetWeight),
        Number(tierPreset.initAssetWeight),
        Number(tierPreset.maintLiabWeight),
        Number(tierPreset.initLiabWeight),
        Number(tierPreset.liquidationFee),
        Number(tierPreset.minVaultToDepositsRatio),
        new BN(tierPreset.netBorrowLimitWindowSizeTs),
        new BN(tierPreset.netBorrowLimitPerWindowQuote)
      )
      .accounts({
        admin: MANGO_DAO_WALLET,
        group: group!.publicKey,
        mint: new PublicKey(advForm.mintPk),
        oracle: new PublicKey(advForm.oraclePk),
        payer: MANGO_DAO_WALLET,
        rent: SYSVAR_RENT_PUBKEY,
      })
      .instruction()

    proposalTx.push(registerTokenIx)

    const registerMarketix = await client!.program.methods
      .serum3RegisterMarket(Number(advForm.marketIndex), advForm.marketName)
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

    const walletSigner = wallet as never
    setCreatingProposal(true)
    try {
      const proposalAddress = await createProposal(
        connection,
        walletSigner,
        MANGO_DAO_WALLET_GOVERNANCE,
        voter.tokenOwnerRecord!,
        advForm.proposalTitle,
        advForm.proposalDescription,
        advForm.tokenIndex,
        proposalTx,
        vsrClient
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
    advForm,
    client,
    connection,
    connectionContext,
    getCurrentVotingPower,
    group,
    isFormValid,
    minVoterWeight,
    mintVoterWeightNumber,
    t,
    voter.tokenOwnerRecord,
    voter.voteWeight,
    vsrClient,
    wallet,
  ])

  const closeCreateOpenBookMarketModal = () => {
    setCreateOpenbookMarket(false)
    if (currentTokenInfo) {
      getListingParams(currentTokenInfo)
    }
  }
  const closeCreateOracleModal = () => {
    setOracleModalOpen(false)
    if (currentTokenInfo) {
      getListingParams(currentTokenInfo)
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
                <div className="flex items-center justify-between">
                  <p>{t('mint')}</p>
                  <p className="flex items-center">
                    {abbreviateAddress(
                      new PublicKey(currentTokenInfo?.address)
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
                                  e.target.value
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
                                  e.target.value
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
                                  e.target.value
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
                                  e.target.value
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
                {!advForm.openBookMarketExternalPk && !loadingListingParams ? (
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
                      !advForm.openBookMarketExternalPk
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
                            {t('cant-list-oracle-not-found')}
                          </a>
                        </div>
                      }
                      type="error"
                    />
                    <CreateSwitchboardOracleModal
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
              <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
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
                        !loadingListingParams)
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
                  <Button onClick={handleConnect} size="large">
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
