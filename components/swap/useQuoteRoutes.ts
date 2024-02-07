/* eslint-disable @typescript-eslint/no-explicit-any */
import { PublicKey } from '@solana/web3.js'
import { useQuery } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { JupiterV6RouteInfo } from 'types/jupiter'
// import { MANGO_ROUTER_API_URL } from 'utils/constants'
import useJupiterSwapData from './useJupiterSwapData'
import { useMemo } from 'react'
import { JUPITER_V6_QUOTE_API_MAINNET } from 'utils/constants'
import { MangoAccount } from '@blockworks-foundation/mango-v4'

type SwapModes = 'ALL' | 'JUPITER' | 'MANGO'

type useQuoteRoutesPropTypes = {
  inputMint: string | undefined
  outputMint: string | undefined
  amount: string
  slippage: number
  swapMode: string
  wallet: string | undefined
  mangoAccount: MangoAccount | undefined
  mode?: SwapModes
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
) => {
  if (!inputMint || !outputMint) return
  try {
    {
      const paramsString = new URLSearchParams({
        inputMint: inputMint.toString(),
        outputMint: outputMint.toString(),
        amount: amount.toString(),
        slippageBps: Math.ceil(slippage * 100).toString(),
        maxAccounts: maxAccounts.toString(),
        swapMode,
        onlyDirectRoutes: `${onlyDirectRoutes}`,
      }).toString()
      const response = await fetch(
        `${JUPITER_V6_QUOTE_API_MAINNET}/quote?${paramsString}`,
      )
      const res: JupiterV6RouteInfo = await response.json()
      return {
        bestRoute: res,
      }
    }
  } catch (e) {
    console.log('error fetching jupiter route', e)
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
  jupiterOnlyDirectRoutes = false,
) => {
  try {
    wallet ||= PublicKey.default.toBase58()

    let maxAccounts: number
    if (!mangoAccount) {
      maxAccounts = 64
    } else {
      // TODO: replace with client method
      const totalSlots =
        mangoAccount.tokensActive().length +
        mangoAccount.serum3Active().length +
        mangoAccount.tokenConditionalSwapsActive().length +
        mangoAccount.perpActive().length +
        mangoAccount.perpOrdersActive().length
      maxAccounts = 56 - 2 * totalSlots
    }

    const routes = []

    // FIXME: Disable for now, mango router needs to use ALTs
    // if (mode === 'ALL' || mode === 'MANGO') {
    //   const mangoRoute = fetchMangoRoutes(
    //     inputMint,
    //     outputMint,
    //     amount,
    //     slippage,
    //     swapMode,
    //     feeBps,
    //     wallet,
    //   )
    //   routes.push(mangoRoute)
    // }

    if (mode === 'ALL' || mode === 'JUPITER') {
      const jupiterRoute = await fetchJupiterRoute(
        inputMint,
        outputMint,
        amount,
        slippage,
        swapMode,
        jupiterOnlyDirectRoutes,
        maxAccounts,
      )
      routes.push(jupiterRoute)
    }

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
  enabled,
}: useQuoteRoutesPropTypes) => {
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
    ['swap-routes', inputMint, outputMint, amount, slippage, swapMode, wallet],
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
