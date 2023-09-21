import Button from '@components/shared/Button'
import { ClockIcon } from '@heroicons/react/20/solid'
// import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import Leaderboards from './Leaderboards'
import { useQuery } from '@tanstack/react-query'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import {
  TransactionInstructionWithType,
  sendSignAndConfirmTransactions,
} from '@blockworks-foundation/mangolana/lib/transactions'
import {
  SequenceType,
  TransactionInstructionWithSigners,
} from '@blockworks-foundation/mangolana/lib/globalTypes'
import { AnchorProvider, web3 } from '@coral-xyz/anchor'
import {
  Distribution,
  MangoMintsRedemptionClient,
  Claim,
} from '@blockworks-foundation/mango-mints-redemption'
import { chunk } from 'lodash'
import { useCurrentSeason, useDistribution } from 'hooks/useRewards'
import { DISTRIBUTION_NUMBER_PREFIX, fetchCurrentSeason } from 'apis/rewards'
import Season from './Season'
import ClaimLossModal from './ClaimLossModal'
import ClaimWinModal from './ClaimWinModal'
import Badge from './Badge'

export const tiers = ['seed', 'mango', 'whale', 'bot']

const RewardsPage = () => {
  //   const { t } = useTranslation(['common', 'rewards'])
  const [showClaim, setShowClaim] = useState(false)
  const [showLeaderboards, setShowLeaderboards] = useState('')
  const faqRef = useRef<HTMLDivElement>(null)
  const { data: seasonData } = useCurrentSeason()
  const { client } = mangoStore()
  const { data: distributionData } = useDistribution(
    client.program.provider,
    seasonData ? seasonData.season_id - 1 : undefined,
  )
  const { publicKey } = useWallet()
  useEffect(() => {
    if (distributionData && publicKey) {
      const start = distributionData.start.getTime()
      const currentTimestamp = new Date().getTime()
      const isClaimActive =
        start < currentTimestamp &&
        start + distributionData.duration * 1000 > currentTimestamp &&
        !!distributionData.getClaims(publicKey).length
      setShowClaim(isClaimActive)
    } else {
      setShowClaim(false)
    }
  }, [distributionData, publicKey])

  const scrollToFaqs = () => {
    if (faqRef.current) {
      faqRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start', // or 'end' or 'center'
      })
    }
  }

  return !showLeaderboards ? (
    <>
      <div className="bg-[url('/images/rewards/madlad-tile.png')]">
        <div className="mx-auto flex max-w-[1140px] flex-col items-center p-8 lg:flex-row lg:p-10">
          <div className="mb-6 h-[180px] w-[180px] flex-shrink-0 lg:mb-0 lg:mr-10 lg:h-[220px] lg:w-[220px]">
            <Image
              className="rounded-lg shadow-lg"
              priority
              src="/images/rewards/madlad.png"
              width={260}
              height={260}
              alt="Top Prize"
            />
          </div>
          <div className="flex flex-col items-center lg:items-start">
            <Badge
              label="Season 1"
              borderColor="var(--active)"
              shadowColor="var(--active)"
            />
            <h1 className="my-2 text-center text-4xl lg:text-left">
              Win amazing prizes every week.
            </h1>
            <p className="mb-4 text-center text-lg leading-snug lg:text-left">
              Earn points by performing actions on Mango. More points equals
              more chances to win.
            </p>
            <Button size="large" onClick={scrollToFaqs}>
              How it Works
            </Button>
          </div>
        </div>
      </div>
      {showClaim ? (
        <Claim />
      ) : (
        <Season faqRef={faqRef} showLeaderboard={setShowLeaderboards} />
      )}
    </>
  ) : (
    <Leaderboards
      leaderboard={showLeaderboards}
      goBack={() => setShowLeaderboards('')}
    />
  )
}

export default RewardsPage

const Claim = () => {
  const [showWinModal, setShowWinModal] = useState(false)
  const [showLossModal, setShowLossModal] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimProgress, setClaimProgress] = useState(0)
  const [distribution, setDistribution] = useState<Distribution | undefined>(
    undefined,
  )
  const [claims, setClaims] = useState<Claim[] | undefined>([])
  const [claimed, setClaimed] = useState<PublicKey[] | undefined>([])
  const [rewardsClient, setRewardsClient] = useState<
    MangoMintsRedemptionClient | undefined
  >(undefined)

  const state = mangoStore.getState()
  const provider = state.client.program.provider
  const connection = provider.connection
  //used to sing tx do not deconstruct
  const wallet = useWallet()

  const {
    data: currentSeasonData,
    // isFetching: fetchingCurrentSeasonData,
    // isLoading: loadingCurrentSeasonData,
  } = useQuery(['current-season-data'], () => fetchCurrentSeason(), {
    cacheTime: 1000 * 60 * 10,
    staleTime: 1000 * 60,
    retry: 3,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!wallet.publicKey || !currentSeasonData) return
    const fetchRewards = async () => {
      const client = new MangoMintsRedemptionClient(provider as AnchorProvider)
      const d = await client.loadDistribution(
        parseInt(
          `${DISTRIBUTION_NUMBER_PREFIX}${currentSeasonData['season_id'] - 1}`,
        ),
      )
      setDistribution(d)
      setClaims(d.getClaims(wallet.publicKey!))
      setClaimed(await d.getClaimed())
      setRewardsClient(client)
    }

    fetchRewards().catch((e) => {
      console.error('Failed to fetch prize distribution', e)
    })
  }, [provider, connection, wallet])

  const handleClaimRewards = useCallback(async () => {
    if (!distribution || !wallet.publicKey || !claims || !rewardsClient) return
    const transactionInstructions: TransactionInstructionWithType[] = []
    // Create claim account if it doesn't exist
    if (claimed === undefined) {
      transactionInstructions.push({
        instructionsSet: [
          new TransactionInstructionWithSigners(
            await rewardsClient.program.methods
              .claimAccountCreate()
              .accounts({
                distribution: distribution.publicKey,
                claimAccount: distribution.findClaimAccountAddress(
                  wallet.publicKey!,
                ),
                claimant: wallet.publicKey!,
                payer: wallet.publicKey!,
                systemProgram: web3.SystemProgram.programId,
                rent: web3.SYSVAR_RENT_PUBKEY,
              })
              .instruction(),
          ),
        ],
        sequenceType: SequenceType.Sequential,
      })
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
          await distribution.makeClaimInstructions(
            wallet.publicKey!,
            claim.mint,
          )
        ).map(
          (ix: web3.TransactionInstruction) =>
            new TransactionInstructionWithSigners(ix),
        )

        claimIxes.push(...ixs)
      }
      chunk(claimIxes, 4).map((x) =>
        transactionInstructions.push({
          instructionsSet: x,
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
          afterAllTxConfirmed: () => {
            console.log('afterAllTxConfirmed')
            setClaimProgress(100)
          },
          afterEveryTxConfirmation: () => {
            console.log('afterEveryTxConfirmation')
            setClaimProgress(
              claimProgress + 90 / transactionInstructions.length,
            )
          },
          onError: (e, notProcessedTransactions, originalProps) => {
            console.log('error', e, notProcessedTransactions, originalProps)
          },
        },
        config: {
          maxTxesInBatch: 10,
          autoRetry: false,
          logFlowInfo: true,
        },
      })
    } catch (e) {
      console.error(e)
    } finally {
      setIsClaiming(false)
    }
  }, [distribution, wallet, claims, rewardsClient, connection])

  return claims === undefined ? (
    <span>Loading...</span>
  ) : (
    <>
      <div className="flex items-center justify-center bg-th-bkg-3 px-4 py-3">
        <ClockIcon className="mr-2 h-5 w-5 text-th-active" />
        <p className="text-base text-th-fgd-2">
          Season 1 claim ends in:{' '}
          <span className="font-bold text-th-fgd-1">24 hours</span>
        </p>
      </div>
      <div className="mx-auto grid max-w-[1140px] grid-cols-12 gap-4 p-8 lg:gap-6 lg:p-10">
        <div className="col-span-12">
          <div className="mb-6 text-center md:mb-12">
            <h2 className="mb-2 text-5xl">Congratulations!</h2>
            <p className="text-lg">
              You earned {claims.length} boxes in Season 1
            </p>
          </div>
          <div className="flex flex-row space-y-6 md:items-center md:justify-center md:space-x-3">
            {claims.map((c) => {
              return (
                <div
                  className="flex flex-col items-center p-6"
                  key={c.mint.toBase58()}
                >
                  <Image
                    className="md:-mt-10"
                    src="/images/rewards/cube.png"
                    width={140}
                    height={140}
                    alt="Reward"
                    style={{ width: 'auto', maxWidth: '140px' }}
                  />
                  <div className="mt-5 text-lg">
                    {c.quantity.toString()} {c.mintProperties['name']}
                  </div>
                  {claimed !== undefined &&
                  claimed.find((cl) => cl.equals(c.mint)) !== undefined ? (
                    <div className="mt-5 text-lg">Claimed!</div>
                  ) : undefined}
                </div>
              )
            })}
          </div>
          {isClaiming ? (
            <div>
              <div className="mt-2.5 flex h-2 w-full flex-grow rounded bg-th-bkg-4">
                <div
                  style={{
                    width: `${claimProgress}%`,
                  }}
                  className={`flex rounded bg-th-up`}
                ></div>
              </div>
              <div className="mx-auto mt-5 text-center text-lg">
                Claiming rewards...
              </div>
            </div>
          ) : (
            <Button
              className="mx-auto mt-8 block"
              onClick={() => handleClaimRewards()}
              size="large"
            >
              Claim Rewards
            </Button>
          )}
        </div>
      </div>
      {showWinModal ? (
        <ClaimWinModal
          isOpen={showWinModal}
          onClose={() => setShowWinModal(false)}
        />
      ) : null}
      {showLossModal ? (
        <ClaimLossModal
          isOpen={showLossModal}
          onClose={() => setShowLossModal(false)}
        />
      ) : null}
    </>
  )
}
