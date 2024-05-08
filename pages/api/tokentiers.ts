import type { NextApiRequest, NextApiResponse } from 'next'
import { MangoClient } from '@blockworks-foundation/mango-v4'
import { AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { LISTING_PRESETS } from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'

// Utility to build a MangoClient instance
async function buildClient(): Promise<MangoClient> {
  const clientKeypair = new Keypair()
  const options = AnchorProvider.defaultOptions()

  const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL // replace with ENV
  if (!rpcUrl) {
    throw new Error('MANGO_RPC_URL environment variable is not set')
  }

  const connection = new Connection(rpcUrl, options)
  const clientWallet = new Wallet(clientKeypair)
  const clientProvider = new AnchorProvider(connection, clientWallet, options)

  return await MangoClient.connect(
    clientProvider,
    'mainnet-beta',
    new PublicKey('4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg'),
    {
      idsSource: 'get-program-accounts',
    },
  )
}

// API handler function
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const client = await buildClient()
    const group = await client.getGroup(
      new PublicKey('78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX'),
    )

    const banks = Array.from(group.banksMapByTokenIndex.values())
      .map((banks) => banks[0])
      .sort((a, b) => a.name.localeCompare(b.name))

    const currentTiers: Array<{ [key: string]: string }> = []
    const epsilon = 1e-8
    await Promise.all(
      banks.map(async (bank) => {
        if (bank?.reduceOnly != 1) {
          const currentTier = Object.values(LISTING_PRESETS).find((x) => {
            if (bank?.name == 'USDC' || bank?.name == 'USDT') return false
            if (bank?.depositWeightScaleStartQuote != 20000000000) {
              if (
                x.depositWeightScaleStartQuote ===
                bank?.depositWeightScaleStartQuote
              ) {
                return true
              }
            } else {
              return (
                Math.abs(
                  x.loanOriginationFeeRate -
                    bank?.loanOriginationFeeRate.toNumber(),
                ) < epsilon
              )
            }
          })
          currentTiers.push({
            [bank?.name]: currentTier?.preset_name
              ? currentTier?.preset_name
              : 'S',
          })
          return bank
        }
      }),
    )

    res.status(200.0).json(currentTiers)
  } catch (error: unknown) {
    console.error('Failed to fetch tokens:', error)
    if (error instanceof Error) {
      res
        .status(500)
        .json({ error: 'Failed to fetch tokens', details: error.message })
    } else {
      res
        .status(500)
        .json({
          error: 'Failed to fetch tokens',
          details: 'An unexpected error occurred',
        })
    }
  }
}
