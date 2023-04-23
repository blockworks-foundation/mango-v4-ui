import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button from '@components/shared/Button'
import { ChangeEvent, useEffect, useState } from 'react'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import { Token } from 'types/jupiter'
import { handleGetRoutes } from '@components/swap/useQuoteRoutes'
import {
  JUPITER_API_DEVNET,
  JUPITER_API_MAINNET,
  USDC_MINT,
} from 'utils/constants'
import { Keypair, PublicKey, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { OPENBOOK_PROGRAM_ID } from '@blockworks-foundation/mango-v4'
import { PythHttpClient } from '@pythnetwork/client'
import {
  MAINNET_PYTH_PROGRAM,
  MANGO_DAO_WALLET,
  MANGO_DAO_WALLET_GOVERNANCE,
  MANGO_MINT_DECIMALS,
} from 'utils/governance/constants'
import {
  ChevronDownIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid'
import BN from 'bn.js'
import { createProposal } from 'utils/governance/instructions/createProposal'
import GovernanceStore from '@store/governanceStore'
import { Market } from '@project-serum/serum'
import { notify } from 'utils/notifications'
import { fmtTokenAmount, tryGetPubKey } from 'utils/governance/tools'
import { useTranslation } from 'next-i18next'
import OnBoarding from '../OnBoarding'
import { emptyPk } from 'utils/governance/accounts/vsrAccounts'
import { AnchorProvider, Program } from '@project-serum/anchor'
import EmptyWallet from 'utils/wallet'
import Loading from '@components/shared/Loading'
import ListTokenSuccess from './ListTokenSuccess'
import InlineNotification from '@components/shared/InlineNotification'
import { Disclosure } from '@headlessui/react'
import { useEnhancedWallet } from '@components/wallet/EnhancedWalletProvider'
import { abbreviateAddress } from 'utils/formatting'
import { formatNumericValue } from 'utils/numbers'
import useMangoGroup from 'hooks/useMangoGroup'

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

const ListToken = () => {
  const wallet = useWallet()
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
  const fetchVoter = GovernanceStore((s) => s.fetchVoter)
  const connectionContext = GovernanceStore((s) => s.connectionContext)
  const { t } = useTranslation(['governance'])

  const [advForm, setAdvForm] = useState<TokenListForm>({
    ...defaultTokenListFormValues,
  })
  const [loadingListingParams, setLoadingListingParams] = useState(false)
  const [tokenList, setTokenList] = useState<Token[]>([])
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [priceImpact, setPriceImpact] = useState<number>(0)
  const [currentTokenInfo, setCurrentTokenInfo] = useState<
    Token | null | undefined
  >(null)
  const [proposalPk, setProposalPk] = useState<string | null>(null)
  const [mint, setMint] = useState('')
  const [creatingProposal, setCreatingProposal] = useState(false)
  const minVoterWeight = governances
    ? governances[MANGO_DAO_WALLET_GOVERNANCE.toBase58()].account.config
        .minCommunityTokensToCreateProposal
    : new BN(0)
  const mintVoterWeightNumber = governances
    ? fmtTokenAmount(minVoterWeight, MANGO_MINT_DECIMALS)
    : 0

  const handleSetAdvForm = (propertyName: string, value: string | number) => {
    setFormErrors({})
    setAdvForm({ ...advForm, [propertyName]: value })
  }

  const handleTokenFind = async () => {
    cancel()
    if (!tryGetPubKey(mint)) {
      notify({
        title: t('enter-valid-token-mint'),
        type: 'error',
      })
      return
    }
    let currentTokenList: Token[] = tokenList
    if (!tokenList.length) {
      currentTokenList = await getTokenList()
      setTokenList(currentTokenList)
    }
    const tokenInfo = currentTokenList.find((x) => x.address === mint)
    setCurrentTokenInfo(tokenInfo)
    if (tokenInfo) {
      handleLiqudityCheck(new PublicKey(mint))
      getListingParams(tokenInfo)
    }
  }

  const getTokenList = async () => {
    try {
      const url =
        CLUSTER === 'devnet' ? JUPITER_API_DEVNET : JUPITER_API_MAINNET
      const response = await fetch(url)
      const data: Token[] = await response.json()
      return data
    } catch (e) {
      notify({
        title: t('cant-find-token-for-mint'),
        description: `${e}`,
        type: 'error',
      })
      return []
    }
  }

  const getListingParams = async (tokenInfo: Token) => {
    setLoadingListingParams(true)
    const [oraclePk, marketPk] = await Promise.all([
      getOracle(tokenInfo.symbol),
      getBestMarket(mint),
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
  }

  const handleLiqudityCheck = async (tokenMint: PublicKey) => {
    try {
      //we check price impact on token for 10k USDC
      const USDC_AMOUNT = 10000000000
      const SLIPPAGE_BPS = 50
      const MODE = 'ExactIn'
      const FEE = 0
      const { bestRoute } = await handleGetRoutes(
        USDC_MINT,
        tokenMint.toBase58(),
        USDC_AMOUNT,
        SLIPPAGE_BPS,
        MODE,
        FEE,
        wallet.publicKey ? wallet.publicKey?.toBase58() : emptyPk
      )
      setPriceImpact(bestRoute ? bestRoute.priceImpactPct * 100 : 100)
    } catch (e) {
      notify({
        title: t('liquidity-check-error'),
        description: `${e}`,
        type: 'error',
      })
    }
  }

  const getOracle = async (tokenSymbol: string) => {
    try {
      let oraclePk = ''
      const pythOracle = await getPythOracle(tokenSymbol)
      if (pythOracle) {
        oraclePk = pythOracle
      } else {
        const switchBoardOracle = await getSwitchBoardOracle(tokenSymbol)
        oraclePk = switchBoardOracle
      }

      return oraclePk
    } catch (e) {
      notify({
        title: t('oracle-not-found'),
        description: `${e}`,
        type: 'error',
      })
    }
  }

  const getPythOracle = async (tokenSymbol: string) => {
    try {
      const pythClient = new PythHttpClient(connection, MAINNET_PYTH_PROGRAM)
      const pythAccounts = await pythClient.getData()
      const product = pythAccounts.products.find(
        (x) => x.base === tokenSymbol.toUpperCase()
      )
      return product?.price_account || ''
    } catch (e) {
      notify({
        title: t('pyth-oracle-error'),
        description: `${e}`,
        type: 'error',
      })
      return ''
    }
  }

  const getSwitchBoardOracle = async (tokenSymbol: string) => {
    try {
      const VS_TOKEN_SYMBOL = 'usd'
      const SWITCHBOARD_PROGRAM_ID =
        'SW1TCH7qEPTdLsDHRgPuMQjbQxKdH2aBStViMFnt64f'

      const options = AnchorProvider.defaultOptions()
      const provider = new AnchorProvider(
        connection,
        new EmptyWallet(Keypair.generate()),
        options
      )
      const idl = await Program.fetchIdl(
        new PublicKey(SWITCHBOARD_PROGRAM_ID),
        provider
      )
      const switchboardProgram = new Program(
        idl!,
        new PublicKey(SWITCHBOARD_PROGRAM_ID),
        provider
      )

      const allFeeds =
        await switchboardProgram.account.aggregatorAccountData.all()

      const feedNames = allFeeds.map((x) =>
        String.fromCharCode(
          ...[...(x.account.name as number[])].filter((x) => x)
        )
      )
      const possibleFeedIndexes = feedNames.reduce(function (r, v, i) {
        return r.concat(
          v.toLowerCase().includes(tokenSymbol.toLowerCase()) &&
            v.toLowerCase().includes(VS_TOKEN_SYMBOL)
            ? i
            : []
        )
      }, [] as number[])

      const possibleFeeds = allFeeds.filter(
        (x, i) => possibleFeedIndexes.includes(i) && x.account.isLocked
      )
      return possibleFeeds.length ? possibleFeeds[0].publicKey.toBase58() : ''
    } catch (e) {
      notify({
        title: t('switch-oracle-error'),
        description: `${e}`,
        type: 'error',
      })
      return ''
    }
  }

  const getBestMarket = async (tokenMint: string) => {
    try {
      const dexProgramPk = OPENBOOK_PROGRAM_ID[CLUSTER]

      const markets = await Market.findAccountsByMints(
        connection,
        new PublicKey(tokenMint),
        new PublicKey(USDC_MINT),
        dexProgramPk
      )
      if (!markets.length) {
        return undefined
      }
      if (markets.length === 1) {
        return markets[0].publicKey
      }
      const marketsDataJsons = await Promise.all([
        ...markets.map((x) =>
          fetch(`/openSerumApi/market/${x.publicKey.toBase58()}`)
        ),
      ])
      const marketsData = await Promise.all([
        ...marketsDataJsons.map((x) => x.json()),
      ])

      const bestMarket = marketsData.sort((a, b) => b.volume24h - a.volume24h)

      return new PublicKey(bestMarket[0].id)
    } catch (e) {
      notify({
        title: t('openbook-market-not-found'),
        description: `${e}`,
        type: 'error',
      })
    }
  }

  const cancel = () => {
    setCurrentTokenInfo(null)
    setPriceImpact(0)
    setAdvForm({ ...defaultTokenListFormValues })
    setProposalPk(null)
  }

  const propose = async () => {
    const invalidFields = isFormValid(advForm)
    if (Object.keys(invalidFields).length) {
      return
    }
    if (!wallet?.publicKey || !vsrClient || !connectionContext) return
    await fetchVoter(wallet.publicKey, vsrClient, connectionContext)

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
      .tokenRegisterTrustless(Number(advForm.tokenIndex), advForm.name)
      .accounts({
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
  }

  const isFormValid = (advForm: TokenListForm) => {
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
    const textFields: (keyof TokenListForm)[] = ['marketName', 'proposalTitle']

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
  }

  useEffect(() => {
    setTokenList([])
  }, [CLUSTER])

  return (
    <div>
      <h1 className="mb-4 flex items-center">{t('new-listing')}</h1>
      {!currentTokenInfo ? (
        <>
          <div className="mb-6">
            <h2 className="mb-2 text-lg">{t('before-you-list')}</h2>
            <ul>
              <li className="mb-2 flex items-center text-base">
                <InformationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-fgd-4" />
                <span>
                  {t('before-listing-1')}{' '}
                  <a
                    href="https://dao.mango.markets"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t('mango-governance')}
                  </a>
                </span>
              </li>
              <li className="mb-2 flex items-center text-base">
                <InformationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-fgd-4" />
                <span>
                  {t('before-listing-2')}{' '}
                  <a
                    href="https://raydium.io/create-market"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {t('openbook-market')}
                  </a>
                </span>
              </li>
              <li className="mb-2 flex items-center text-base">
                <InformationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-fgd-4" />
                {t('before-listing-3')}
              </li>
              <li className="mb-2 flex items-center text-base">
                <InformationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-fgd-4" />
                {t('before-listing-4')}
              </li>
            </ul>
          </div>
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
            <ListTokenSuccess
              proposalPk={proposalPk}
              token={currentTokenInfo?.name}
            ></ListTokenSuccess>
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
              {!advForm.oraclePk && !loadingListingParams ? (
                <div className="my-4">
                  <InlineNotification
                    desc={t('cant-list-oracle-not-found')}
                    type="error"
                  />
                </div>
              ) : null}
              {!advForm.openBookMarketExternalPk && !loadingListingParams ? (
                <div className="mb-4">
                  <InlineNotification
                    desc={
                      <div>
                        <a
                          href="https://raydium.io/create-market"
                          rel="noopener noreferrer"
                          target="_blank"
                          className="underline"
                        >
                          {t('cant-list-no-openbook-market')}
                        </a>
                      </div>
                    }
                    type="error"
                  />
                </div>
              ) : null}
              <OnBoarding />
              <div className="mt-6 flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                {wallet.connected ? (
                  <Button
                    className="flex w-full items-center justify-center sm:w-44"
                    onClick={propose}
                    disabled={loadingRealm || loadingVoter}
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
                <Button secondary onClick={cancel} size="large">
                  {t('cancel')}
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ListToken
