import { useQuery } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { RouteInfo } from 'types/jupiter'
import useJupiterSwapData from './useJupiterSwapData'

type useJupiterPropTypes = {
  inputMint: string
  outputMint: string
  amount: string
  slippage: number
  swapMode: string
}

const fetchJupiterRoutes = async (
  inputMint = 'So11111111111111111111111111111111111111112',
  outputMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount = 0,
  slippage = 50,
  swapMode = 'ExactIn',
  feeBps = 0
) => {
  {
    const paramsString = new URLSearchParams({
      inputMint: inputMint.toString(),
      outputMint: outputMint.toString(),
      amount: amount.toString(),
      slippageBps: Math.ceil(slippage * 100).toString(),
      onlyDirectRoutes: 'true',
      feeBps: feeBps.toString(),
      swapMode,
    }).toString()

    const response = await fetch(
      `https://quote-api.jup.ag/v3/quote?${paramsString}`
    )

    const res = await response.json()
    const data = res.data

    return {
      routes: res.data,
      bestRoute: data[0],
    }
  }
}

const useJupiterRoutes = ({
  inputMint,
  outputMint,
  amount,
  slippage,
  swapMode,
}: useJupiterPropTypes) => {
  const { inputTokenInfo, outputTokenInfo } = useJupiterSwapData()

  const decimals =
    swapMode === 'ExactIn'
      ? inputTokenInfo?.decimals || 6
      : outputTokenInfo?.decimals || 6

  const nativeAmount = amount
    ? new Decimal(amount).mul(10 ** decimals)
    : new Decimal(0)

  const res = useQuery<{ routes: RouteInfo[]; bestRoute: RouteInfo }, Error>(
    ['swap-routes', inputMint, outputMint, amount, slippage, swapMode],
    async () =>
      fetchJupiterRoutes(
        inputMint,
        outputMint,
        nativeAmount.toNumber(),
        slippage,
        swapMode
      ),
    {
      enabled: amount ? true : false,
    }
  )

  return amount
    ? {
        ...(res.data ?? {
          routes: [],
          bestRoute: undefined,
        }),
        isLoading: res.isLoading,
      }
    : {
        routes: [],
        bestRoute: undefined,
        isLoading: false,
      }
}

export default useJupiterRoutes
