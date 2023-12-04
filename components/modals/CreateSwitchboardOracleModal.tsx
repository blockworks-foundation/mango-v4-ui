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
import { PublicKey, Transaction } from '@solana/web3.js'
import chunk from 'lodash/chunk'
import { useTranslation } from 'next-i18next'
import { notify } from 'utils/notifications'
import { isMangoError } from 'types'
import { useCallback, useState } from 'react'
import Loading from '@components/shared/Loading'
import { WhirlpoolContext, buildWhirlpoolClient } from '@orca-so/whirlpools-sdk'
import { LIQUIDITY_STATE_LAYOUT_V4 } from '@raydium-io/raydium-sdk'

const poolAddressError = 'no-pool-address-found'

const SWITCHBOARD_PERMISSIONLESS_QUE =
  '5JYwqvKkqp35w8Nq3ba4z1WYUeJQ1rB36V8XvaGp6zn1'
const SWITCHBOARD_PERMISSIONLESS_CRANK =
  'BKtF8yyQsj3Ft6jb2nkfpEKzARZVdGgdEPs6mFmZNmbA'

type BaseProps = ModalProps & {
  openbookMarketPk: string
  baseTokenPk: string
  baseTokenName: string
  tier: string
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
  tier,
}: RaydiumProps | OrcaProps) => {
  const { t } = useTranslation(['governance'])
  const connection = mangoStore((s) => s.connection)
  const wallet = useWallet()
  const quoteTokenName = 'USD'
  const pythUsdOracle = 'Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD'
  const tierToSwapValue: { [key: string]: string } = {
    PREMIUM: '10000',
    MID: '2000',
    MEME: '500',
    SHIT: '100',
    UNTRUSTED: '100',
  }

  const tierSettings: {
    [key: string]: {
      fundAmount: number
      batchSize: number
      minRequiredOracleResults: number
      minUpdateDelaySeconds: number
    }
  } = {
    PREMIUM: {
      fundAmount: 5,
      minRequiredOracleResults: 3,
      minUpdateDelaySeconds: 6,
      batchSize: 5,
    },
    MID: {
      fundAmount: 5,
      minRequiredOracleResults: 1,
      minUpdateDelaySeconds: 6,
      batchSize: 2,
    },
    MEME: {
      fundAmount: 2,
      minRequiredOracleResults: 1,
      minUpdateDelaySeconds: 30,
      batchSize: 2,
    },
    SHIT: {
      fundAmount: 2,
      batchSize: 2,
      minRequiredOracleResults: 1,
      minUpdateDelaySeconds: 300,
    },
    UNTRUSTED: {
      fundAmount: 2,
      batchSize: 2,
      minRequiredOracleResults: 1,
      minUpdateDelaySeconds: 300,
    },
  }

  const [creatingOracle, setCreatingOracle] = useState(false)

  const isPoolReversed = async (type: 'orca' | 'raydium', poolPk: string) => {
    if (type === 'orca') {
      const context = WhirlpoolContext.from(
        connection,
        wallet as never,
        new PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'),
      )
      const whirlPoolClient = buildWhirlpoolClient(context)
      const whirlpool = await whirlPoolClient.getPool(new PublicKey(poolPk))
      return whirlpool.getTokenAInfo().mint.toBase58() == USDC_MINT || false
    }
    if (type === 'raydium') {
      const info = await connection.getAccountInfo(new PublicKey(poolPk))
      const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info!.data)
      return poolState.baseMint.toBase58() === USDC_MINT || false
    }
    return false
  }

  const create = useCallback(async () => {
    try {
      const swapValue = tierToSwapValue[tier]
      setCreatingOracle(true)
      const payer = wallet!.publicKey!
      if (!orcaPoolAddress && !raydiumPoolAddress) {
        throw poolAddressError
      }
      const poolPropertyName = orcaPoolAddress
        ? 'orcaPoolAddress'
        : 'raydiumPoolAddress'
      const poolAddress = orcaPoolAddress ? orcaPoolAddress : raydiumPoolAddress
      const isReversePool = await isPoolReversed(
        orcaPoolAddress ? 'orca' : 'raydium',
        poolAddress!,
      )

      const program = await SwitchboardProgram.load(CLUSTER, connection)

      const [[queueAccount], [crankAccount]] = await Promise.all([
        QueueAccount.load(program, SWITCHBOARD_PERMISSIONLESS_QUE),
        CrankAccount.load(program, SWITCHBOARD_PERMISSIONLESS_CRANK),
      ])

      let onFailureTaskDesc
      if (!isReversePool) {
        onFailureTaskDesc = [
          {
            lpExchangeRateTask: {
              [poolPropertyName]: poolAddress,
            },
          },
        ]
      } else {
        onFailureTaskDesc = [
          {
            valueTask: {
              big: 1,
            },
          },
          {
            divideTask: {
              job: {
                tasks: [
                  {
                    lpExchangeRateTask: {
                      [poolPropertyName]: poolAddress,
                    },
                  },
                ],
              },
            },
          },
        ]
      }

      const [aggregatorAccount, txArray1] =
        await queueAccount.createFeedInstructions(payer, {
          name: `${baseTokenName}/${quoteTokenName}`,
          batchSize: tierSettings[tier].batchSize,
          minRequiredOracleResults: tierSettings[tier].minRequiredOracleResults,
          minRequiredJobResults: 2,
          minUpdateDelaySeconds: tierSettings[tier].minUpdateDelaySeconds,
          forceReportPeriod: 60 * 60,
          withdrawAuthority: MANGO_DAO_WALLET,
          authority: payer,
          crankDataBuffer: crankAccount.dataBuffer?.publicKey,
          crankPubkey: crankAccount.publicKey,
          fundAmount: tierSettings[tier].fundAmount,
          slidingWindow: true,
          disableCrank: false,
          maxPriorityFeeMultiplier: 5,
          priorityFeeBumpPeriod: 10,
          priorityFeeBump: 1000,
          basePriorityFee: 1000,
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
                              big: swapValue,
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
                                      baseAmountString: swapValue,
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                        onFailure: onFailureTaskDesc,
                      },
                    },
                    {
                      multiplyTask: {
                        job: {
                          tasks: [
                            {
                              oracleTask: {
                                pythAddress: pythUsdOracle,
                                pythAllowedConfidenceInterval: 0.1,
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                }),
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
                                  variableName: 'QTY',
                                  job: {
                                    tasks: [
                                      {
                                        jupiterSwapTask: {
                                          inTokenAddress: USDC_MINT,
                                          outTokenAddress: baseTokenPk,
                                          baseAmountString: swapValue,
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
                              baseAmountString: '${QTY}',
                            },
                          },
                          {
                            divideTask: {
                              big: '${QTY}',
                            },
                          },
                        ],
                        onFailure: onFailureTaskDesc,
                      },
                    },
                    {
                      multiplyTask: {
                        job: {
                          tasks: [
                            {
                              oracleTask: {
                                pythAddress: pythUsdOracle,
                                pythAllowedConfidenceInterval: 0.1,
                              },
                            },
                          ],
                        },
                      },
                    },
                  ],
                }),
              ).finish(),
            },
          ],
        })

      const lockTx = aggregatorAccount.lockInstruction(payer, {})
      const transferAuthIx = aggregatorAccount.setAuthorityInstruction(payer, {
        newAuthority: MANGO_DAO_WALLET,
      })

      const txChunks = chunk([...txArray1, lockTx, transferAuthIx], 1)
      const transactions: Transaction[] = []
      const latestBlockhash = await connection.getLatestBlockhash('confirmed')
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
    orcaPoolAddress,
    raydiumPoolAddress,
    tier,
    tierToSwapValue,
    wallet,
  ])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4 pb-4">
        <p>
          {t('create-switch-oracle')} {baseTokenName}/USD
        </p>
        <p>
          {t('estimated-oracle-cost')} {tierSettings[tier].fundAmount} SOL
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
