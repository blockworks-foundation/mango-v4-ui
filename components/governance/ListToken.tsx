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
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { toNative } from '@blockworks-foundation/mango-v4'
import { PythHttpClient } from '@pythnetwork/client'
import { MAINNET_PYTH_PROGRAM } from 'utils/governance/constants'
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
}

const ListToken = () => {
  const { publicKey } = useWallet()
  const { connection } = mangoStore()

  const [advForm, setAdvForm] = useState<TokenListForm>({
    ...defaultTokenListFormValues,
  })
  const [tokenList, setTokenList] = useState<Token[]>([])
  const [priceImpact, setPriceImpact] = useState<number>(0)
  const [currentTokenInfo, setCurrentTokenInfo] = useState<
    Token | null | undefined
  >(null)
  const [mint, setMint] = useState('')

  const handleSetAdvForm = (propertyName: string, value: string | number) => {
    setAdvForm({ ...advForm, [propertyName]: value })
  }
  const handleTokenFind = async () => {
    let currentTokenList: Token[] = tokenList
    cancel()
    if (!tokenList.length) {
      const url =
        CLUSTER === 'devnet' ? JUPITER_API_DEVNET : JUPITER_API_MAINNET
      const response = await fetch(url)
      const data: Token[] = await response.json()
      currentTokenList = data
      setTokenList(data)
    }
    const tokenInfo = currentTokenList.find((x) => x.address === mint)
    setCurrentTokenInfo(tokenInfo)
    if (tokenInfo) {
      handleLiqudityCheck(new PublicKey(mint))
      handleGetOracle(tokenInfo.symbol)
      setAdvForm({ ...advForm, mintPk: mint, name: tokenInfo.symbol })
    }
  }
  const handleLiqudityCheck = async (tokenMint: PublicKey) => {
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
      publicKey!.toBase58()
    )
    setPriceImpact(bestRoute ? bestRoute.priceImpactPct * 100 : 100)
  }
  const handleGetOracle = async (tokenSymbol: string) => {
    const pythClient = new PythHttpClient(connection, MAINNET_PYTH_PROGRAM)
    const pythAccounts = await pythClient.getData()
    const product = pythAccounts.products.find(
      (x) => x.base === tokenSymbol.toUpperCase()
    )
    setAdvForm({ ...advForm, oraclePk: product?.price_account || '' })
  }
  const cancel = () => {
    setMint('')
    setCurrentTokenInfo(null)
    setPriceImpact(0)
    setAdvForm({ ...defaultTokenListFormValues })
  }
  const propose = () => {
    return null
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
          <h3>Token details</h3>
          <div>
            <div>
              name:{' '}
              <img src={currentTokenInfo?.logoURI} className="h-5 w-5"></img>
              {currentTokenInfo?.name}
            </div>
            <div>symbol: {currentTokenInfo?.symbol}</div>
            <div>mint: {currentTokenInfo?.address}</div>
            {priceImpact > 1 && (
              <div>
                Insufficiency liquidity price impact of{' '}
                {priceImpact.toPrecision(4)}% on 10k USDC swap
              </div>
            )}
            {!advForm.oraclePk && <div>Pyth oracle not found</div>}
          </div>
          <div>
            Adv fields
            <div>
              <Label text={'oraclePk'} />
              <Input
                type="text"
                value={advForm.oraclePk}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleSetAdvForm('oraclePk', e.target.value)
                }
              />
            </div>
          </div>
          <div>
            <Button onClick={cancel}>Cancel</Button>
            <Button onClick={propose}>Propose</Button>
          </div>
        </>
      )}
    </div>
  )
}

export default ListToken
