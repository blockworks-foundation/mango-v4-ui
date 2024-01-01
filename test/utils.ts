import { MANGO_V4_ID, MangoClient } from '@blockworks-foundation/mango-v4'
import { AnchorProvider } from '@coral-xyz/anchor'
import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import EmptyWallet from 'utils/wallet'

export const getClient = async (connection: Connection) => {
  const options = AnchorProvider.defaultOptions()
  const adminProvider = new AnchorProvider(
    connection,
    new EmptyWallet(Keypair.generate()),
    options,
  )
  const client = MangoClient.connect(
    adminProvider,
    'mainnet-beta',
    MANGO_V4_ID['mainnet-beta'],
  )

  return client
}
export const getGroupForClient = async (
  client: MangoClient,
  groupPk: PublicKey,
) => {
  const response = await client.getGroup(groupPk)
  return response
}

export const MAINNET_MANGO_GROUP = new PublicKey(
  '78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX',
)
