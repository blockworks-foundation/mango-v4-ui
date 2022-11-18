import { Group } from '@blockworks-foundation/mango-v4'
import { CLUSTER } from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import useMangoGroup from 'hooks/useMangoGroup'
import { Token } from 'types/jupiter'

const fetchJupiterTokens = async (group: Group) => {
  const url =
    CLUSTER === 'devnet'
      ? 'https://api.jup.ag/api/tokens/devnet'
      : 'https://cache.jup.ag/tokens'
  const response = await fetch(url)
  const data = await response.json()

  const bankMints = Array.from(group!.banksMapByName.values()).map((b) =>
    b[0].mint.toString()
  )
  const mangoTokens = data.filter((t: any) => bankMints.includes(t.address))

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

  const res = useQuery<{ mangoTokens: Token[]; jupiterTokens: Token[] }, Error>(
    ['jupiter-mango-tokens'],
    () => fetchJupiterTokens(group!),
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60 * 10,
      retry: true,
      enabled: !!group,
    }
  )

  return {
    mangoTokens: res?.data?.mangoTokens || [],
    jupiterTokens: res?.data?.jupiterTokens || [],
    isFetching: res?.isFetching || false,
  }
}

export default useJupiterMints
