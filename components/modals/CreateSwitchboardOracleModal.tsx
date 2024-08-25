import mangoStore from '@store/mangoStore'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  CrankAccount,
  QueueAccount,
  SwitchboardProgram,
} from '@switchboard-xyz/solana.js'
import { OracleJob } from '@switchboard-xyz/common'
import Button from '@components/shared/Button'
import { MANGO_DAO_WALLET } from 'utils/governance/constants'
import { Connection, PublicKey } from '@solana/web3.js'
import chunk from 'lodash/chunk'
import { useTranslation } from 'next-i18next'
import { notify } from 'utils/notifications'
import { isMangoError } from 'types'
import { useCallback, useState } from 'react'
import Loading from '@components/shared/Loading'
import {
  LISTING_PRESETS,
  LISTING_PRESETS_KEY,
  tierSwitchboardSettings,
  tierToSwitchboardJobSwapValue,
} from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'
import { createComputeBudgetIx } from '@blockworks-foundation/mango-v4'
import {
  LSTExactIn,
  LSTExactOut,
  tokenInSolOutReversedSolPool,
  tokenInSolOutSolPool,
  tokenInUsdcOutUsdcPool,
  solInTokenOutReversedSolPool,
  solInTokenOutSolPool,
  usdcInTokenOutUsdcPool,
} from 'utils/switchboardTemplates/templates'
import {
  SequenceType,
  TransactionInstructionWithSigners,
} from '@blockworks-foundation/mangolana/lib/globalTypes'
import {
  TransactionInstructionWithType,
  sendSignAndConfirmTransactions,
} from '@blockworks-foundation/mangolana/lib/transactions'
import { LITE_RPC_URL } from '@components/settings/RpcSettings'

const poolAddressError = 'no-pool-address-found'
const wrongTierPassedForCreation = 'Wrong tier passed for creation of oracle'

const SWITCHBOARD_PERMISSIONLESS_QUE =
  '5JYwqvKkqp35w8Nq3ba4z1WYUeJQ1rB36V8XvaGp6zn1'
const SWITCHBOARD_PERMISSIONLESS_CRANK =
  'BKtF8yyQsj3Ft6jb2nkfpEKzARZVdGgdEPs6mFmZNmbA'
const SOL_PRICE = 140

type BaseProps = ModalProps & {
  openbookMarketPk: string
  baseTokenPk: string
  baseTokenName: string
  tierKey: LISTING_PRESETS_KEY
  isSolPool: boolean
  isReversedPool: boolean
  stakePoolAddress: string
  tokenPrice: number
  onClose: (oraclePk?: PublicKey) => void
}

type RaydiumProps = BaseProps & {
  raydiumPoolAddress: string
  orcaPoolAddress?: string
}

type OrcaProps = BaseProps & {
  raydiumPoolAddress?: string
  orcaPoolAddress: string
}

const CreateSwitchboardOracleModal = ({
  isOpen,
  onClose,
  baseTokenPk,
  baseTokenName,
  raydiumPoolAddress,
  orcaPoolAddress,
  tierKey,
  tokenPrice,
  isSolPool,
  isReversedPool,
  stakePoolAddress,
}: RaydiumProps | OrcaProps) => {
  const { t } = useTranslation(['governance'])
  const connection = mangoStore((s) => s.connection)
  const client = mangoStore((s) => s.client)
  const wallet = useWallet()
  const quoteTokenName = 'USD'

  const [creatingOracle, setCreatingOracle] = useState(false)

  const create = useCallback(async () => {
    try {
      const swapValue = tierToSwitchboardJobSwapValue[tierKey]
      setCreatingOracle(true)
      const payer = wallet!.publicKey!
      if (!orcaPoolAddress && !raydiumPoolAddress && !stakePoolAddress) {
        throw poolAddressError
      }
      const poolPropertyName = orcaPoolAddress
        ? 'orcaPoolAddress'
        : 'raydiumPoolAddress'
      const poolAddress = orcaPoolAddress ? orcaPoolAddress : raydiumPoolAddress
      const isReversePool = !stakePoolAddress ? isReversedPool : false

      const program = await SwitchboardProgram.load(connection)

      const [[queueAccount], [crankAccount]] = await Promise.all([
        QueueAccount.load(program, SWITCHBOARD_PERMISSIONLESS_QUE),
        CrankAccount.load(program, SWITCHBOARD_PERMISSIONLESS_CRANK),
      ])

      const settingFromLib = tierSwitchboardSettings[tierKey]

      if (!settingFromLib) {
        throw wrongTierPassedForCreation
      }

      const [aggregatorAccount, txArray1] =
        await queueAccount.createFeedInstructions(payer, {
          name: `${baseTokenName}/${quoteTokenName}`,
          batchSize: settingFromLib.batchSize,
          minRequiredOracleResults: settingFromLib.minRequiredOracleResults,
          minRequiredJobResults: 2,
          minUpdateDelaySeconds: settingFromLib.minUpdateDelaySeconds,
          forceReportPeriod: 60 * 60,
          withdrawAuthority: MANGO_DAO_WALLET,
          authority: payer,
          crankDataBuffer: crankAccount.dataBuffer?.publicKey,
          crankPubkey: crankAccount.publicKey,
          fundAmount: settingFromLib.fundAmount,
          slidingWindow: true,
          disableCrank: false,
          maxPriorityFeeMultiplier: 2,
          priorityFeeBumpPeriod: 30,
          priorityFeeBump: 1000000,
          basePriorityFee: 1000,
          jobs: [
            {
              weight: 1,
              data: OracleJob.encodeDelimited(
                stakePoolAddress
                  ? OracleJob.fromYaml(
                      LSTExactIn(
                        baseTokenPk,
                        Math.ceil(Number(swapValue) / tokenPrice).toString(),
                      ),
                    )
                  : OracleJob.fromYaml(
                      !isSolPool
                        ? usdcInTokenOutUsdcPool(
                            baseTokenPk,
                            swapValue!,
                            poolAddress!,
                            poolPropertyName,
                          )
                        : isReversePool
                        ? solInTokenOutReversedSolPool(
                            baseTokenPk,
                            (Number(swapValue) / SOL_PRICE).toString(),
                            poolAddress!,
                            poolPropertyName,
                          )
                        : solInTokenOutSolPool(
                            baseTokenPk,
                            (Number(swapValue) / SOL_PRICE).toString(),
                            poolAddress!,
                            poolPropertyName,
                          ),
                    ),
              ).finish(),
            },
            {
              weight: 1,
              data: OracleJob.encodeDelimited(
                stakePoolAddress
                  ? OracleJob.fromYaml(
                      LSTExactOut(
                        baseTokenPk,
                        Math.ceil(Number(swapValue) / tokenPrice).toString(),
                      ),
                    )
                  : OracleJob.fromYaml(
                      !isSolPool
                        ? tokenInUsdcOutUsdcPool(
                            baseTokenPk,
                            swapValue!,
                            poolAddress!,
                            poolPropertyName,
                          )
                        : isReversePool
                        ? tokenInSolOutReversedSolPool(
                            baseTokenPk,
                            (Number(swapValue) / SOL_PRICE).toString(),
                            poolAddress!,
                            poolPropertyName,
                          )
                        : tokenInSolOutSolPool(
                            baseTokenPk,
                            (Number(swapValue) / SOL_PRICE).toString(),
                            poolAddress!,
                            poolPropertyName,
                          ),
                    ),
              ).finish(),
            },
          ],
        })

      const lockTx = aggregatorAccount.lockInstruction(payer, {})
      const transferAuthIx = aggregatorAccount.setAuthorityInstruction(payer, {
        newAuthority: MANGO_DAO_WALLET,
      })

      const instructions = [
        ...[...txArray1, lockTx, transferAuthIx].flatMap((x) => x.ixns),
      ]
      const signers = [
        ...[...txArray1, lockTx, transferAuthIx].flatMap((x) => x.signers),
      ]

      const transactionInstructions: TransactionInstructionWithType[] = []
      chunk(instructions, 1).map((chunkInstructions) =>
        transactionInstructions.push({
          instructionsSet: [
            new TransactionInstructionWithSigners(createComputeBudgetIx(80000)),
            ...chunkInstructions.map(
              (inst) =>
                new TransactionInstructionWithSigners(
                  inst,
                  signers.filter((x) =>
                    chunkInstructions.find((instruction) =>
                      instruction.keys
                        .filter((key) => key.isSigner)
                        .find((key) => key.pubkey.equals(x.publicKey)),
                    ),
                  ),
                ),
            ),
          ],
          sequenceType: SequenceType.Sequential,
        }),
      )
      await sendSignAndConfirmTransactions({
        connection,
        wallet,
        transactionInstructions,
        backupConnections: client.opts.multipleConnections
          ? [...client.opts.multipleConnections]
          : [new Connection(LITE_RPC_URL, 'recent')],
        config: {
          maxTxesInBatch: 20,
          autoRetry: true,
          logFlowInfo: true,
          maxRetries: 5,
        },
      })
      notify({
        type: 'success',
        title: 'Successfully created oracle',
      })
      window.open(
        `https://app.switchboard.xyz/solana/mainnet/feed/${aggregatorAccount.publicKey.toBase58()}`,
        '_blank',
      )
      setCreatingOracle(false)
      onClose(aggregatorAccount.publicKey)
    } catch (e) {
      console.log(e)
      setCreatingOracle(false)
      if (e === poolAddressError) {
        notify({
          title: 'Transaction failed',
          description: 'No orca or raydium pool found for oracle',
          type: 'error',
        })
      } else if (e === wrongTierPassedForCreation) {
        notify({
          title: 'Transaction failed',
          description: 'Wrong tier passed for oracle creation',
          type: 'error',
        })
      } else if (isMangoError(e)) {
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      } else {
        notify({
          title: 'Transaction failed',
          description: `${e}`,
          type: 'error',
        })
      }
    }
  }, [
    baseTokenName,
    baseTokenPk,
    client.opts.multipleConnections,
    connection,
    isReversedPool,
    isSolPool,
    onClose,
    orcaPoolAddress,
    raydiumPoolAddress,
    stakePoolAddress,
    tierKey,
    tokenPrice,
    wallet,
  ])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 pb-4">
        <p>
          {t('create-switch-oracle')} {baseTokenName}/USD for tier{' '}
          {LISTING_PRESETS[tierKey].preset_name}
        </p>
        <p>
          {t('estimated-oracle-cost')}{' '}
          {tierSwitchboardSettings[tierKey]?.fundAmount} SOL
        </p>
        <p>
          This oracle can be used only with this tier or lower, cant be used
          with higher tiers
        </p>
      </div>

      <div className="float-right">
        <Button disabled={creatingOracle} onClick={create}>
          {creatingOracle ? (
            <Loading className="w-5"></Loading>
          ) : (
            t('create-oracle')
          )}
        </Button>
      </div>
    </Modal>
  )
}

export default CreateSwitchboardOracleModal
