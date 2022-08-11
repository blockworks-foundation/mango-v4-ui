import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { Jupiter, RouteInfo } from '@jup-ag/core'
import { useEffect, useState } from 'react'
import JSBI from 'jsbi'

import mangoStore, { CLUSTER } from '../../store/state'
import { Token } from '../../types/jupiter'

type useJupiterPropTypes = {
  inputTokenSymbol: string
  outputTokenSymbol: string
  inputAmount: number
  slippage: number
}

type RouteParams = {
  routes: RouteInfo[]
  outputTokenInfo: Token | undefined
  amountOut: number
}

const defaultComputedInfo = {
  routes: [],
  outputTokenInfo: undefined,
  amountOut: 0,
}

const useJupiter = ({
  inputTokenSymbol,
  outputTokenSymbol,
  inputAmount,
  slippage,
}: useJupiterPropTypes) => {
  const [jupiter, setJupiter] = useState<Jupiter>()
  const [computedInfo, setComputedInfo] =
    useState<RouteParams>(defaultComputedInfo)

  useEffect(() => {
    const connection = mangoStore.getState().connection
    const loadJupiter = async () => {
      const jupiter = await Jupiter.load({
        connection,
        cluster: CLUSTER,
        wrapUnwrapSOL: false,
        // platformFeeAndAccounts:  NO_PLATFORM_FEE,
        routeCacheDuration: 30_000, // Will not refetch data on computeRoutes for up to 10 seconds
      })
      setJupiter(jupiter)
    }
    try {
      loadJupiter()
    } catch (e) {
      console.warn(e)
    }
  }, [])

  useEffect(() => {
    const group = mangoStore.getState().group
    if (!group) return
    const tokens = mangoStore.getState().jupiterTokens

    const loadRoutes = async () => {
      const inputBank = group.banksMap.get(inputTokenSymbol)
      const outputBank = group.banksMap.get(outputTokenSymbol)
      if (!inputBank || !outputBank) return
      if (!inputAmount) {
        setComputedInfo(defaultComputedInfo)
      } else {
        try {
          const computedRoutes = await jupiter
            ?.computeRoutes({
              inputMint: inputBank.mint, // Mint address of the input token
              outputMint: outputBank.mint, // Mint address of the output token
              amount: JSBI.BigInt(
                inputAmount * 10 ** (inputBank.mintDecimals || 1)
              ),
              slippage, // The slippage in % terms
              filterTopNResult: 10,
              onlyDirectRoutes: true,
            })
            .catch((e) => {
              console.error('Error computing Jupiter routes:', e)
              return
            })
          const tokenOut = tokens.find(
            (t: any) => t.address === outputBank.mint.toString()
          )
          const routesInfosWithoutRaydium = computedRoutes?.routesInfos.filter(
            (r) => {
              for (const mkt of r.marketInfos) {
                if (mkt.amm.label === 'Raydium') return false
              }

              return true
            }
          )
          if (routesInfosWithoutRaydium?.length) {
            const bestRoute = routesInfosWithoutRaydium[0]

            setComputedInfo({
              routes: routesInfosWithoutRaydium,
              outputTokenInfo: tokenOut,
              amountOut: toUiDecimals(
                JSBI.toNumber(bestRoute.outAmount),
                tokenOut?.decimals!
              ),
            })
          }
        } catch (e) {
          console.warn(e)
        }
      }
    }

    loadRoutes()
  }, [inputTokenSymbol, outputTokenSymbol, jupiter, slippage, inputAmount])

  return { jupiter, ...computedInfo }
}

export default useJupiter
