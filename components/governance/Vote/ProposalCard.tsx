import {
  ProgramAccount,
  Proposal,
  VoteKind,
  VoteRecord,
  getGovernanceAccount,
  getVoteRecordAddress,
} from '@solana/spl-governance'
import { VoteCountdown } from './VoteCountdown'
import { MintInfo } from '@solana/spl-token'
import VoteResults from './VoteResult'
import QuorumProgress from './VoteProgress'
import GovernanceStore from '@store/governanceStore'
import Button from '@components/shared/Button'
import { HandThumbDownIcon, HandThumbUpIcon } from '@heroicons/react/20/solid'
import { BN } from '@project-serum/anchor'
import { useEffect, useState } from 'react'
import { MANGO_GOVERNANCE_PROGRAM } from 'utils/governance/constants'
import mangoStore from '@store/mangoStore'
import { castVote } from 'utils/governance/instructions/castVote'
import { useWallet } from '@solana/wallet-adapter-react'
import { relinquishVote } from 'utils/governance/instructions/relinquishVote'
import { PublicKey } from '@solana/web3.js'
import { notify } from 'utils/notifications'
import Loading from '@components/shared/Loading'

const ProposalCard = ({
  proposal,
  mangoMint,
}: {
  proposal: ProgramAccount<Proposal>
  mangoMint: MintInfo
}) => {
  const connection = mangoStore((s) => s.connection)
  const client = mangoStore((s) => s.client)
  const governances = GovernanceStore((s) => s.governances)
  const wallet = useWallet()
  const voter = GovernanceStore((s) => s.voter)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const updateProposals = GovernanceStore((s) => s.updateProposals)

  const [voting, setVoting] = useState(false)

  const [voteRecordAddress, setVoteRecordAddress] = useState<PublicKey | null>(
    null
  )
  const [isVoteCast, setIsVoteCast] = useState(false)

  const governance =
    governances && governances[proposal.account.governance.toBase58()]
  const canVote = voter.voteWeight.cmp(new BN(1)) !== -1

  //Approve 0, deny 1
  const vote = async (voteType: VoteKind) => {
    setVoting(true)
    try {
      await castVote(
        connection,
        wallet,
        proposal,
        voter.tokenOwnerRecord!,
        voteType,
        vsrClient!,
        client
      )
      await updateProposals(proposal.pubkey)
    } catch (e) {
      notify({
        title: 'Error',
        description: `${e}`,
        type: 'error',
      })
    }

    setVoting(false)
  }

  const submitRelinquishVote = async () => {
    setVoting(true)
    try {
      await relinquishVote(
        connection,
        wallet,
        proposal,
        voter.tokenOwnerRecord!,
        client,
        voteRecordAddress!
      )
      await updateProposals(proposal.pubkey)
    } catch (e) {
      notify({
        title: 'Error',
        description: `${e}`,
        type: 'error',
      })
    }
    setVoting(false)
  }

  useEffect(() => {
    const handleGetVoteRecord = async () => {
      setIsVoteCast(false)
      const voteRecordAddress = await getVoteRecordAddress(
        MANGO_GOVERNANCE_PROGRAM,
        proposal.pubkey,
        voter.tokenOwnerRecord!.pubkey!
      )
      setVoteRecordAddress(voteRecordAddress)
      try {
        await getGovernanceAccount(connection, voteRecordAddress, VoteRecord)
        setIsVoteCast(true)
      } catch (e) {
        setIsVoteCast(false)
      }
    }
    if (voter.tokenOwnerRecord?.pubkey.toBase58()) {
      handleGetVoteRecord()
    } else {
      setVoteRecordAddress(null)
      setIsVoteCast(false)
    }
  }, [
    voter.tokenOwnerRecord?.pubkey.toBase58(),
    proposal.pubkey.toBase58(),
    wallet.publicKey?.toBase58(),
  ])

  return (
    governance && (
      <div
        className="border-b border-th-bkg-3 p-4"
        key={proposal.pubkey.toBase58()}
      >
        <div>{proposal.account.name}</div>
        <div>
          <a
            href={`https://dao.mango.markets/dao/MNGO/proposal/${proposal.pubkey.toBase58()}`}
          >
            Read full description
          </a>
        </div>
        <VoteCountdown
          proposal={proposal.account}
          governance={governance.account}
        />
        {mangoMint && (
          <>
            <VoteResults
              communityMint={mangoMint}
              proposal={proposal.account}
            ></VoteResults>
            <QuorumProgress
              proposal={proposal}
              governance={governance}
              communityMint={mangoMint}
            ></QuorumProgress>
          </>
        )}
        <div>
          {!isVoteCast ? (
            <>
              <Button
                className="w-1/2"
                onClick={() => vote(VoteKind.Approve)}
                disabled={!canVote}
              >
                <div className="flex flex-row items-center justify-center">
                  <HandThumbUpIcon className="mr-2 h-4 w-4" />
                  {voting ? <Loading className="w-3"></Loading> : 'Vote Yes'}
                </div>
              </Button>
              <Button
                className="w-1/2"
                onClick={() => vote(VoteKind.Deny)}
                disabled={!canVote}
              >
                <div className="flex flex-row items-center justify-center">
                  <HandThumbDownIcon className="mr-2 h-4 w-4" />
                  {voting ? <Loading className="w-3"></Loading> : 'Vote No'}
                </div>
              </Button>{' '}
            </>
          ) : (
            <Button
              className="min-w-[200px]"
              onClick={() => submitRelinquishVote()}
            >
              {voting ? <Loading className="w-3"></Loading> : 'Relinquish Vote'}
            </Button>
          )}
        </div>
      </div>
    )
  )
}

export default ProposalCard
