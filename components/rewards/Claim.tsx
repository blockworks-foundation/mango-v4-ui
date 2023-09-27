import {
  Claim,
  Distribution,
  MangoMintsRedemptionClient,
} from '@blockworks-foundation/mango-mints-redemption'
import dynamic from 'next/dynamic'
import ClaimWinModal from './ClaimWinModal'
import ClaimLossModal from './ClaimLossModal'
import Button from '@components/shared/Button'
import { ClockIcon } from '@heroicons/react/20/solid'
import { web3 } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useCurrentSeason, useDistribution } from 'hooks/useRewards'
import { chunk } from 'lodash'
import { useState, useEffect, useCallback } from 'react'
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

const RewardsComponent = dynamic(() => import('./RewardsComponents'), {
  loading: () => <p>Loading...</p>,
})

const ClaimPage = () => {
  const [showWinModal, setShowWinModal] = useState(false)
  const [showLossModal, setShowLossModal] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [claimProgress, setClaimProgress] = useState(0)
  const [distribution, setDistribution] = useState<Distribution | undefined>(
    undefined,
  )
  const { jupiterTokens } = useJupiterMints()
  const [showRender, setShowRender] = useState(false)
  const [rewardsWasShown, setRewardsWasShow] = useState(false)
  const [claims, setClaims] = useState<Claim[] | undefined>([])
  const [claimed, setClaimed] = useState<PublicKey[] | undefined>([])
  const [tokenRewardsInfo, setTokensRewardsInfo] = useState<Token[]>([])
  const [rewardsClient, setRewardsClient] = useState<
    MangoMintsRedemptionClient | undefined
  >(undefined)

  const { client } = mangoStore()
  const { publicKey } = useWallet()
  const { data: seasonData } = useCurrentSeason()
  const currentSeason = seasonData?.season_id
  const previousSeason = currentSeason ? currentSeason - 1 : null
  //needed for tx sign
  const wallet = useWallet()

  const provider = client.program.provider
  const connection = provider.connection

  const { data: distributionDataAndClient } = useDistribution(previousSeason!)

  useEffect(() => {
    const handleSetDistribution = async () => {
      setDistribution(distributionDataAndClient!.distribution)
      setClaims(distributionDataAndClient!.distribution!.getClaims(publicKey!))
      setClaimed(await distributionDataAndClient!.distribution!.getClaimed())
      setRewardsClient(distributionDataAndClient!.client)
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
    setShowRender(true)
    setRewardsWasShow(true)
  }
  const handleTokenMetadata = useCallback(async () => {
    const tokens = claims!
      .filter((x) => x.mintProperties.type === 'token')
      .map((t) => jupiterTokens.find((x) => x.address === t.mint.toBase58()))
      .filter((x) => x)
      .map((x) => x as Token)

    //const nfts = claims!.filter((x) => x.mintProperties.type === 'nft')
    setTokensRewardsInfo(tokens)
  }, [claims, jupiterTokens])

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
      transactionInstructions.push({
        instructionsSet: [
          new TransactionInstructionWithSigners(
            await rewardsClient.program.methods
              .claimAccountCreate()
              .accounts({
                distribution: distribution.publicKey,
                claimAccount: distribution.findClaimAccountAddress(publicKey!),
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
  ) : showRender ? (
    <div className="fixed bottom-0 left-0 right-0 top-0 z-[1000]">
      <RewardsComponent
        tokensInfo={tokenRewardsInfo}
        claims={claims}
        setShowRender={setShowRender}
      ></RewardsComponent>
    </div>
  ) : (
    <>
      <div className="flex items-center justify-center bg-th-bkg-3 px-4 py-3">
        <ClockIcon className="mr-2 h-5 w-5 text-th-active" />
        <p className="text-base text-th-fgd-2">
          Season {previousSeason} claim ends in:{' '}
          <span className="font-bold text-th-fgd-1">24 hours</span>
        </p>
      </div>
      <div className="mx-auto grid max-w-[1140px] grid-cols-12 gap-4 p-8 lg:gap-6 lg:p-10">
        <div className="col-span-12">
          <div className="mb-6 text-center md:mb-12">
            <h2 className="mb-2 text-5xl">Congratulations!</h2>
            <p className="text-lg">
              You earned {claims.length} boxes in Season {previousSeason}
            </p>
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
          ) : rewardsWasShown ? (
            <Button
              className="mx-auto mt-8 block"
              onClick={() => handleClaimRewards()}
              size="large"
            >
              Claim
            </Button>
          ) : (
            <Button
              className="mx-auto mt-8 block"
              onClick={() => startShowRewards()}
              size="large"
            >
              Show Rewards
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
export default ClaimPage
