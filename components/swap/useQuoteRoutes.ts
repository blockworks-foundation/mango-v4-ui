/* eslint-disable @typescript-eslint/no-explicit-any */
import { Connection, PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { JupiterV6RouteInfo } from 'types/jupiter'
// import { MANGO_ROUTER_API_URL } from 'utils/constants'
import useJupiterSwapData from './useJupiterSwapData'
import { useMemo } from 'react'
import { JUPITER_V6_QUOTE_API_MAINNET } from 'utils/constants'
import { MangoAccount, toUiDecimals } from '@blockworks-foundation/mango-v4'
import { findRaydiumPoolInfo, getSwapTransaction } from 'utils/swap/raydium'
import mangoStore from '@store/mangoStore'
import { fetchJupiterTransaction } from './SwapReviewRouteInfo'

type SwapModes = 'ALL' | 'JUPITER' | 'MANGO' | 'JUPITER_DIRECT' | 'RAYDIUM'

type useQuoteRoutesPropTypes = {
  inputMint: string | undefined
  outputMint: string | undefined
  amount: string
  slippage: number
  swapMode: string
  wallet: string | undefined
  mangoAccount: MangoAccount | undefined
  mode?: SwapModes
  mangoAccountSwap: boolean
  enabled?: () => boolean
}

const fetchJupiterRoute = async (
  inputMint: string | undefined,
  outputMint: string | undefined,
  amount = 0,
  slippage = 50,
  swapMode = 'ExactIn',
  onlyDirectRoutes = true,
  maxAccounts = 64,
  connection: Connection,
  wallet: string,
) => {
  if (!inputMint || !outputMint) return
  try {
    {
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
      const res: JupiterV6RouteInfo = await response.json()
      const [ixes] = await fetchJupiterTransaction(
        connection,
        res,
        new PublicKey(wallet),
        slippage,
        new PublicKey(inputMint),
        new PublicKey(outputMint),
      )
      return {
        bestRoute:
          [...ixes.flatMap((x) => x.keys.flatMap((k) => k.pubkey))].length <=
          maxAccounts
            ? res
            : undefined,
      }
    }
  } catch (e) {
    console.log('error fetching jupiter route', e)
  }
}

const fetchRaydiumRoute = async (
  inputMint: string | undefined,
  outputMint: string | undefined,
  amount = 0,
  slippage = 50,
  connection: Connection,
  wallet: string,
  mangoAccountSwap: boolean,
) => {
  if (!inputMint || !outputMint) return
  try {
    const poolKeys = await findRaydiumPoolInfo(
      connection,
      outputMint,
      inputMint,
    )

    if (poolKeys) {
      return await getSwapTransaction(
        connection,
        outputMint,
        amount,
        poolKeys!,
        slippage,
        new PublicKey(wallet),
        mangoAccountSwap,
      )
    }
  } catch (e) {
    console.log('error fetching raydium route', e)
  }
}

// const fetchMangoRoutes = async (
//   inputMint = 'So11111111111111111111111111111111111111112',
//   outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
//   amount = 0,
//   slippage = 50,
//   swapMode = 'ExactIn',
//   feeBps = 0,
//   wallet = PublicKey.default.toBase58(),
// ) => {
//   {
//     const defaultOtherAmount =
//       swapMode === 'ExactIn' ? 0 : Number.MAX_SAFE_INTEGER

//     const paramsString = new URLSearchParams({
//       inputMint: inputMint.toString(),
//       outputMint: outputMint.toString(),
//       amount: amount.toString(),
//       slippage: ((slippage * 1) / 100).toString(),
//       feeBps: feeBps.toString(),
//       mode: swapMode,
//       wallet: wallet,
//       otherAmountThreshold: defaultOtherAmount.toString(),
//     }).toString()

//     const response = await fetch(`${MANGO_ROUTER_API_URL}/swap?${paramsString}`)

//     const res = await response.json()
//     const data: RouteInfo[] = res.map((route: any) => ({
//       ...route,
//       priceImpactPct: route.priceImpact,
//       slippageBps: slippage,
//       marketInfos: route.marketInfos.map((mInfo: any) => ({
//         ...mInfo,
//         lpFee: {
//           ...mInfo.fee,
//           pct: mInfo.fee.rate,
//         },
//       })),
//       mints: route.mints.map((x: string) => new PublicKey(x)),
//       instructions: route.instructions.map((ix: any) => ({
//         ...ix,
//         programId: new PublicKey(ix.programId),
//         data: Buffer.from(ix.data, 'base64'),
//         keys: ix.keys.map((key: any) => ({
//           ...key,
//           pubkey: new PublicKey(key.pubkey),
//         })),
//       })),
//       routerName: 'Mango',
//     }))
//     return {
//       routes: data,
//       bestRoute: (data.length ? data[0] : null) as RouteInfo | null,
//     }
//   }
// }

export const handleGetRoutes = async (
  inputMint: string | undefined,
  outputMint: string | undefined,
  amount = 0,
  slippage = 50,
  swapMode = 'ExactIn',
  wallet: string | undefined,
  mangoAccount: MangoAccount | undefined,
  mode: SwapModes = 'ALL',
  connection: Connection,
  inputTokenDecimals: number | null,
  mangoAccountSwap: boolean,
) => {
  try {
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
      connection &&
      inputTokenDecimals &&
      (mode === 'ALL' || mode === 'RAYDIUM')
    ) {
      const raydiumRoute = fetchRaydiumRoute(
        inputMint,
        outputMint,
        toUiDecimals(amount, inputTokenDecimals),
        slippage,
        connection,
        wallet,
        mangoAccountSwap,
      )
      if (raydiumRoute) {
        routes.push(raydiumRoute)
      }
    }

    if (mode === 'ALL' || mode === 'JUPITER' || mode === 'JUPITER_DIRECT') {
      const jupiterRoute = fetchJupiterRoute(
        inputMint,
        outputMint,
        amount,
        slippage,
        swapMode,
        mode === 'JUPITER_DIRECT' ? true : false,
        maxAccounts,
        connection,
        wallet,
      )
      if (jupiterRoute) {
        routes.push(jupiterRoute)
      }
    }
    console.log(routes)
    const results = await Promise.allSettled(routes)
    const responses = results
      .filter((x) => x.status === 'fulfilled' && x.value?.bestRoute !== null)
      .map((x) => (x as any).value)

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
      bestRoute: sortedByBiggestOutAmount[0].bestRoute,
    }
  } catch (e) {
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
  mode = 'ALL',
  mangoAccountSwap,
  enabled,
}: useQuoteRoutesPropTypes) => {
  const connection = mangoStore((s) => s.connection)
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
      'swap-routes',
      inputMint,
      outputMint,
      amount,
      slippage,
      swapMode,
      wallet,
      mode,
    ],
    async () =>
      handleGetRoutes(
        inputMint,
        outputMint,
        nativeAmount.toNumber(),
        slippage,
        swapMode,
        wallet,
        mangoAccount,
        mode,
        connection,
        decimals,
        mangoAccountSwap,
      ),
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
