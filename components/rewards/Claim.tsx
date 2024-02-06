import {
  Claim,
  Distribution,
  MangoMintsRedemptionClient,
} from '@blockworks-foundation/mango-mints-redemption'
import dynamic from 'next/dynamic'
import { web3 } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useCurrentSeason, useDistribution } from 'hooks/useRewards'
import { chunk } from 'lodash'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TransactionInstructionWithSigners,
  SequenceType,
} from '@blockworks-foundation/mangolana/lib/globalTypes'
import {
  TransactionInstructionWithType,
  sendSignAndConfirmTransactions,
} from '@blockworks-foundation/mangolana/lib/transactions'
import useJupiterMints from 'hooks/useJupiterMints'
import { Token } from 'types/jupiter'
import {
  Metaplex,
  Nft,
  NftWithToken,
  Sft,
  SftWithToken,
} from '@metaplex-foundation/js'
import Loading from '@components/shared/Loading'
import dayjs from 'dayjs'
import { onClick, unmute } from 'lib/render'
import { usePlausible } from 'next-plausible'
import { TelemetryEvents } from 'utils/telemetry'
import { Prize, getClaimsAsPrizes } from './RewardsComponents'
import { notify } from 'utils/notifications'
import { sleep } from 'utils'
import { createComputeBudgetIx } from '@blockworks-foundation/mango-v4'

const CLAIM_BUTTON_CLASSES =
  'raised-button group mx-auto block h-12 px-6 pt-1 font-rewards text-xl after:rounded-lg focus:outline-none lg:h-14'

const WINNER_TITLES = [
  'Congratulations',
  'Happy Days',
  'Chicken Dinner',
  'Well Played',
  'Nailed It',
  'Bravo',
]

const RewardsComponent = dynamic(() => import('./RewardsComponents'), {
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Loading></Loading>
    </div>
  ),
})

const ClaimPage = () => {
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimProgress, setClaimProgress] = useState(0)
  const [distribution, setDistribution] = useState<Distribution | undefined>(
    undefined,
  )
  const { jupiterTokens } = useJupiterMints()
  const [winnerTitle] = useState(
    WINNER_TITLES[Math.floor(Math.random() * WINNER_TITLES.length)],
  )
  const [showRender, setShowRender] = useState(false)
  const [rewardsWasShown, setRewardsWasShow] = useState(false)
  const [claims, setClaims] = useState<Claim[] | undefined>([])
  const [loadingClaims, setLoadingClaims] = useState(false)
  const [claimed, setClaimed] = useState<PublicKey[] | undefined>([])
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [tokenRewardsInfo, setTokensRewardsInfo] = useState<Token[]>([])
  const [nftsRewardsInfo, setNftsRewardsInfo] = useState<
    (Sft | SftWithToken | Nft | NftWithToken)[]
  >([])
  const [rewardsClient, setRewardsClient] = useState<
    MangoMintsRedemptionClient | undefined
  >(undefined)
  const [prizes, setPrizes] = useState<Prize[]>([])

  const { client } = mangoStore()
  const { publicKey } = useWallet()
  const fee = mangoStore((s) => s.priorityFee)
  const { data: seasonData } = useCurrentSeason()
  const currentSeason = seasonData?.season_id
  const previousSeason = currentSeason ? currentSeason - 1 : null

  //needed for tx sign
  const wallet = useWallet()

  const provider = client.program.provider
  const connection = provider.connection

  const telemetry = usePlausible<TelemetryEvents>()

  const { data: distributionDataAndClient, refetch } = useDistribution(
    previousSeason!,
  )
  const claimEndsIn = useMemo(() => {
    if (!distributionDataAndClient?.distribution) return
    const start = distributionDataAndClient.distribution.start.getTime()
    return dayjs().to(
      start + distributionDataAndClient.distribution.duration * 1000,
    )
  }, [distributionDataAndClient])

  useEffect(() => {
    const handleSetDistribution = async () => {
      setLoadingClaims(true)
      setDistribution(distributionDataAndClient?.distribution)
      setClaims(distributionDataAndClient?.distribution?.getClaims(publicKey!))
      setClaimed(await distributionDataAndClient?.distribution?.getClaimed())
      setRewardsClient(distributionDataAndClient?.client)
      setLoadingClaims(false)
    }

    if (distributionDataAndClient && publicKey) {
      handleSetDistribution()
    } else {
      setDistribution(undefined)
      setClaims(undefined)
      setClaimed(undefined)
      setRewardsClient(undefined)
    }
  }, [distributionDataAndClient, publicKey])

  const startShowRewards = () => {
    telemetry('rewardsOpenRender')
    setShowRender(true)
    setRewardsWasShow(true)
    onClick()
    unmute()
  }
  const handleTokenMetadata = useCallback(async () => {
    if (claims?.length && connection && jupiterTokens.length) {
      setLoadingMetadata(true)
      const metaplex = new Metaplex(connection)

      const tokens = claims!
        .filter((x) => x.mintProperties.type.toLowerCase() === 'token')
        .map((t) => jupiterTokens.find((x) => x.address === t.mint.toBase58()))
        .filter((x) => x)
        .map((x) => x as Token)

      const nfts = claims!.filter(
        (x) => x.mintProperties.type.toLowerCase() === 'nft',
      )
      const nftsInfos: (Sft | SftWithToken | Nft | NftWithToken)[] = []

      for (const nft of nfts) {
        const metadataPDA = await metaplex
          .nfts()
          .pdas()
          .metadata({ mint: nft.mint })
        const tokenMetadata = await metaplex.nfts().findByMetadata({
          metadata: metadataPDA,
        })
        nftsInfos.push(tokenMetadata)
      }

      setNftsRewardsInfo(nftsInfos)
      setTokensRewardsInfo(tokens)
      setLoadingMetadata(false)
    }
  }, [claims, connection, jupiterTokens])

  useEffect(() => {
    if (claims) {
      handleTokenMetadata()
    }
  }, [claims, handleTokenMetadata])

  const handleClaimRewards = useCallback(async () => {
    if (!distribution || !publicKey || !claims || !rewardsClient) return
    const transactionInstructions: TransactionInstructionWithType[] = []
    // Create claim account if it doesn't exist
    if (claimed === undefined) {
      const claimAccountPk = distribution.findClaimAccountAddress(publicKey!)
      const isCreated = (await connection.getBalance(claimAccountPk)) > 1

      if (!isCreated) {
        transactionInstructions.push({
          instructionsSet: [
            new TransactionInstructionWithSigners(
              await rewardsClient.program.methods
                .claimAccountCreate()
                .accounts({
                  distribution: distribution.publicKey,
                  claimAccount: distribution.findClaimAccountAddress(
                    publicKey!,
                  ),
                  claimant: publicKey!,
                  payer: publicKey!,
                  systemProgram: web3.SystemProgram.programId,
                  rent: web3.SYSVAR_RENT_PUBKEY,
                })
                .instruction(),
            ),
          ],
          sequenceType: SequenceType.Sequential,
        })
      }
    }

    try {
      const claimIxes: TransactionInstructionWithSigners[] = []
      for (const claim of claims) {
        if (claimed !== undefined) {
          const alreadyClaimed =
            claimed.find((c) => c.equals(claim.mint)) !== undefined
          if (alreadyClaimed) {
            continue
          }
        }

        const ixs = (
          await distribution.makeClaimInstructions(publicKey!, claim.mint)
        ).map(
          (ix: web3.TransactionInstruction) =>
            new TransactionInstructionWithSigners(ix),
        )

        claimIxes.push(...ixs)
      }
      chunk(claimIxes, 2).map((x) =>
        transactionInstructions.push({
          instructionsSet: [
            new TransactionInstructionWithSigners(createComputeBudgetIx(fee)),
            ...x,
          ],
          sequenceType: SequenceType.Parallel,
        }),
      )

      setIsClaiming(true)
      setClaimProgress(10)

      await sendSignAndConfirmTransactions({
        connection,
        wallet,
        transactionInstructions,
        callbacks: {
          afterFirstBatchSign: (signedCount) => {
            console.log('afterFirstBatchSign', signedCount)
          },
          afterBatchSign: (signedCount) => {
            console.log('afterBatchSign', signedCount)
          },
          afterAllTxConfirmed: async () => {
            console.log('afterAllTxConfirmed')
            notify({
              type: 'success',
              title: 'All rewards successfully claimed',
            })
            setClaimProgress(100)
            await sleep(1000)
            refetch()
          },
          afterEveryTxConfirmation: () => {
            console.log('afterEveryTxConfirmation')
            setClaimProgress(
              claimProgress + 90 / transactionInstructions.length,
            )
          },
          onError: (e, notProcessedTransactions, originalProps) => {
            console.log('error', e, notProcessedTransactions, originalProps)
            notify({
              title: 'Transaction failed',
              description: e.message,
              txid: e?.txid,
              type: 'error',
            })
          },
        },
        config: {
          maxTxesInBatch: 10,
          autoRetry: false,
          logFlowInfo: true,
        },
      })
      telemetry('rewardsClaim', { props: { rewards: claims.length } })
    } catch (e) {
      telemetry('rewardsClaimError', {
        props: { message: (e as Error).toString() },
      })
      console.error(e)
    } finally {
      setIsClaiming(false)
    }
  }, [
    distribution,
    publicKey,
    claims,
    rewardsClient,
    claimed,
    connection,
    wallet,
    telemetry,
    refetch,
    claimProgress,
  ])

  useEffect(() => {
    if (tokenRewardsInfo.length && claims?.length) {
      const claimsAsPrizes = getClaimsAsPrizes(
        claims,
        tokenRewardsInfo,
        nftsRewardsInfo,
      )
      setPrizes(claimsAsPrizes)
    }
  }, [claims, nftsRewardsInfo, tokenRewardsInfo])

  return claims === undefined && !loadingClaims ? (
    <div className="flex min-h-[calc(100vh-92px)] items-center justify-center p-8">
      <span className="text-center text-th-fgd-3">
        Something went wrong. Try refreshing the page
      </span>
    </div>
  ) : loadingClaims ? (
    <div className="flex min-h-[calc(100vh-92px)] items-center justify-center">
      <Loading />
    </div>
  ) : (
    <div className="flex min-h-[calc(100vh-112px)] flex-col bg-[url('/images/rewards/claim-bg.jpg')] bg-cover bg-fixed bg-center sm:min-h-[calc(100vh-92px)]">
      <div className="flex flex-1 flex-col justify-around pb-20 pt-8 md:pb-16">
        <div className="flex items-center justify-center">
          <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-red-400 px-4 py-1">
            <p className="font-rewards text-lg text-black">
              Season {previousSeason} claim ends <span>{claimEndsIn}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <div className="mx-auto flex w-full max-w-[1140px] flex-col items-center justify-center px-8 lg:px-10">
            {prizes.length && rewardsWasShown ? (
              <div className="my-8 flex w-full flex-col justify-center sm:flex-row sm:flex-wrap">
                {prizes.map((prize, i) => {
                  const { info, item, itemUrl, rarity, stencilUrl } = prize
                  return (
                    <div
                      className="m-2 flex rounded-xl border border-white/20 backdrop-blur-md sm:w-[200px] sm:flex-col sm:pt-4"
                      key={itemUrl + i}
                    >
                      <div className="p-4 sm:p-0">
                        <div className="relative mx-auto h-auto w-16 rounded-lg bg-[#2F3188] sm:w-20">
                          <img className="rounded-lg" src={stencilUrl} />
                          <div className="absolute left-1/2 top-1/2 flex h-[47px] w-[47px] -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:h-[59px] sm:w-[59px]">
                            <img className="rounded-md" src={itemUrl} />
                          </div>
                        </div>
                      </div>
                      <div className="w-full rounded-r-xl border-l border-white/20 bg-[rgba(0,0,0,0.4)] p-4 backdrop-blur-md sm:mt-4 sm:rounded-none sm:rounded-b-xl sm:border-l-0 sm:border-t sm:pt-2">
                        <p className="-mb-1.5 font-rewards text-base text-white">
                          {item}
                        </p>
                        <p
                          className={`-mb-1.5 font-rewards ${
                            rarity.toLowerCase() === 'common'
                              ? 'text-blue-600'
                              : 'text-yellow-300'
                          }`}
                        >
                          {rarity}
                        </p>
                        <p className="-mb-1 font-rewards text-white">{info}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <>
                <div className="mb-12 h-auto w-24">
                  <img src="/images/rewards/chest.png" />
                </div>
                <div className="-mt-8 mb-6 text-center">
                  <h2 className="mb-1 font-rewards text-4xl tracking-wide text-white drop-shadow-[0_0_24px_rgba(0,0,0,1)] sm:text-6xl">
                    {winnerTitle}!
                  </h2>
                  <p className="text-lg font-bold text-white drop-shadow-[0_0_8px_rgba(0,0,0,1)]">
                    You&apos;re a winner in Season {previousSeason}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {isClaiming ? (
          <div className="mx-auto w-full max-w-[500px] px-6">
            <div className="flex h-4 w-full flex-grow rounded-full bg-th-bkg-4">
              <div
                style={{
                  width: `${claimProgress}%`,
                }}
                className={`flex rounded-full bg-gradient-to-r from-green-600 to-green-400`}
              ></div>
            </div>
            <p className="mx-auto mt-3 text-center text-base text-white drop-shadow-[0_0_8px_rgba(0,0,0,1)]">
              {`Claiming prizes: ${claimProgress.toFixed(0)}%`}
            </p>
          </div>
        ) : rewardsWasShown ? (
          <button
            className={CLAIM_BUTTON_CLASSES}
            onClick={() => handleClaimRewards()}
          >
            <span className="block text-th-fgd-1 group-hover:mt-1 group-active:mt-2">{`Claim ${
              claims!.length
            } Prize${claims!.length > 1 ? 's' : ''}`}</span>
          </button>
        ) : (
          <button
            disabled={loadingMetadata}
            className={CLAIM_BUTTON_CLASSES}
            onClick={() => startShowRewards()}
          >
            <span className="block text-th-fgd-1 group-hover:mt-1 group-active:mt-2">
              {' '}
              {loadingMetadata ? (
                <Loading className="w-3"></Loading>
              ) : (
                'Reveal Prizes'
              )}
            </span>
          </button>
        )}
      </div>
      <div
        className={`fixed bottom-0 left-0 right-0 top-0 z-[1000] ${
          showRender ? 'h-full w-full' : 'h-0 w-0 overflow-hidden'
        }`}
      >
        <RewardsComponent
          tokensInfo={tokenRewardsInfo}
          nftsRewardsInfo={nftsRewardsInfo}
          claims={claims!}
          start={showRender}
          setShowRender={setShowRender}
        />
      </div>
    </div>
  )
}
export default ClaimPage
