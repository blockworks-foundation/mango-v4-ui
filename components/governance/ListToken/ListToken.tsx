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
  MANGO_GOVERNANCE_PROGRAM,
  MANGO_REALM_PK,
} from 'utils/governance/constants'
import { getAllProposals } from '@solana/spl-governance'
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/20/solid'
import BN from 'bn.js'
import { createProposal } from 'utils/governance/createProposal'
import GovernanceStore from '@store/governanceStore'
import { Market } from '@project-serum/serum'
import axios from 'axios'
import { notify } from 'utils/notifications'
import { tryGetPubKey } from 'utils/governance/tools'
import { useTranslation } from 'next-i18next'
import OnBoarding from '../OnBoarding'
import { emptyPk } from 'utils/governance/vsrAccounts'
import { AnchorProvider, Program } from '@project-serum/anchor'
import EmptyWallet from 'utils/wallet'
import Loading from '@components/shared/Loading'
import ListTokenSuccess from './ListTokenSuccess'

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
}

const ListToken = () => {
  const wallet = useWallet()
  const { connection, client, group } = mangoStore()
  const { voter, vsrClient, governances, loadingRealm, loadingVoter } =
    GovernanceStore()
  const { t } = useTranslation(['governance'])

  const [advForm, setAdvForm] = useState<TokenListForm>({
    ...defaultTokenListFormValues,
  })
  const [loadingListingParams, setLoadingListingParams] = useState(false)
  const [showAdvFields, setShowAdvFields] = useState(false)
  const [tokenList, setTokenList] = useState<Token[]>([])
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [priceImpact, setPriceImpact] = useState<number>(0)
  const [currentTokenInfo, setCurrentTokenInfo] = useState<
    Token | null | undefined
  >(null)
  const [proposalPk, setProposalPk] = useState<string | null>(null)
  const [mint, setMint] = useState('')
  const minVoterWeight = governances
    ? governances[MANGO_DAO_WALLET_GOVERNANCE.toBase58()].account.config
        .minCommunityTokensToCreateProposal
    : new BN(0)

  const handleSetAdvForm = (propertyName: string, value: string | number) => {
    setFormErrors({})
    setAdvForm({ ...advForm, [propertyName]: value })
  }
  const handleTokenFind = async () => {
    cancel()
    if (!tryGetPubKey(mint)) {
      notify({
        title: `Mint must be a PublicKey`,
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
        title: `Can't find token for given mint`,
        description: `${e}`,
        type: 'error',
      })
      return []
    }
  }
  const getListingParams = async (tokenInfo: Token) => {
    setLoadingListingParams(true)
    const [oraclePk, index, marketPk] = await Promise.all([
      getOracle(tokenInfo.symbol),
      handleGetMangoDaoProposalsIndex(),
      getBestMarket(mint),
    ])

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
        title: `Error during liquidity check`,
        description: `${e}`,
        type: 'error',
      })
    }
  }
  const handleGetMangoDaoProposalsIndex = async () => {
    try {
      const proposals = await getAllProposals(
        connection,
        MANGO_GOVERNANCE_PROGRAM,
        MANGO_REALM_PK
      )
      return proposals.flatMap((x) => x).length
    } catch (e) {
      notify({
        title: `Can't fetch proposals to get free index for proposal`,
        description: `${e}`,
        type: 'error',
      })
      return 0
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
        title: `Oracle not found`,
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
        title: `Pyth oracle get error`,
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
        title: `Switchboard oracle get error`,
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
      const marketsData = await Promise.all([
        ...markets.map((x) =>
          axios.get(`/openSerumApi/market/${x.publicKey.toBase58()}`)
        ),
      ])
      const bestMarket = marketsData
        .flatMap((x) => x.data)
        .sort((a, b) => b.volume24h - a.volume24h)

      return new PublicKey(bestMarket[0].id)
    } catch (e) {
      notify({
        title: 'Openbook market not found',
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
    const proposalAddress = await createProposal(
      connection,
      walletSigner,
      MANGO_DAO_WALLET_GOVERNANCE,
      voter.tokenOwnerRecord!,
      `List ${advForm.name} on Mango-v4 `,
      '',
      advForm.tokenIndex,
      proposalTx,
      vsrClient!
    )
    setProposalPk(proposalAddress.toBase58())
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
    const textFields: (keyof TokenListForm)[] = ['marketName']

    for (const key of pubkeyFields) {
      if (!tryGetPubKey(advForm[key] as string)) {
        invalidFields[key] = 'Invalid PublicKey'
      }
    }
    for (const key of numberFields) {
      if (isNaN(advForm[key] as number) || advForm[key] === '') {
        invalidFields[key] = 'Invalid Number'
      }
    }
    for (const key of textFields) {
      if (!advForm[key]) {
        invalidFields[key] = 'Field is required'
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
      <h3>
        {t('new-listing')}{' '}
        {(loadingRealm || loadingVoter) && <Loading className="w-3"></Loading>}
      </h3>
      {!currentTokenInfo ? (
        <>
          <div>
            <h5>{t('before-you-list')}</h5>
            <ul>
              <li>{t('before-listing-1')}</li>
              <li>{t('before-listing-2')}</li>
              <li>{t('before-listing-3')}</li>
            </ul>
          </div>
          <div>
            <Label text={t('token-mint')} />
            <Input
              type="text"
              value={mint}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setMint(e.target.value)
              }
            />
            <Button
              onClick={handleTokenFind}
              disabled={loadingVoter || loadingRealm}
            >
              {t('find-token')}
            </Button>
            <div className="text-th-warning">
              {currentTokenInfo === undefined && t('token-not-found')}
            </div>
          </div>
        </>
      ) : (
        <>
          {proposalPk ? (
            <ListTokenSuccess proposalPk={proposalPk}></ListTokenSuccess>
          ) : (
            <>
              <div>
                <div>
                  {t('name')}
                  <img
                    src={currentTokenInfo?.logoURI}
                    className="h-5 w-5"
                  ></img>
                  {currentTokenInfo?.name}
                </div>
                <div>
                  {t('symbol')} {currentTokenInfo?.symbol}
                </div>
                <div>
                  {t('mint')} {currentTokenInfo?.address}
                </div>
                {priceImpact > 1 && (
                  <div>
                    {t('liquidity-warning', {
                      priceImpactPct: priceImpact.toPrecision(2).toString(),
                    })}
                  </div>
                )}

                {!advForm.oraclePk && !loadingListingParams && (
                  <div>{t('cant-list-oracle-not-found')}</div>
                )}
                {!advForm.openBookMarketExternalPk && !loadingListingParams && (
                  <div>{t('cant-list-no-openbook-market')}</div>
                )}
              </div>
              <div>
                <div>
                  {t('adv-fields')}
                  {showAdvFields ? (
                    <ArrowUpCircleIcon
                      onClick={() => setShowAdvFields(false)}
                      className="w-5"
                    ></ArrowUpCircleIcon>
                  ) : (
                    <ArrowDownCircleIcon
                      onClick={() => setShowAdvFields(true)}
                      className="w-5"
                    ></ArrowDownCircleIcon>
                  )}
                </div>
                {showAdvFields && (
                  <div>
                    <Label text={'Oracle'} />
                    <Input
                      error={formErrors.oraclePk !== undefined}
                      type="text"
                      value={advForm.oraclePk}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('oraclePk', e.target.value)
                      }
                    />
                    {formErrors.oraclePk && (
                      <div className="mt-1.5 flex items-center space-x-1">
                        <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                        <p className="mb-0 text-xs text-th-down">
                          {formErrors.oraclePk}
                        </p>
                      </div>
                    )}
                    <Label text={'Token Index'} />
                    <Input
                      error={formErrors.tokenIndex !== undefined}
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
                    <Label text={'Openbook Market External'} />
                    <Input
                      error={formErrors.openBookMarketExternalPk !== undefined}
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
                    <Label text={'Base Bank'} />
                    <Input
                      error={formErrors.baseBankPk !== undefined}
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
                    <Label text={'Quote Bank'} />
                    <Input
                      error={formErrors.quoteBankPk !== undefined}
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
                    <Label text={'Openbook Program'} />
                    <Input
                      error={formErrors.openBookProgram !== undefined}
                      type="text"
                      value={advForm.openBookProgram.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('openBookProgram', e.target.value)
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
                    <Label text={'Market Name'} />
                    <Input
                      error={formErrors.marketName !== undefined}
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
                )}
              </div>
              <div>
                <Button onClick={cancel}>Cancel</Button>
                <Button
                  onClick={propose}
                  disabled={
                    !wallet.connected ||
                    voter.voteWeight.cmp(minVoterWeight) === -1 ||
                    loadingRealm ||
                    loadingVoter
                  }
                >
                  <div className="flex">
                    {!wallet.connected ? 'Connect your wallet' : 'Propose'}
                    {(loadingListingParams || loadingVoter || loadingRealm) && (
                      <Loading className="w-3"></Loading>
                    )}
                  </div>
                </Button>
              </div>
              <OnBoarding></OnBoarding>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ListToken
