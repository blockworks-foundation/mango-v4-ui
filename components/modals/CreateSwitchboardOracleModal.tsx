import mangoStore, { CLUSTER } from '@store/mangoStore'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { useWallet } from '@solana/wallet-adapter-react'
import { QueueAccount, SwitchboardProgram } from '@switchboard-xyz/solana.js'
import { OracleJob } from '@switchboard-xyz/common'
import Button from '@components/shared/Button'

const CreateSwitchboardOracleModal = ({ isOpen, onClose }: ModalProps) => {
  const connection = mangoStore((s) => s.connection)
  const wallet = useWallet()
  const baseTokenName = ''
  const quoteTokenName = ''

  const create = async () => {
    const payer = wallet!.publicKey!

    const program = await SwitchboardProgram.load(CLUSTER, connection)
    const [queueAccount, txObject] = await QueueAccount.createInstructions(
      program,
      payer,
      {
        queueSize: 8,
        reward: 0,
        minStake: 0,
        oracleTimeout: 180,
        slashingEnabled: false,
        unpermissionedFeeds: true,
        unpermissionedVrf: true,
        enableBufferRelayers: false,
      }
    )

    const [crankAccount, crankInit] =
      await queueAccount.createCrankInstructions(payer, {
        maxRows: 1000,
      })

    const [, txArray] = await queueAccount.createOracleInstructions(payer, {
      queueAuthorityPubkey: wallet!.publicKey!,
    })

    const [aggregatorAccount, txArray1] =
      await queueAccount.createFeedInstructions(payer, {
        name: `${baseTokenName}/${quoteTokenName}`,
        batchSize: 6,
        minRequiredOracleResults: 3,
        minRequiredJobResults: 2,
        minUpdateDelaySeconds: 300,
        queueAuthorityPubkey: wallet!.publicKey!,
        crankDataBuffer: crankAccount.dataBuffer?.publicKey,
        crankPubkey: crankAccount.publicKey,
        fundAmount: 0,
        enable: true,
        basePriorityFee: 0,
        disableCrank: false,
        maxPriorityFeeMultiplier: 0,
        priorityFeeBump: 0,
        priorityFeeBumpPeriod: 0,
        jobs: [
          {
            weight: 1,
            data: OracleJob.encodeDelimited(
              OracleJob.fromObject({
                tasks: [
                  {
                    conditionalTask: {
                      attempt: [
                        {
                          valueTask: {
                            big: '100',
                          },
                        },
                        {
                          divideTask: {
                            job: {
                              tasks: [
                                {
                                  jupiterSwapTask: {
                                    inTokenAddress:
                                      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                                    outTokenAddress:
                                      'xxxxa1sKNGwFtw2kFn8XauW9xq8hBZ5kVtcSesTT9fW',
                                    baseAmountString: '100',
                                  },
                                },
                              ],
                            },
                          },
                        },
                      ],
                      onFailure: [
                        {
                          lpExchangeRateTask: {
                            orcaPoolAddress:
                              '7yJ4gMRJhEoCR48aPE3EAWRmCoygakik81ZS1sajaTnE',
                          },
                        },
                      ],
                    },
                  },
                ],
              })
            ).finish(),
          },
          {
            weight: 1,
            data: OracleJob.encodeDelimited(
              OracleJob.fromObject({
                tasks: [
                  {
                    conditionalTask: {
                      attempt: [
                        {
                          cacheTask: {
                            cacheItems: [
                              {
                                variableName: 'DUAL_QTY',
                                job: {
                                  tasks: [
                                    {
                                      valueTask: {
                                        big: '100',
                                      },
                                    },
                                    {
                                      divideTask: {
                                        job: {
                                          tasks: [
                                            {
                                              serumSwapTask: {
                                                serumPoolAddress:
                                                  'H6rrYK3SUHF2eguZCyJxnSBMJqjXhUtuaki6PHiutvum',
                                              },
                                            },
                                          ],
                                        },
                                      },
                                    },
                                  ],
                                },
                              },
                            ],
                          },
                        },
                        {
                          jupiterSwapTask: {
                            inTokenAddress:
                              'DUALa4FC2yREwZ59PHeu1un4wis36vHRv5hWVBmzykCJ',
                            outTokenAddress:
                              'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                            baseAmountString: '${DUAL_QTY}',
                          },
                        },
                        {
                          divideTask: {
                            big: '${DUAL_QTY}',
                          },
                        },
                      ],
                      onFailure: [
                        {
                          lpExchangeRateTask: {
                            orcaPoolAddress:
                              '7yJ4gMRJhEoCR48aPE3EAWRmCoygakik81ZS1sajaTnE',
                          },
                        },
                      ],
                    },
                  },
                ],
              })
            ).finish(),
          },
        ],
      })
    const lockTx = aggregatorAccount.lockInstruction(payer, {})

    const txes = [txObject, crankInit, ...txArray, ...txArray1, lockTx]
    console.log(txes)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div>
        <Button onClick={create}>Create oracle</Button>
      </div>
    </Modal>
  )
}

export default CreateSwitchboardOracleModal
