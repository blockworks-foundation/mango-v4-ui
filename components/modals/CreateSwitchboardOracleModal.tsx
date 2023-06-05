import mangoStore, { CLUSTER } from '@store/mangoStore'
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
import { USDC_MINT } from 'utils/constants'
import { Transaction } from '@solana/web3.js'
import { chunk } from 'lodash'
import { useTranslation } from 'next-i18next'
import { notify } from 'utils/notifications'
import { isMangoError } from 'types'
import { useCallback, useState } from 'react'
import Loading from '@components/shared/Loading'

const poolAddressError = 'no-pool-address-found'

const SWITCHBOARD_PERMISSIONLESS_QUE =
  '5JYwqvKkqp35w8Nq3ba4z1WYUeJQ1rB36V8XvaGp6zn1'
const SWITCHBOARD_PERMISSIONLESS_CRANK =
  'BKtF8yyQsj3Ft6jb2nkfpEKzARZVdGgdEPs6mFmZNmbA'

type BaseProps = ModalProps & {
  openbookMarketPk: string
  baseTokenPk: string
  baseTokenName: string
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
  openbookMarketPk,
  baseTokenPk,
  baseTokenName,
  raydiumPoolAddress,
  orcaPoolAddress,
}: RaydiumProps | OrcaProps) => {
  const { t } = useTranslation(['governance'])
  const connection = mangoStore((s) => s.connection)
  const wallet = useWallet()
  const quoteTokenName = 'USDC'

  const [creatingOracle, setCreatingOracle] = useState(false)

  const create = useCallback(async () => {
    try {
      setCreatingOracle(true)
      const payer = wallet!.publicKey!
      if (!orcaPoolAddress && !raydiumPoolAddress) {
        throw poolAddressError
      }
      const poolPropertyName = orcaPoolAddress
        ? 'orcaPoolAddress'
        : 'raydiumPoolAddress'
      const poolAddress = orcaPoolAddress ? orcaPoolAddress : raydiumPoolAddress

      const program = await SwitchboardProgram.load(CLUSTER, connection)

      const [[queueAccount], [crankAccount]] = await Promise.all([
        QueueAccount.load(program, SWITCHBOARD_PERMISSIONLESS_QUE),
        CrankAccount.load(program, SWITCHBOARD_PERMISSIONLESS_CRANK),
      ])

      const [aggregatorAccount, txArray1] =
        await queueAccount.createFeedInstructions(payer, {
          name: `${baseTokenName}/${quoteTokenName}`,
          batchSize: 6,
          minRequiredOracleResults: 3,
          minRequiredJobResults: 2,
          minUpdateDelaySeconds: 60,
          withdrawAuthority: MANGO_DAO_WALLET,
          authority: MANGO_DAO_WALLET,
          crankDataBuffer: crankAccount.dataBuffer?.publicKey,
          crankPubkey: crankAccount.publicKey,
          fundAmount: 2.6,
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
                                      inTokenAddress: USDC_MINT,
                                      outTokenAddress: baseTokenPk,
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
                              [poolPropertyName]: poolAddress,
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
                                  variableName: 'IN_TOKEN_QTY',
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
                                                    openbookMarketPk,
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
                              inTokenAddress: baseTokenPk,
                              outTokenAddress: USDC_MINT,
                              baseAmountString: '${IN_TOKEN_QTY}',
                            },
                          },
                          {
                            divideTask: {
                              big: '${IN_TOKEN_QTY}',
                            },
                          },
                        ],
                        onFailure: [
                          {
                            lpExchangeRateTask: {
                              [poolPropertyName]: poolAddress,
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

      const txChunks = chunk([...txArray1, lockTx], 1)
      const transactions: Transaction[] = []
      const latestBlockhash = await connection.getLatestBlockhash('finalized')
      for (const chunk of txChunks) {
        const tx = new Transaction()
        const singers = [...chunk.flatMap((x) => x.signers)]
        tx.add(...chunk.flatMap((x) => x.ixns))
        tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight
        tx.recentBlockhash = latestBlockhash.blockhash
        tx.feePayer = payer
        if (singers.length) {
          tx.sign(...singers)
        }
        transactions.push(tx)
      }
      const signedTransactions = await wallet.signAllTransactions!(transactions)
      for (const tx of signedTransactions) {
        const rawTransaction = tx.serialize()
        const address = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
        })
        await connection.confirmTransaction({
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          signature: address,
        })
      }
      setCreatingOracle(false)
      onClose()
    } catch (e) {
      setCreatingOracle(false)
      if (e === poolAddressError) {
        notify({
          title: 'Transaction failed',
          description: 'No orca or raydium pool found for oracle',
          type: 'error',
        })
      } else {
        if (!isMangoError(e)) return
        notify({
          title: 'Transaction failed',
          description: e.message,
          txid: e?.txid,
          type: 'error',
        })
      }
    }
  }, [
    baseTokenName,
    baseTokenPk,
    connection,
    onClose,
    openbookMarketPk,
    orcaPoolAddress,
    raydiumPoolAddress,
    wallet,
  ])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 pb-4">
        <p>
          {t('create-switch-oracle')} {baseTokenName}/USDC
        </p>
        <p>{t('estimated-oracle-cost')}</p>
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
