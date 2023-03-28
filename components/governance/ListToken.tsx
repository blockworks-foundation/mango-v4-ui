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
import { PublicKey, SYSVAR_RENT_PUBKEY } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { OPENBOOK_PROGRAM_ID, toNative } from '@blockworks-foundation/mango-v4'
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
} from '@heroicons/react/20/solid'
import BN from 'bn.js'
import { createProposal } from 'utils/governance/createProposal'
import GovernanceStore from '@store/governanceStore'
import { Market } from '@project-serum/serum'
import axios from 'axios'
import { notify } from 'utils/notifications'
import { tryGetPubKey } from 'utils/governance/tools'

interface TokenListForm {
  mintPk: string
  oraclePk: string
  oracleConfFilter: number
  maxStalenessSlots: string
  name: string
  adjustmentFactor: number
  util0: number
  rate0: number
  util1: number
  rate1: number
  maxRate: number
  loanFeeRate: number
  loanOriginationFeeRate: number
  maintAssetWeight: number
  initAssetWeight: number
  maintLiabWeight: number
  initLiabWeight: number
  liquidationFee: number
  minVaultToDepositsRatio: number
  netBorrowLimitWindowSizeTs: number
  netBorrowLimitPerWindowQuote: number
  tokenIndex: number
  openBookMarketExternalPk: string
  baseBankPk: string
  quoteBankPk: string
  marketIndex: number
  openBookProgram: string
  marketName: string
}

const defaultTokenListFormValues = {
  mintPk: '',
  maxStalenessSlots: '',
  oraclePk: '',
  oracleConfFilter: 0.1,
  name: '',
  adjustmentFactor: 0.004,
  util0: 0.7,
  rate0: 0.1,
  util1: 0.85,
  rate1: 0.2,
  maxRate: 2.0,
  loanFeeRate: 0.005,
  loanOriginationFeeRate: 0.0005,
  maintAssetWeight: 1,
  initAssetWeight: 1,
  maintLiabWeight: 1,
  initLiabWeight: 1,
  liquidationFee: 0,
  minVaultToDepositsRatio: 0.2,
  netBorrowLimitWindowSizeTs: 24 * 60 * 60,
  netBorrowLimitPerWindowQuote: toNative(1000000, 6).toNumber(),
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
  const { voter, vsrClient } = GovernanceStore()

  const [advForm, setAdvForm] = useState<TokenListForm>({
    ...defaultTokenListFormValues,
  })
  const [showAdvFields, setShowAdvFields] = useState(false)
  const [tokenList, setTokenList] = useState<Token[]>([])
  const [priceImpact, setPriceImpact] = useState<number>(0)
  const [currentTokenInfo, setCurrentTokenInfo] = useState<
    Token | null | undefined
  >(null)
  const [proposalPk, setProposalPk] = useState<string | null>(null)
  const [mint, setMint] = useState('')

  const handleSetAdvForm = (propertyName: string, value: string | number) => {
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
    const [oraclePk, proposals, marketPk] = await Promise.all([
      getOracle(tokenInfo.symbol),
      getAllProposals(connection, MANGO_GOVERNANCE_PROGRAM, MANGO_REALM_PK),
      getBestMarket(mint),
    ])

    const index = proposals.flatMap((x) => x).length
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
        wallet.publicKey!.toBase58()
      )
      setPriceImpact(bestRoute ? bestRoute.priceImpactPct * 100 : 100)
    } catch (e) {
      notify({
        title: `Error during liquidity check`,
        description: `${e}`,
        type: 'info',
      })
    }
  }
  const getOracle = async (tokenSymbol: string) => {
    try {
      const pythClient = new PythHttpClient(connection, MAINNET_PYTH_PROGRAM)
      const pythAccounts = await pythClient.getData()
      const product = pythAccounts.products.find(
        (x) => x.base === tokenSymbol.toUpperCase()
      )
      return product?.price_account || ''
    } catch (e) {
      notify({
        title: `Pyth oracle not found`,
        description: `${e}`,
        type: 'error',
      })
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
    const proposalTx = []

    const registerTokenIx = await client!.program.methods
      .tokenRegister(
        Number(advForm.tokenIndex),
        advForm.name,
        {
          confFilter: Number(advForm.oracleConfFilter),
          maxStalenessSlots:
            advForm.maxStalenessSlots !== ''
              ? Number(advForm.maxStalenessSlots)
              : null,
        },
        {
          adjustmentFactor: Number(advForm.adjustmentFactor),
          util0: Number(advForm.util0),
          rate0: Number(advForm.rate0),
          util1: Number(advForm.util1),
          rate1: Number(advForm.rate1),
          maxRate: Number(advForm.maxRate),
        },
        Number(advForm.loanFeeRate),
        Number(advForm.loanOriginationFeeRate),
        Number(advForm.maintAssetWeight),
        Number(advForm.initAssetWeight),
        Number(advForm.maintLiabWeight),
        Number(advForm.initLiabWeight),
        Number(advForm.liquidationFee),
        Number(advForm.minVaultToDepositsRatio),
        new BN(advForm.netBorrowLimitWindowSizeTs),
        new BN(advForm.netBorrowLimitPerWindowQuote)
      )
      .accounts({
        group: group!.publicKey,
        admin: MANGO_DAO_WALLET,
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
      voter.tokenOwnerRecord,
      `List ${advForm.name} on mango-v4 `,
      '',
      advForm.tokenIndex,
      proposalTx,
      vsrClient!
    )
    setProposalPk(proposalAddress.toBase58())
  }

  useEffect(() => {
    setTokenList([])
  }, [CLUSTER])

  return (
    <div>
      <h3>New Listing</h3>
      {!currentTokenInfo ? (
        <>
          <div>
            <h5>Before you propose listing token on Mango:</h5>
            <ul>
              <li>Have you read our New Token Listing guide?</li>
              <li>Is there sufficient liqudity on USDC and SOL pairs?</li>
              <li>New tokens are approved by DAO vote. this takes 3 days</li>
            </ul>
          </div>
          <div>
            <Label text={'Token mint'} />
            <Input
              type="text"
              value={mint}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setMint(e.target.value)
              }
            />
            <Button onClick={handleTokenFind}>Find token</Button>
            <div className="text-th-warning">
              {currentTokenInfo === undefined && 'Token not found'}
            </div>
          </div>
        </>
      ) : (
        <>
          {proposalPk ? (
            <>
              <h3>Token details</h3>
              <div>Proposal listed!</div>
              <div>
                Your proposal url:{' '}
                {`https://dao.mango.markets/dao/MNGO/proposal/${proposalPk}`}
              </div>
            </>
          ) : (
            <>
              <div>
                <div>
                  name:{' '}
                  <img
                    src={currentTokenInfo?.logoURI}
                    className="h-5 w-5"
                  ></img>
                  {currentTokenInfo?.name}
                </div>
                <div>symbol: {currentTokenInfo?.symbol}</div>
                <div>mint: {currentTokenInfo?.address}</div>
                {priceImpact > 1 && (
                  <div>
                    Warning: Low liquidity price impact of{' '}
                    {priceImpact.toPrecision(2)}% on 10k USDC swap
                  </div>
                )}
                {!advForm.oraclePk && (
                  <div>
                    Cant list token pyth oracle not found for given mint
                  </div>
                )}
                {!advForm.openBookMarketExternalPk && (
                  <div>
                    Cant list token open book market not found for given mint
                  </div>
                )}
              </div>
              <div>
                <div>
                  Adv fields
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
                      type="text"
                      value={advForm.oraclePk}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('oraclePk', e.target.value)
                      }
                    />
                    <Label text={'Oracle Confidence Filter'} />
                    <Input
                      type="number"
                      value={advForm.oracleConfFilter.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('oracleConfFilter', e.target.value)
                      }
                    />
                    <Label text={'Max Staleness Slots'} />
                    <Input
                      type="number"
                      value={advForm.maxStalenessSlots}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('maxStalenessSlots', e.target.value)
                      }
                    />
                    <Label text={'Token Name'} />
                    <Input
                      type="text"
                      value={advForm.name}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('name', e.target.value)
                      }
                    />
                    <Label text={'Interest rate adjustment factor'} />
                    <Input
                      type="text"
                      value={advForm.adjustmentFactor.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('adjustmentFactor', e.target.value)
                      }
                    />
                    <Label text={'Interest rate utilization point 0'} />
                    <Input
                      type="text"
                      value={advForm.util0.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('util0', e.target.value)
                      }
                    />
                    <Label text={'Interest rate point 0'} />
                    <Input
                      type="text"
                      value={advForm.rate0.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('rate0', e.target.value)
                      }
                    />
                    <Label text={'Interest rate utilization point 1'} />
                    <Input
                      type="text"
                      value={advForm.util1.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('util1', e.target.value)
                      }
                    />
                    <Label text={'Interest rate point 1'} />
                    <Input
                      type="text"
                      value={advForm.rate1.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('rate1', e.target.value)
                      }
                    />
                    <Label text={'Interest rate max rate'} />
                    <Input
                      type="text"
                      value={advForm.maxRate.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('maxRate', e.target.value)
                      }
                    />
                    <Label text={'Loan Fee Rate'} />
                    <Input
                      type="text"
                      value={advForm.loanFeeRate.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('loanFeeRate', e.target.value)
                      }
                    />
                    <Label text={'Loan Origination Fee Rate'} />
                    <Input
                      type="text"
                      value={advForm.loanOriginationFeeRate.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm(
                          'loanOriginationFeeRate',
                          e.target.value
                        )
                      }
                    />
                    <Label text={'Maintenance Asset Weight'} />
                    <Input
                      type="text"
                      value={advForm.maintAssetWeight.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('maintAssetWeight', e.target.value)
                      }
                    />
                    <Label text={'Init Asset Weight'} />
                    <Input
                      type="text"
                      value={advForm.initAssetWeight.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('initAssetWeight', e.target.value)
                      }
                    />
                    <Label text={'Maintenance Liab Weight'} />
                    <Input
                      type="text"
                      value={advForm.maintLiabWeight.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('maintLiabWeight', e.target.value)
                      }
                    />
                    <Label text={'Init Liab Weight'} />
                    <Input
                      type="text"
                      value={advForm.initLiabWeight.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('initLiabWeight', e.target.value)
                      }
                    />
                    <Label text={'Liquidation Fee'} />
                    <Input
                      type="text"
                      value={advForm.liquidationFee.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('liquidationFee', e.target.value)
                      }
                    />
                    <Label text={'Min Vault To Deposits Ratio'} />
                    <Input
                      type="text"
                      value={advForm.minVaultToDepositsRatio.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm(
                          'minVaultToDepositsRatio',
                          e.target.value
                        )
                      }
                    />
                    <Label text={'Net Borrow Limit Window Size'} />
                    <Input
                      type="text"
                      value={advForm.netBorrowLimitWindowSizeTs.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm(
                          'netBorrowLimitWindowSizeTs',
                          e.target.value
                        )
                      }
                    />
                    <Label text={'Net Borrow Limit Per Window Quote'} />
                    <Input
                      type="text"
                      value={advForm.netBorrowLimitPerWindowQuote.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm(
                          'netBorrowLimitPerWindowQuote',
                          e.target.value
                        )
                      }
                    />
                    <Label text={'Token Index'} />
                    <Input
                      type="text"
                      value={advForm.tokenIndex.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('tokenIndex', e.target.value)
                      }
                    />
                    <Label text={'Openbook Market External'} />
                    <Input
                      type="text"
                      value={advForm.openBookMarketExternalPk.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm(
                          'openBookMarketExternalPk',
                          e.target.value
                        )
                      }
                    />
                    <Label text={'Base Bank'} />
                    <Input
                      type="text"
                      value={advForm.baseBankPk.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('baseBankPk', e.target.value)
                      }
                    />
                    <Label text={'Quote Bank'} />
                    <Input
                      type="text"
                      value={advForm.quoteBankPk.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('quoteBankPk', e.target.value)
                      }
                    />
                    <Label text={'Openbook Program'} />
                    <Input
                      type="text"
                      value={advForm.openBookProgram.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('openBookProgram', e.target.value)
                      }
                    />
                    <Label text={'Market Name'} />
                    <Input
                      type="text"
                      value={advForm.marketName.toString()}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleSetAdvForm('marketName', e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
              <div>
                <Button onClick={cancel}>Cancel</Button>
                <Button onClick={propose}>Propose</Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default ListToken
