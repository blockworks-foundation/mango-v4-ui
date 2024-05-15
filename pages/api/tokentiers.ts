import type { NextApiRequest, NextApiResponse } from 'next'
import { MangoClient } from '@blockworks-foundation/mango-v4'
import { AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import {
  LISTING_PRESETS,
  getMidPriceImpacts,
} from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'

interface TokenDetails {
  reduceOnly?: number
  maxBelow1Percent: { amount: number; preset: string }
  maxBelow2Percent: { amount: number; preset: string }
  initAssetWeight?: string
  maintAssetWeight?: string
  maintLiabWeight?: string
  initLiabWeight?: string
  mint?: string
  currentTier?: string
  collateralFeesPerDay?: number
}

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

type CurrentTiersResponse = CurrentTier[]

async function buildClient(): Promise<MangoClient> {
  const clientKeypair = new Keypair()
  const options = AnchorProvider.defaultOptions()

  const rpcUrl = process.env.NEXT_PUBLIC_ENDPOINT
  if (!rpcUrl) {
    throw new Error('MANGO_RPC_URL environment variable is not set')
  }

  const connection = new Connection(rpcUrl, options)
  const clientWallet = new Wallet(clientKeypair)
  const clientProvider = new AnchorProvider(connection, clientWallet, options)

  return MangoClient.connect(
    clientProvider,
    'mainnet-beta',
    new PublicKey('4MangoMjqJ2firMokCjjGgoK8d4MXcrgL7XJaL3w6fVg'),
    { idsSource: 'get-program-accounts' },
  )
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    CurrentTiersResponse | { error: string; details: string }
  >,
) {
  try {
    const client = await buildClient()
    const group = await client.getGroup(
      new PublicKey('78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX'),
    )

    const banks = Array.from(group.banksMapByTokenIndex.values())
      .map((bank) => bank[0])
      .sort((a, b) => a.name.localeCompare(b.name))

    const priceImpacts = group?.pis || []
    const midPriceImpacts = getMidPriceImpacts(
      priceImpacts.length ? priceImpacts : [],
    )
    console.log(midPriceImpacts)

    const tokenThresholds: {
      [symbol: string]: { below1Percent: number; below2Percent: number }
    } = {}

    for (const impact of midPriceImpacts) {
      if (!tokenThresholds[impact.symbol]) {
        tokenThresholds[impact.symbol] = { below1Percent: 0, below2Percent: 0 }
      }
      if (
        impact.avg_price_impact_percent < 1 &&
        impact.target_amount > tokenThresholds[impact.symbol].below1Percent
      ) {
        tokenThresholds[impact.symbol].below1Percent = impact.target_amount
      }
      if (
        impact.avg_price_impact_percent < 2 &&
        impact.target_amount > tokenThresholds[impact.symbol].below2Percent
      ) {
        tokenThresholds[impact.symbol].below2Percent = impact.target_amount
      }
    }

    const newRankings: { [symbol: string]: TokenDetails } = {}

    for (const [, preset] of Object.entries(LISTING_PRESETS)) {
      for (const [symbol, thresholds] of Object.entries(tokenThresholds)) {
        if (!newRankings[symbol]) {
          newRankings[symbol] = {
            maxBelow1Percent: { amount: 0, preset: 'C' },
            maxBelow2Percent: { amount: 0, preset: 'C' },
          }
        }

        if (preset.preset_target_amount <= thresholds.below1Percent) {
          if (
            preset.preset_target_amount >=
            newRankings[symbol].maxBelow1Percent.amount
          ) {
            newRankings[symbol].maxBelow1Percent = {
              amount: preset.preset_target_amount,
              preset: preset.preset_name,
            }
          }
        }

        if (preset.preset_target_amount <= thresholds.below2Percent) {
          if (
            preset.preset_target_amount >=
            newRankings[symbol].maxBelow2Percent.amount
          ) {
            newRankings[symbol].maxBelow2Percent = {
              amount: preset.preset_target_amount,
              preset: preset.preset_name,
            }
          }
        }
      }
    }

    await Promise.all(
      banks.map(async (bank) => {
        const currentTier = Object.values(LISTING_PRESETS).find((x) => {
          if (bank?.platformLiquidationFee.toNumber() === 0) {
            return (
              x.platformLiquidationFee.toFixed(2) ===
              bank?.platformLiquidationFee.toNumber().toFixed(2)
            )
          }
          if (bank?.initAssetWeight.toNumber() === 0) {
            return (
              x.maintLiabWeight.toFixed(2) ===
              bank?.maintLiabWeight.toNumber().toFixed(2)
            )
          }
          if (bank?.depositWeightScaleStartQuote !== 20000000000) {
            return (
              x.depositWeightScaleStartQuote ===
              bank?.depositWeightScaleStartQuote
            )
          } else {
            return (
              Math.abs(
                x.loanOriginationFeeRate -
                  bank?.loanOriginationFeeRate.toNumber(),
              ) < 1e-8
            )
          }
        })

        let bankName = bank?.name
        if (bankName === 'WIF') bankName = '$WIF'
        if (bankName === 'ETH (Portal)') bankName = 'ETH'
        if (bank?.mint && newRankings[bankName]) {
          newRankings[bankName].reduceOnly = bank?.reduceOnly
          newRankings[bankName].currentTier = currentTier?.preset_name || 'S'
          newRankings[bankName].mint = bank?.mint.toString()
          newRankings[bankName].initAssetWeight = bank?.initAssetWeight
            .toNumber()
            .toFixed(2)
          newRankings[bankName].maintAssetWeight = bank?.maintAssetWeight
            .toNumber()
            .toFixed(2)
          newRankings[bankName].maintLiabWeight = bank?.maintLiabWeight
            .toNumber()
            .toFixed(2)
          newRankings[bankName].initLiabWeight = bank?.initLiabWeight
            .toNumber()
            .toFixed(2)
          newRankings[bankName].collateralFeesPerDay = bank?.collateralFeePerDay
        }
      }),
    )

    const currentTiers: CurrentTiersResponse = Object.entries(newRankings).map(
      ([name, details]) => ({
        name,
        reduceOnly: details.reduceOnly,
        maxBelow1PercentAmount: details.maxBelow1Percent.amount,
        maxBelow1PercentPreset: details.maxBelow1Percent.preset,
        maxBelow2PercentAmount: details.maxBelow2Percent.amount,
        maxBelow2PercentPreset: details.maxBelow2Percent.preset,
        initAssetWeight: details.initAssetWeight,
        maintAssetWeight: details.maintAssetWeight,
        maintLiabWeight: details.maintLiabWeight,
        initLiabWeight: details.initLiabWeight,
        mint: details.mint,
        currentTier: details.currentTier,
        collateralFeesPerDay: details.collateralFeesPerDay,
      }),
    )

    res.status(200).json(currentTiers)
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
