import { useQuery } from '@tanstack/react-query'
import mangoStore from '@store/mangoStore'
import { AnchorProvider } from '@coral-xyz/anchor'
import { PublicKey } from '@solana/web3.js'
import {
  MangoMintsRedemptionClient,
  Distribution,
} from '@blockworks-foundation/mango-mints-redemption/dist/client/src'
import { Claim } from '@blockworks-foundation/mango-mints-redemption/dist/client/src/accounts/distribution'

type FetchClaimsResponse = {
  claims: Claim[]
  claimed: PublicKey[]
  distribution: Distribution
}

const fetchClaims = async (
  client: MangoMintsRedemptionClient,
  distributionNum: number,
): Promise<FetchClaimsResponse> => {
  const distribution = await client.loadDistribution(distributionNum)
  const claims = distribution.getClaims(client.provider.publicKey)
  const claimed = await distribution.getClaimed()

  return {
    claims: claims || [],
    claimed: claimed || [],
    distribution,
  }
}

export const useRewards = () => {
  const state = mangoStore.getState()
  const provider = state.client.program.provider as AnchorProvider
  const client = new MangoMintsRedemptionClient(provider)
  const res = useQuery<FetchClaimsResponse, Error>(['rewards-claims'], () =>
    fetchClaims(client, 9),
  ).data

  return {
    claims: res?.claims || [],
    claimed: res?.claimed || [],
    distribution: res?.distribution,
    client: client,
  }
}
