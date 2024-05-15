import {
  ProgramAccount,
  Proposal,
  VoteKind,
  VoteRecord,
  getGovernanceAccount,
  getVoteRecordAddress,
} from '@solana/spl-governance'
import { VoteCountdown } from './VoteCountdown'
import { RawMint } from '@solana/spl-token'
import VoteResults from './VoteResult'
import QuorumProgress from './VoteProgress'
import GovernanceStore from '@store/governanceStore'
import Button from '@components/shared/Button'
import {
  ArrowTopRightOnSquareIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
} from '@heroicons/react/20/solid'
import { BN } from '@coral-xyz/anchor'
import { useEffect, useState } from 'react'
import { MANGO_GOVERNANCE_PROGRAM } from 'utils/governance/constants'
import mangoStore from '@store/mangoStore'
import { castVote } from 'utils/governance/instructions/castVote'
import { useWallet } from '@solana/wallet-adapter-react'
import { relinquishVote } from 'utils/governance/instructions/relinquishVote'
import { PublicKey } from '@solana/web3.js'
import { notify } from 'utils/notifications'
import Loading from '@components/shared/Loading'
import { useTranslation } from 'next-i18next'
import { resolveProposalDescription } from 'utils/governance/tools'

enum PROCESSED_VOTE_TYPE {
  APPROVE,
  DENY,
  RELINQUISH,
}

const ProposalCard = ({
  proposal,
  mangoMint,
}: {
  proposal: ProgramAccount<Proposal>
  mangoMint: RawMint
}) => {
  const { t } = useTranslation('governance')
  const connection = mangoStore((s) => s.connection)
  const client = mangoStore((s) => s.client)
  const governances = GovernanceStore((s) => s.governances)
  const wallet = useWallet()
  const voter = GovernanceStore((s) => s.voter)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const updateProposals = GovernanceStore((s) => s.updateProposals)

  const [processedVoteType, setProcessedVoteType] = useState<
    PROCESSED_VOTE_TYPE | ''
  >('')
  const [voteType, setVoteType] = useState<VoteKind | undefined>(undefined)

  const [voteRecordAddress, setVoteRecordAddress] = useState<PublicKey | null>(
    null,
  )
  const [isVoteCast, setIsVoteCast] = useState(false)
  const [description, setDescription] = useState('')

  const governance =
    governances && governances[proposal.account.governance.toBase58()]
  const canVote = voter.voteWeight.cmp(new BN(1)) !== -1
  const descriptionLink = proposal.account.descriptionLink

  //Approve 0, deny 1
  const vote = async (voteType: VoteKind) => {
    setProcessedVoteType(
      voteType === VoteKind.Approve
        ? PROCESSED_VOTE_TYPE.APPROVE
        : PROCESSED_VOTE_TYPE.DENY,
    )
    try {
      await castVote(
        connection,
        wallet,
        proposal,
        voter.tokenOwnerRecord!,
        voteType,
        vsrClient!,
        client,
      )
      await updateProposals(proposal.pubkey)
    } catch (e) {
      notify({
        title: 'Error',
        description: `${e}`,
        type: 'error',
      })
    }

    setProcessedVoteType('')
  }

  const submitRelinquishVote = async () => {
    setProcessedVoteType(PROCESSED_VOTE_TYPE.RELINQUISH)
    try {
      await relinquishVote(
        connection,
        wallet,
        proposal,
        voter.tokenOwnerRecord!,
        client,
        voteRecordAddress!,
      )
      await updateProposals(proposal.pubkey)
    } catch (e) {
      notify({
        title: 'Error',
        description: `${e}`,
        type: 'error',
      })
    }
    setProcessedVoteType('')
  }

  useEffect(() => {
    const handleGetVoteRecord = async () => {
      setIsVoteCast(false)
      try {
        await getGovernanceAccount(connection, voteRecordAddress!, VoteRecord)
        setIsVoteCast(true)
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    if (voteRecordAddress?.toBase58()) {
      handleGetVoteRecord()
    } else {
      setIsVoteCast(false)
    }
  }, [voteRecordAddress, proposal.pubkey.toBase58()])

  useEffect(() => {
    const handleGetVoteRecordAddress = async () => {
      const voteRecordAddress = await getVoteRecordAddress(
        MANGO_GOVERNANCE_PROGRAM,
        proposal.pubkey,
        voter.tokenOwnerRecord!.pubkey!,
      )
      setVoteRecordAddress(voteRecordAddress)
      try {
        const governanceAccount = await getGovernanceAccount(
          connection,
          voteRecordAddress,
          VoteRecord,
        )
        setIsVoteCast(true)
        setVoteType(governanceAccount.account.vote?.voteType)
      } catch (e) {
        setIsVoteCast(false)
      }
    }
    if (voter.tokenOwnerRecord?.pubkey.toBase58()) {
      handleGetVoteRecordAddress()
    } else {
      setVoteRecordAddress(null)
    }
  }, [proposal.pubkey.toBase58(), voter.tokenOwnerRecord?.pubkey.toBase58()])

  useEffect(() => {
    const handleResolveDescription = async () => {
      const description = await resolveProposalDescription(descriptionLink!)
      setDescription(description)
    }
    if (descriptionLink) {
      handleResolveDescription()
    } else {
      setDescription('')
    }
  }, [descriptionLink])

  return governance ? (
    <div
      className="rounded-lg border border-th-bkg-3 p-4 md:p-6"
      key={proposal.pubkey.toBase58()}
    >
      <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between">
        <div className="pr-6">
          <h2 className="mb-2 text-lg md:text-xl">
            <a
              href={`https://dao.mango.markets/dao/MNGO/proposal/${proposal.pubkey.toBase58()}`}
            >
              <span className="mr-2">{proposal.account.name}</span>
              <ArrowTopRightOnSquareIcon className="mb-1 inline-block h-4 w-4 shrink-0" />
            </a>
          </h2>
          <p className="mb-2 break-all md:mb-0">{description}</p>
        </div>
        <VoteCountdown
          proposal={proposal.account}
          governance={governance.account}
        />
      </div>
      <div>
        {!isVoteCast ? (
          <div className="flex space-x-4">
            <Button
              className="w-32"
              onClick={() => vote(VoteKind.Approve)}
              disabled={!canVote || processedVoteType !== ''}
              secondary
            >
              <div className="flex items-center justify-center">
                <HandThumbUpIcon className="mr-2 h-4 w-4" />
                {processedVoteType === PROCESSED_VOTE_TYPE.APPROVE ? (
                  <Loading className="w-4"></Loading>
                ) : (
                  t('vote-yes')
                )}
              </div>
            </Button>
            <Button
              className="w-32"
              onClick={() => vote(VoteKind.Deny)}
              disabled={!canVote || processedVoteType !== ''}
              secondary
            >
              <div className="flex items-center justify-center">
                <HandThumbDownIcon className="mr-2 h-4 w-4" />
                {processedVoteType === PROCESSED_VOTE_TYPE.DENY ? (
                  <Loading className="w-4"></Loading>
                ) : (
                  t('vote-no')
                )}
              </div>
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center">
            <Button
              className="mr-4 flex w-40 items-center justify-center"
              disabled={processedVoteType !== ''}
              secondary
              onClick={() => submitRelinquishVote()}
            >
              {processedVoteType === PROCESSED_VOTE_TYPE.RELINQUISH ? (
                <Loading className="w-4"></Loading>
              ) : (
                t('relinquish-vote')
              )}
            </Button>
            {voteType !== undefined ? (
              <div className="my-2 flex">
                <p className="mr-2">{t('current-vote')}</p>
                <span className="font-bold text-th-fgd-2">
                  {voteType === VoteKind.Approve ? (
                    <span className="flex items-center">
                      <HandThumbUpIcon className="mr-1.5 h-3 w-3" />
                      {t('yes')}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <HandThumbDownIcon className="mr-1.5 h-3 w-3" />
                      {t('no')}
                    </span>
                  )}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>
      {mangoMint && (
        <div className="mt-6 flex w-full flex-col space-y-4 border-t border-th-bkg-3 pt-4 md:flex-row md:space-x-6 md:space-y-0">
          <VoteResults communityMint={mangoMint} proposal={proposal.account} />
          <QuorumProgress
            proposal={proposal}
            governance={governance}
            communityMint={mangoMint}
          />
        </div>
      )}
    </div>
  ) : null
}

export default ProposalCard
