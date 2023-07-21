import { Group } from '@blockworks-foundation/mango-v4'
import { CLUSTER } from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import useMangoGroup from 'hooks/useMangoGroup'
import { Token } from 'types/jupiter'
import { JUPITER_API_DEVNET, JUPITER_API_MAINNET } from 'utils/constants'

const fetchJupiterTokens = async (group: Group) => {
  const url = CLUSTER === 'devnet' ? JUPITER_API_DEVNET : JUPITER_API_MAINNET
  const response = await fetch(url)
  const data: Token[] = await response.json()

  const bankMints = Array.from(group.banksMapByName.values()).map((b) =>
    b[0].mint.toString(),
  )
  const mangoTokens = data.filter((t) => bankMints.includes(t.address))

  return {
    mangoTokens,
    jupiterTokens: data,
  }
}

const useJupiterMints = (): {
  mangoTokens: Token[]
  jupiterTokens: Token[]
  isFetching: boolean
} => {
  const { group } = useMangoGroup()

  const res = useQuery(
    ['jupiter-mango-tokens'],
    () => fetchJupiterTokens(group!),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60 * 10,
      retry: 3,
      enabled: !!group,
      refetchOnWindowFocus: false,
    },
  )

  return {
    mangoTokens: res?.data?.mangoTokens || [],
    jupiterTokens: res?.data?.jupiterTokens || [],
    isFetching: res?.isFetching || false,
  }
}

export default useJupiterMints
