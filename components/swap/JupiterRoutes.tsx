import { useEffect, useState } from 'react'
import { TransactionInstruction, PublicKey } from '@solana/web3.js'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { Jupiter, RouteInfo } from '@jup-ag/core'

import mangoStore, { CLUSTER } from '../../store/state'
import RoutesModal from './RoutesModal'
import RouteFeeInfo from './RouteFeeInfo'
import { TokenInfo } from '../../types/jupiter'
import Button from '../shared/Button'
import Loading from '../shared/Loading'

type JupiterRoutesProps = {
  inputToken: string
  outputToken: string
  amountIn: number
  slippage: number
  submitting: boolean
  handleSwap: (x: TransactionInstruction[]) => void
  setAmountOut: (x?: number) => void
}

const parseJupiterRoute = async (
  jupiter: Jupiter,
  selectedRoute: RouteInfo,
  userPublicKey: PublicKey
): Promise<TransactionInstruction[]> => {
  const { transactions } = await jupiter.exchange({
    routeInfo: selectedRoute,
    userPublicKey,
  })
  const { setupTransaction, swapTransaction } = transactions
  const instructions = []
  for (const ix of swapTransaction.instructions) {
    if (
      ix.programId.toBase58() === 'JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo'
    ) {
      instructions.push(ix)
    }
  }

  return instructions
}

const getBestRoute = (routesInfos: RouteInfo[]) => {
  return routesInfos[0]
}

const JupiterRoutes = ({
  inputToken,
  outputToken,
  amountIn,
  slippage,
  handleSwap,
  submitting,
  setAmountOut,
}: JupiterRoutesProps) => {
  const [jupiter, setJupiter] = useState<Jupiter>()
  const [routes, setRoutes] = useState<RouteInfo[]>()
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>()
  const [showRoutesModal, setShowRoutesModal] = useState(false)
  const [outputTokenInfo, setOutputTokenInfo] = useState<TokenInfo>()
  const mangoAccount = mangoStore((s) => s.mangoAccount)
  const connected = mangoStore((s) => s.connected)

  const onSwap = async () => {
    if (!jupiter || !selectedRoute) return
    const ixs = await parseJupiterRoute(
      jupiter,
      selectedRoute,
      mangoAccount!.owner
    )
    handleSwap(ixs)
  }

  useEffect(() => {
    const connection = mangoStore.getState().connection
    const loadJupiter = async () => {
      const jupiter = await Jupiter.load({
        connection,
        cluster: CLUSTER,
        // platformFeeAndAccounts:  NO_PLATFORM_FEE,
        routeCacheDuration: 5_000, // Will not refetch data on computeRoutes for up to 10 seconds
      })
      setJupiter(jupiter)
    }
    loadJupiter()
  }, [])

  useEffect(() => {
    const group = mangoStore.getState().group
    if (!group) return
    const tokens = mangoStore.getState().jupiterTokens

    const loadRoutes = async () => {
      const inputBank = group!.banksMap.get(inputToken)
      const outputBank = group!.banksMap.get(outputToken)
      if (!inputBank || !outputBank) return
      if (!amountIn) {
        setAmountOut()
        setSelectedRoute(undefined)
      } else {
        const computedRoutes = await jupiter?.computeRoutes({
          inputMint: inputBank.mint, // Mint address of the input token
          outputMint: outputBank.mint, // Mint address of the output token
          inputAmount: amountIn * 10 ** inputBank.mintDecimals, // raw input amount of tokens
          slippage, // The slippage in % terms
          filterTopNResult: 10,
          onlyDirectRoutes: true,
        })
        const tokenOut = tokens.find(
          (t: any) => t.address === outputBank.mint.toString()
        )
        setOutputTokenInfo(tokenOut)
        const routesInfosWithoutRaydium = computedRoutes?.routesInfos.filter(
          (r) => {
            if (r.marketInfos.length > 1) {
              for (const mkt of r.marketInfos) {
                if (mkt.amm.label === 'Raydium') return false
              }
            }
            return true
          }
        )
        if (routesInfosWithoutRaydium?.length) {
          setRoutes(routesInfosWithoutRaydium)
          const bestRoute = getBestRoute(computedRoutes!.routesInfos)
          setSelectedRoute(bestRoute)
          setAmountOut(toUiDecimals(bestRoute.outAmount, tokenOut?.decimals))
        }
      }
    }

    loadRoutes()
  }, [inputToken, outputToken, jupiter, slippage, amountIn])

  return (
    <div className="mt-4">
      <div className="flex justify-center">
        <Button
          onClick={onSwap}
          className="flex w-full justify-center py-3"
          disabled={!connected}
        >
          {submitting ? <Loading className="mr-2 h-5 w-5" /> : null}
          {connected ? 'Swap' : 'Connect wallet'}
        </Button>
      </div>
      {routes?.length && selectedRoute && outputTokenInfo ? (
        <>
          <RouteFeeInfo
            selectedRoute={selectedRoute}
            amountIn={amountIn}
            amountOut={toUiDecimals(
              selectedRoute.outAmount,
              outputTokenInfo.decimals
            )}
            inputTokenSymbol={inputToken}
            outputTokenInfo={outputTokenInfo}
            showRoutesModal={() => setShowRoutesModal(true)}
          />
          {showRoutesModal ? (
            <RoutesModal
              show={showRoutesModal}
              onClose={() => setShowRoutesModal(false)}
              setSelectedRoute={setSelectedRoute}
              selectedRoute={selectedRoute}
              routes={routes}
              inputTokenSymbol={inputToken}
              outputTokenInfo={outputTokenInfo}
            />
          ) : null}
        </>
      ) : null}
    </div>
  )
}

export default JupiterRoutes
