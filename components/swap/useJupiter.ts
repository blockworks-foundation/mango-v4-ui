import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { Jupiter, RouteInfo } from '@jup-ag/core'
import { useEffect, useState } from 'react'
import JSBI from 'jsbi'
import Decimal from 'decimal.js'

import mangoStore, { CLUSTER } from '../../store/state'
import { Token } from '../../types/jupiter'
import { PublicKey } from '@solana/web3.js'

type useJupiterPropTypes = {
  inputTokenInfo: Token | undefined
  outputTokenInfo: Token | undefined
  inputAmount: string
  slippage: number
}

type RouteParams = {
  routes: RouteInfo[]
  amountOut: number
}

const defaultComputedInfo = {
  routes: [],
  amountOut: 0,
}

const useJupiter = ({
  inputTokenInfo,
  outputTokenInfo,
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
      if (!outputTokenInfo || !inputTokenInfo) return
      if (!inputAmount) {
        setComputedInfo(defaultComputedInfo)
      } else {
        try {
          const computedRoutes = await jupiter
            ?.computeRoutes({
              inputMint: new PublicKey(inputTokenInfo.address), // Mint address of the input token
              outputMint: new PublicKey(outputTokenInfo.address), // Mint address of the output token
              amount: JSBI.BigInt(
                new Decimal(inputAmount).mul(10 ** inputTokenInfo.decimals)
              ),
              slippage, // The slippage in % terms
              filterTopNResult: 10,
              onlyDirectRoutes: true,
            })
            .catch((e) => {
              console.error('Error computing Jupiter routes:', e)
              return
            })

          const routesInfosWithoutRaydium = computedRoutes?.routesInfos.filter(
            (r) => {
              for (const mkt of r.marketInfos) {
                if (mkt.amm.label === 'Raydium' || mkt.amm.label === 'Serum')
                  return false
              }

              return true
            }
          )
          if (routesInfosWithoutRaydium?.length) {
            const bestRoute = routesInfosWithoutRaydium[0]

            setComputedInfo({
              routes: routesInfosWithoutRaydium,
              amountOut: toUiDecimals(
                JSBI.toNumber(bestRoute.outAmount),
                outputTokenInfo.decimals!
              ),
            })
          }
        } catch (e) {
          console.warn(e)
        }
      }
    }

    loadRoutes()
  }, [inputTokenInfo, outputTokenInfo, jupiter, slippage, inputAmount])

  return { jupiter, ...computedInfo }
}

export default useJupiter
