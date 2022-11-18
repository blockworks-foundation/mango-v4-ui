import { useQuery } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { RouteInfo } from 'types/jupiter'
import useJupiterSwapData from './useJupiterSwapData'

type useJupiterPropTypes = {
  inputMint: string
  outputMint: string
  inputAmount: string
  slippage: number
}

const fetchJupiterRoutes = async (
  inputMint: string = 'So11111111111111111111111111111111111111112',
  outputMint: string = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  amount: number = 0,
  slippageBps: number = 50,
  feeBps: number = 0
) => {
  {
    const params: any = {
      inputMint: inputMint.toString(),
      outputMint: outputMint.toString(),
      amount,
      slippageBps,
      onlyDirectRoutes: 'true',
      feeBps,
    }

    const paramsString = new URLSearchParams(params).toString()
    const response = await fetch(
      `https://quote-api.jup.ag/v1/quote?${paramsString}`
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
  inputAmount,
  slippage,
}: useJupiterPropTypes) => {
  const { inputTokenInfo } = useJupiterSwapData()

  const amount = inputAmount
    ? new Decimal(inputAmount).mul(10 ** (inputTokenInfo?.decimals || 6))
    : new Decimal(0)

  const res = useQuery<{ routes: RouteInfo[]; bestRoute: RouteInfo }, Error>(
    ['swap-routes', inputMint, outputMint, inputAmount, slippage],
    async () =>
      fetchJupiterRoutes(inputMint, outputMint, amount.toNumber(), slippage),
    {
      enabled: inputAmount ? true : false,
    }
  )

  return inputAmount
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
