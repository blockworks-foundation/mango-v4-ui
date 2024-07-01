import type { NextApiRequest, NextApiResponse } from 'next'

interface CurrentTier {
  name: string
  reduceOnly?: number
  maxBelow1PercentAmount?: number
  maxBelow1PercentPreset?: string
  maxBelow2PercentAmount?: number
  maxBelow2PercentPreset?: string
  initAssetWeight?: string
  maintAssetWeight?: string
  maintLiabWeight?: string
  initLiabWeight?: string
  mint?: string
  currentTier?: string
  collateralFeesPerDay?: number
}

export const TRITON_DEDICATED_URL = process.env.NEXT_PUBLIC_TRITON_TOKEN
  ? `https://mango.rpcpool.com/${process.env.NEXT_PUBLIC_TRITON_TOKEN}`
  : 'https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88'

type CurrentTiersResponse = CurrentTier[]

// async function buildClient(): Promise<MangoClient | undefined> {
//   try {
//     const clientKeypair = new Keypair()
//     const options = AnchorProvider.defaultOptions()

//     const rpcUrl = process.env.NEXT_PUBLIC_ENDPOINT || TRITON_DEDICATED_URL
//     console.log(rpcUrl, '@@@@@@@')
//     if (!rpcUrl) {
//       throw new Error('MANGO_RPC_URL environment variable is not set')
//     }

//     const connection = new Connection(rpcUrl, options)
//     const clientWallet = new Wallet(clientKeypair)
//     const clientProvider = new AnchorProvider(connection, clientWallet, options)

//     return MangoClient.connect(
//       clientProvider,
//       'mainnet-beta',
//       MANGO_V4_ID['mainnet-beta'],
//       {
//         idsSource: 'api',
//       },
//     )
//   } catch (e) {
//     console.log(e)
//   }
// }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    CurrentTiersResponse | { error: string; details: string }
  >,
) {
  try {
    return res.status(200).json([{ name: '123' }])
  } catch (error: unknown) {
    let errorMessage = 'An unexpected error occurred'
    if (error instanceof Error) {
      errorMessage = error.message
    }

    console.error('Failed to fetch tokens:', error)
    res
      .status(500)
      .json({ error: 'Failed to fetch tokens', details: errorMessage })
  }
}
