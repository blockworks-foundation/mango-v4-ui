/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection, PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { JupiterV6RouteInfo } from 'types/jupiter'
import { MANGO_ROUTER_API_URL } from 'utils/constants'
import useJupiterSwapData from './useJupiterSwapData'
import { useMemo } from 'react'
import { JUPITER_V6_QUOTE_API_MAINNET } from 'utils/constants'
import { MangoAccount, toUiDecimals } from '@blockworks-foundation/mango-v4'
import { findRaydiumPoolInfo, getSwapTransaction } from 'utils/swap/raydium'
import mangoStore from '@store/mangoStore'
import { fetchJupiterTransaction } from './SwapReviewRouteInfo'
import useAnalytics from 'hooks/useAnalytics'

type SwapModes = 'ExactIn' | 'ExactOut'

type MultiRoutingMode = 'ALL' | 'ALL_AND_JUPITER_DIRECT'

type JupiterRoutingMode = 'JUPITER_DIRECT' | 'JUPITER'

type RaydiumRoutingMode = 'RAYDIUM'

type MangoRoutingMode = 'MANGO'

type RoutingMode =
  | MultiRoutingMode
  | JupiterRoutingMode
  | RaydiumRoutingMode
  | MangoRoutingMode

type useQuoteRoutesPropTypes = {
  inputMint: string | undefined
  outputMint: string | undefined
  amount: string
  slippage: number
  swapMode: SwapModes
  wallet: string | undefined
  mangoAccount: MangoAccount | undefined
  routingMode: RoutingMode
  enabled?: () => boolean
}

function isMultiRoutingMode(value: RoutingMode): value is MultiRoutingMode {
  return ['ALL', 'ALL_AND_JUPITER_DIRECT'].includes(value)
}

function isRaydiumRoutingMode(value: RoutingMode): value is RaydiumRoutingMode {
  return value === 'RAYDIUM'
}

const fetchJupiterRoute = async (
  inputMint: string | undefined,
  outputMint: string | undefined,
  amount = 0,
  slippage = 50,
  swapMode: SwapModes = 'ExactIn',
  onlyDirectRoutes = true,
  maxAccounts = 64,
  connection: Connection,
  wallet: string,
  sendAnalytics?: (data: object, tag: string) => Promise<void>,
) => {
  return new Promise<{ bestRoute: JupiterV6RouteInfo }>(
    // eslint-disable-next-line no-async-promise-executor
    async (resolve, reject) => {
      try {
        if (!inputMint || !outputMint) return
        const paramObj: {
          inputMint: string
          outputMint: string
          amount: string
          slippageBps: string
          swapMode: string
          onlyDirectRoutes: string
          maxAccounts?: string
        } = {
          inputMint: inputMint.toString(),
          outputMint: outputMint.toString(),
          amount: amount.toString(),
          slippageBps: Math.ceil(slippage * 100).toString(),
          swapMode,
          onlyDirectRoutes: `${onlyDirectRoutes}`,
        }
        //exact out is not supporting max account
        if (swapMode === 'ExactIn') {
          paramObj.maxAccounts = maxAccounts.toString()
        }
        const paramsString = new URLSearchParams(paramObj).toString()
        const response = await fetch(
          `${JUPITER_V6_QUOTE_API_MAINNET}/quote?${paramsString}`,
        )
        if (sendAnalytics) {
          sendAnalytics(
            {
              url: `${JUPITER_V6_QUOTE_API_MAINNET}/quote?${paramsString}`,
            },
            'fetchJupiterRoute',
          )
        }

        const res: JupiterV6RouteInfo = await response.json()
        if (res.error) {
          throw res.error
        }
        const [ixes] = await fetchJupiterTransaction(
          connection,
          res,
          new PublicKey(wallet),
          slippage,
          new PublicKey(inputMint),
          new PublicKey(outputMint),
          'jupiter',
        )

        if (
          [...ixes.flatMap((x) => x.keys.flatMap((k) => k.pubkey))].length >
          maxAccounts
        ) {
          throw 'Max accounts exceeded'
        }
        resolve({
          bestRoute: res,
        })
      } catch (e) {
        if (sendAnalytics) {
          sendAnalytics(
            {
              error: `${e}`,
            },
            'fetchJupiterRouteError',
          )
        }
        console.log('jupiter route error:', e)
        reject(e)
      }
    },
  )
}

const fetchRaydiumRoute = async (
  inputMint: string | undefined,
  outputMint: string | undefined,
  amount = 0,
  slippage = 50,
  connection: Connection,
  wallet: string,
  isInWalletSwap: boolean,
  sendAnalytics?: (data: object, tag: string) => Promise<void>,
) => {
  return new Promise<{ bestRoute: JupiterV6RouteInfo }>(
    // eslint-disable-next-line no-async-promise-executor
    async (resolve, reject) => {
      try {
        if (sendAnalytics) {
          sendAnalytics(
            {
              inputMint,
              outputMint,
              amount,
              slippage,
            },
            'fetchRaydiumRoute',
          )
        }

        if (!inputMint || !outputMint) return

        const poolKeys = await findRaydiumPoolInfo(
          connection,
          outputMint,
          inputMint,
        )

        if (poolKeys) {
          const resp = await getSwapTransaction(
            connection,
            outputMint,
            amount,
            poolKeys!,
            slippage,
            new PublicKey(wallet),
            isInWalletSwap,
          )
          resolve(resp as unknown as { bestRoute: JupiterV6RouteInfo })
        } else {
          throw 'No route found'
        }
      } catch (e) {
        if (sendAnalytics) {
          sendAnalytics(
            {
              error: `${e}`,
            },
            'raydiumRouteError',
          )
        }
        console.log('raydium route error:', e)
        reject(e)
      }
    },
  )
}

const fetchMangoRoute = async (
  inputMint = 'So11111111111111111111111111111111111111112',
  outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount = 0,
  slippage = 50,
  swapMode = 'ExactIn',
  sendAnalytics?: (data: object, tag: string) => Promise<void>,
) => {
  return new Promise<{ bestRoute: JupiterV6RouteInfo }>(
    // eslint-disable-next-line no-async-promise-executor
    async (resolve, reject) => {
      try {
        const paramsString = new URLSearchParams({
          inputMint: inputMint.toString(),
          outputMint: outputMint.toString(),
          amount: amount.toString(),
          slippageBps: Math.ceil(slippage * 100).toString(),
          mode: swapMode,
        }).toString()

        const response = await fetch(
          `${MANGO_ROUTER_API_URL}/quote?${paramsString}`,
        )
        if (sendAnalytics) {
          sendAnalytics(
            {
              url: `${MANGO_ROUTER_API_URL}/quote?${paramsString}`,
            },
            'fetchMangoRoute',
          )
        }
        if (response.status === 500) {
          throw 'No route found'
        }
        const res = await response.json()

        if (res.outAmount) {
          resolve({
            bestRoute: { ...res, origin: 'mango' },
          })
        } else {
          reject('No route found')
        }
      } catch (e) {
        if (sendAnalytics) {
          sendAnalytics(
            {
              error: `${e}`,
            },
            'mangoRouteError',
          )
        }
        console.log('mango router error:', e)
        reject(e)
      }
    },
  )
}

export async function handleGetRoutes(
  inputMint: string | undefined,
  outputMint: string | undefined,
  amount: number,
  slippage: number,
  swapMode: SwapModes,
  wallet: string | undefined,
  mangoAccount: MangoAccount | undefined,
  routingMode: MultiRoutingMode | RaydiumRoutingMode,
  connection: Connection,
  sendAnalytics: ((data: object, tag: string) => Promise<void>) | undefined,
  inputTokenDecimals: number,
): Promise<{ bestRoute: JupiterV6RouteInfo }>

export async function handleGetRoutes(
  inputMint: string | undefined,
  outputMint: string | undefined,
  amount: number,
  slippage: number,
  swapMode: SwapModes,
  wallet: string | undefined,
  mangoAccount: MangoAccount | undefined,
  routingMode: JupiterRoutingMode | MangoRoutingMode,
  connection: Connection,
  sendAnalytics: ((data: object, tag: string) => Promise<void>) | undefined,
): Promise<{ bestRoute: JupiterV6RouteInfo }>

export async function handleGetRoutes(
  inputMint: string | undefined,
  outputMint: string | undefined,
  amount: number,
  slippage: number,
  swapMode: 'ExactIn',
  wallet: string | undefined,
  mangoAccount: MangoAccount | undefined,
  routingMode: RaydiumRoutingMode,
  connection: Connection,
  sendAnalytics: ((data: object, tag: string) => Promise<void>) | undefined,
  inputTokenDecimals: number,
): Promise<{ bestRoute: JupiterV6RouteInfo }>

export async function handleGetRoutes(
  inputMint: string | undefined,
  outputMint: string | undefined,
  amount = 0,
  slippage = 50,
  swapMode: SwapModes,
  wallet: string | undefined,
  mangoAccount: MangoAccount | undefined,
  routingMode: RoutingMode = 'ALL',
  connection: Connection,
  sendAnalytics: ((data: object, tag: string) => Promise<void>) | undefined,
  inputTokenDecimals?: number,
) {
  try {
    if (sendAnalytics) {
      sendAnalytics(
        {
          inputMint,
          outputMint,
          amount,
          slippage,
          swapMode,
          wallet,
          routingMode,
        },
        'handleGetRoutes',
      )
    }

    wallet ||= PublicKey.default.toBase58()

    let maxAccounts: number
    if (!mangoAccount) {
      maxAccounts = 64
    } else {
      // TODO: replace with client method
      const totalSlots =
        2 * mangoAccount.tokensActive().length +
        mangoAccount.serum3Active().length +
        2 * mangoAccount.perpActive().length
      maxAccounts = 54 - totalSlots
    }

    const routes = []

    if (
      swapMode === 'ExactIn' &&
      (isMultiRoutingMode(routingMode) || isRaydiumRoutingMode(routingMode))
    ) {
      const raydiumRoute = fetchRaydiumRoute(
        inputMint,
        outputMint,
        toUiDecimals(amount, inputTokenDecimals!),
        slippage,
        connection,
        wallet,
        !mangoAccount,
        sendAnalytics,
      )
      routes.push(raydiumRoute)
    }

    if (
      routingMode === 'ALL_AND_JUPITER_DIRECT' ||
      routingMode === 'JUPITER_DIRECT'
    ) {
      const jupiterDirectRoute = fetchJupiterRoute(
        inputMint,
        outputMint,
        amount,
        slippage,
        swapMode,
        true,
        maxAccounts,
        connection,
        wallet,
        sendAnalytics,
      )
      routes.push(jupiterDirectRoute)
    }

    if (isMultiRoutingMode(routingMode) || routingMode === 'JUPITER') {
      const jupiterRoute = fetchJupiterRoute(
        inputMint,
        outputMint,
        amount,
        slippage,
        swapMode,
        false,
        maxAccounts,
        connection,
        wallet,
        sendAnalytics,
      )
      routes.push(jupiterRoute)
    }

    if (isMultiRoutingMode(routingMode) || routingMode === 'MANGO') {
      const mangoRoute = fetchMangoRoute(
        inputMint,
        outputMint,
        amount,
        slippage,
        swapMode,
        sendAnalytics,
      )
      routes.push(mangoRoute)
    }

    const results = await Promise.allSettled(routes)

    const responses = results
      .filter((x) => x.status === 'fulfilled' && x.value?.bestRoute !== null)
      .map((x) => (x as any).value)
    if (!responses.length) {
      throw 'No route found'
    }
    const sortedByBiggestOutAmount = (
      responses as {
        bestRoute: JupiterV6RouteInfo
      }[]
    ).sort((a, b) =>
      swapMode === 'ExactIn'
        ? Number(b.bestRoute.outAmount) - Number(a.bestRoute.outAmount)
        : Number(a.bestRoute.inAmount) - Number(b.bestRoute.inAmount),
    )
    return {
      bestRoute: sortedByBiggestOutAmount.length
        ? sortedByBiggestOutAmount[0]?.bestRoute
        : null,
    }
  } catch (e) {
    if (sendAnalytics) {
      sendAnalytics(
        {
          error: `${e}`,
        },
        'noRouteFoundError',
      )
    }
    return {
      bestRoute: null,
    }
  }
}

const useQuoteRoutes = ({
  inputMint,
  outputMint,
  amount,
  slippage,
  swapMode,
  wallet,
  mangoAccount,
  routingMode = 'ALL',
  enabled,
}: useQuoteRoutesPropTypes) => {
  const connection = mangoStore((s) => s.connection)
  const { sendAnalytics } = useAnalytics()
  const { inputTokenInfo, outputTokenInfo } = useJupiterSwapData()
  const decimals = useMemo(() => {
    return swapMode === 'ExactIn'
      ? inputTokenInfo?.decimals || 6
      : outputTokenInfo?.decimals || 6
  }, [swapMode, inputTokenInfo?.decimals, outputTokenInfo?.decimals])

  const nativeAmount = useMemo(() => {
    return amount && !Number.isNaN(+amount)
      ? new Decimal(amount).mul(10 ** decimals)
      : new Decimal(0)
  }, [amount, decimals])

  const res = useQuery<{ bestRoute: JupiterV6RouteInfo | null }, Error>(
    [
      [
        'swap-routes',
        nativeAmount.toString(),
        inputMint,
        outputMint,
        swapMode,
        wallet,
        routingMode,
      ],
      inputMint,
      outputMint,
      amount,
      slippage,
      swapMode,
      wallet,
      routingMode,
    ],
    async () => {
      if (
        isMultiRoutingMode(routingMode) ||
        isRaydiumRoutingMode(routingMode)
      ) {
        return handleGetRoutes(
          inputMint,
          outputMint,
          nativeAmount.toNumber(),
          slippage,
          swapMode,
          wallet,
          mangoAccount,
          routingMode,
          connection,
          sendAnalytics,
          decimals,
        )
      } else {
        return handleGetRoutes(
          inputMint,
          outputMint,
          nativeAmount.toNumber(),
          slippage,
          swapMode,
          wallet,
          mangoAccount,
          routingMode,
          connection,
          sendAnalytics,
        )
      }
    },
    {
      cacheTime: 1000 * 60,
      staleTime: 1000 * 3,
      enabled: enabled
        ? enabled()
        : nativeAmount.toNumber() && inputMint && outputMint
        ? true
        : false,
      refetchInterval: 20000,
      retry: 3,
    },
  )

  return amount
    ? {
        ...(res.data ?? {
          routes: [],
          bestRoute: undefined,
        }),
        isFetching: res.isFetching,
        isLoading: res.isLoading,
        isInitialLoading: res.isInitialLoading,
        refetch: res.refetch,
      }
    : {
        routes: [],
        bestRoute: undefined,
        isFetching: false,
        isLoading: false,
        isInitialLoading: false,
        refetch: undefined,
      }
}

export default useQuoteRoutes
