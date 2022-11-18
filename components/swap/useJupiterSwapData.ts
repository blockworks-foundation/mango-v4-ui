import { useMemo } from 'react'
import useJupiterMints from 'hooks/useJupiterMints'
import mangoStore from '@store/mangoStore'

const useJupiterSwapData = () => {
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)
  const { mangoTokens } = useJupiterMints()

  const [inputTokenInfo, outputTokenInfo] = useMemo(() => {
    if (inputBank && outputBank) {
      return [
        mangoTokens?.find(
          (item) => item?.address === inputBank.mint.toString() || ''
        ),
        mangoTokens?.find(
          (item) => item?.address === outputBank.mint.toString() || ''
        ),
      ]
    } else {
      return []
    }
  }, [inputBank, outputBank, mangoTokens])

  return {
    inputTokenInfo,
    inputCoingeckoId: inputTokenInfo?.extensions?.coingeckoId,
    outputTokenInfo,
    outputCoingeckoId: outputTokenInfo?.extensions?.coingeckoId,
  }
}

export default useJupiterSwapData
