import { BN, EventParser } from '@coral-xyz/anchor'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import {
  DEPOSIT_EVENT_NAME,
  SIMULATION_WALLET,
  VOTER_INFO_EVENT_NAME,
} from '../constants'
import { tryGetMint } from '../tools'
import { VsrClient } from '../voteStakeRegistryClient'
import {
  DepositWithMintAccount,
  emptyPk,
  getRegistrarPDA,
  getVoterPDA,
  TokenProgramAccount,
  tryGetRegistrar,
  tryGetVoter,
} from '../accounts/vsrAccounts'
import { RawMint } from '@solana/spl-token'

type Event = {
  depositEntryIndex: number
  locking: {
    amount: BN
    endTimestamp: BN
    vesting: {
      nextTimestamp: BN
      rate: BN
    }
  } | null
  unlocked: BN
  votingMintConfigIndex: number
  votingPower: BN
  votingPowerBaseline: BN
}

type EventData = {
  data: Event
  name: string
}

export const getDeposits = async ({
  isUsed = true,
  realmPk,
  walletPk,
  communityMintPk,
  client,
  connection,
}: {
  isUsed?: boolean | undefined
  realmPk: PublicKey
  walletPk: PublicKey
  communityMintPk: PublicKey
  client: VsrClient
  connection: Connection
}) => {
  const clientProgramId = client.program.programId
  const { registrar } = await getRegistrarPDA(
    realmPk,
    communityMintPk,
    clientProgramId,
  )
  const { voter } = await getVoterPDA(registrar, walletPk, clientProgramId)
  const [existingVoter, existingRegistrar] = await Promise.all([
    tryGetVoter(voter, client),
    tryGetRegistrar(registrar, client),
  ])

  const mintCfgs = existingRegistrar?.votingMints || []
  const mints: { [key: string]: TokenProgramAccount<RawMint> | undefined } = {}
  let votingPower = new BN(0)
  let votingPowerFromDeposits = new BN(0)
  let deposits: DepositWithMintAccount[] = []
  for (const i of mintCfgs) {
    if (i.mint.toBase58() !== emptyPk) {
      const mint = await tryGetMint(connection, i.mint)
      mints[i.mint.toBase58()] = mint
    }
  }
  if (existingVoter) {
    deposits = existingVoter.deposits
      .map(
        (x, idx) =>
          ({
            ...x,
            mint: mints[mintCfgs![x.votingMintConfigIdx].mint.toBase58()],
            index: idx,
          }) as unknown as DepositWithMintAccount,
      )
      .filter((x) => typeof isUsed === 'undefined' || x.isUsed === isUsed)
    const usedDeposits = deposits.filter((x) => x.isUsed)
    const areThereAnyUsedDeposits = usedDeposits.length
    if (areThereAnyUsedDeposits) {
      const events = await getDepositsAdditionalInfoEvents(
        client,
        usedDeposits,
        connection,
        registrar,
        voter,
      )
      const depositsInfo = events.filter((x) => x.name === DEPOSIT_EVENT_NAME)
      const votingPowerEntry = events.find(
        (x) => x.name === VOTER_INFO_EVENT_NAME,
      )
      deposits = deposits.map((x) => {
        const additionalInfoData = depositsInfo.find(
          (info) => info.data.depositEntryIndex === x.index,
        )?.data

        x.currentlyLocked = additionalInfoData?.locking?.amount || new BN(0)
        x.available = additionalInfoData?.unlocked || new BN(0)
        x.vestingRate = additionalInfoData?.locking?.vesting?.rate || new BN(0)
        x.nextVestingTimestamp =
          additionalInfoData?.locking?.vesting?.nextTimestamp || null
        x.votingPower = additionalInfoData?.votingPower || new BN(0)
        x.votingPowerBaseline =
          additionalInfoData?.votingPowerBaseline || new BN(0)
        return x
      })
      if (
        votingPowerEntry &&
        !votingPowerEntry.data.votingPowerBaseline.isZero()
      ) {
        votingPowerFromDeposits = votingPowerEntry.data.votingPowerBaseline
      }
      if (votingPowerEntry && !votingPowerEntry.data.votingPower.isZero()) {
        votingPower = votingPowerEntry.data.votingPower
      }
      return { votingPower, deposits, votingPowerFromDeposits }
    }
  }
  return { votingPower, deposits, votingPowerFromDeposits }
}

const getDepositsAdditionalInfoEvents = async (
  client: VsrClient,
  usedDeposits: DepositWithMintAccount[],
  connection: Connection,
  registrar: PublicKey,
  voter: PublicKey,
) => {
  //because we switch wallet in here we can't use rpc from npm module
  //anchor dont allow to switch wallets inside existing client
  //parse events response as anchor do
  const events: EventData[] = []
  const parser = new EventParser(client.program.programId, client.program.coder)
  const maxRange = 8
  const maxIndex = Math.max(...usedDeposits.map((x) => x.index)) + 1
  const numberOfSimulations = Math.ceil(maxIndex / maxRange)
  for (let i = 0; i < numberOfSimulations; i++) {
    const take = maxRange
    const transaction = new Transaction({
      feePayer: new PublicKey(SIMULATION_WALLET),
    })
    const logVoterInfoIx = await client.program.methods
      .logVoterInfo(maxRange * i, take)
      .accounts({ registrar, voter })
      .instruction()
    transaction.add(logVoterInfoIx)
    const batchOfDeposits = await connection.simulateTransaction(transaction)
    const logEvents = parser.parseLogs(
      batchOfDeposits.value.logs!,
    ) as unknown as EventData[]
    events.push(...[...logEvents])
  }
  return events
}
