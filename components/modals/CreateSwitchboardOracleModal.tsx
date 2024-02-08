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
import {
  LISTING_PRESETS,
  LISTING_PRESETS_KEY,
} from '@blockworks-foundation/mango-v4-settings/lib/helpers/listingTools'
import { sendTxAndConfirm } from 'utils/governance/tools'
import { WRAPPED_SOL_MINT } from '@metaplex-foundation/js'

const poolAddressError = 'no-pool-address-found'
const wrongTierPassedForCreation = 'Wrong tier passed for creation of oracle'

const SWITCHBOARD_PERMISSIONLESS_QUE =
  '5JYwqvKkqp35w8Nq3ba4z1WYUeJQ1rB36V8XvaGp6zn1'
const SWITCHBOARD_PERMISSIONLESS_CRANK =
  'BKtF8yyQsj3Ft6jb2nkfpEKzARZVdGgdEPs6mFmZNmbA'
const pythSolOracle = 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG'

type BaseProps = ModalProps & {
  openbookMarketPk: string
  baseTokenPk: string
  baseTokenName: string
  tierKey: LISTING_PRESETS_KEY
  isSolPool: boolean
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
  isSolPool,
}: RaydiumProps | OrcaProps) => {
  const { t } = useTranslation(['governance'])
  const connection = mangoStore((s) => s.connection)
  const client = mangoStore((s) => s.client)
  const wallet = useWallet()
  const quoteTokenName = 'USD'
  const pythUsdOracle = 'Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD'
  const tierToSwapValue: { [key in LISTING_PRESETS_KEY]?: string } = {
    asset_100: '10000',
    asset_20: '2000',
    liab_5: '500',
    liab_1: '100',
    UNTRUSTED: '100',
  }

  const tierSettings: {
    [key in LISTING_PRESETS_KEY]?: {
      fundAmount: number
      batchSize: number
      minRequiredOracleResults: number
      minUpdateDelaySeconds: number
    }
  } = {
    asset_100: {
      fundAmount: 64,
      minRequiredOracleResults: 3,
      minUpdateDelaySeconds: 6,
      batchSize: 5,
    },
    asset_20: {
      fundAmount: 32,
      minRequiredOracleResults: 1,
      minUpdateDelaySeconds: 6,
      batchSize: 2,
    },
    liab_5: {
      fundAmount: 10,
      minRequiredOracleResults: 1,
      minUpdateDelaySeconds: 20,
      batchSize: 2,
    },
    liab_1: {
      fundAmount: 10,
      batchSize: 2,
      minRequiredOracleResults: 1,
      minUpdateDelaySeconds: 20,
    },
    UNTRUSTED: {
      fundAmount: 0.64,
      batchSize: 2,
      minRequiredOracleResults: 1,
      minUpdateDelaySeconds: 300,
    },
  }

  const [creatingOracle, setCreatingOracle] = useState(false)

  const isPoolReversed = async (
    type: 'orca' | 'raydium',
    poolPk: string,
    baseMint: string,
  ) => {
    if (type === 'orca') {
      const context = WhirlpoolContext.from(
        connection,
        wallet as never,
        new PublicKey('whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'),
      )
      const whirlPoolClient = buildWhirlpoolClient(context)
      const whirlpool = await whirlPoolClient.getPool(new PublicKey(poolPk))
      return whirlpool.getTokenAInfo().mint.toBase58() == baseMint || false
    }
    if (type === 'raydium') {
      const info = await connection.getAccountInfo(new PublicKey(poolPk))
      const poolState = LIQUIDITY_STATE_LAYOUT_V4.decode(info!.data)
      return poolState.baseMint.toBase58() === baseMint || false
    }
    return false
  }

  const create = useCallback(async () => {
    try {
      const swapValue = tierToSwapValue[tierKey]
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
        !isSolPool ? USDC_MINT : WRAPPED_SOL_MINT.toBase58(),
      )

      const program = await SwitchboardProgram.load(CLUSTER, connection)

      const [[queueAccount], [crankAccount]] = await Promise.all([
        QueueAccount.load(program, SWITCHBOARD_PERMISSIONLESS_QUE),
        CrankAccount.load(program, SWITCHBOARD_PERMISSIONLESS_CRANK),
      ])

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let onFailureTaskDesc: { [key: string]: any }[]
      if (!isReversePool) {
        onFailureTaskDesc = [
          {
            lpExchangeRateTask: {
              [poolPropertyName]: poolAddress,
            },
          },
        ]
        if (isSolPool) {
          onFailureTaskDesc.push({
            multiplyTask: {
              job: {
                tasks: [
                  {
                    oracleTask: {
                      pythAddress: pythSolOracle,
                      pythAllowedConfidenceInterval: 0.1,
                    },
                  },
                ],
              },
            },
          })
        }
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
        if (isSolPool) {
          onFailureTaskDesc.push({
            multiplyTask: {
              job: {
                tasks: [
                  {
                    oracleTask: {
                      pythAddress: pythSolOracle,
                      pythAllowedConfidenceInterval: 0.1,
                    },
                  },
                ],
              },
            },
          })
        }
      }

      const settingFromLib = tierSettings[tierKey]

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

      const latestBlockhash = await connection.getLatestBlockhash('processed')
      const txChunks = chunk([...txArray1, lockTx, transferAuthIx], 1)

      const transactions: Transaction[] = []

      for (const chunkIndex in txChunks) {
        const chunk = txChunks[chunkIndex]
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
        await sendTxAndConfirm(
          client.opts.multipleConnections,
          connection,
          tx,
          latestBlockhash,
        )
      }
      notify({
        type: 'success',
        title: 'Successfully created oracle',
      })
      window.open(
        `https://app.switchboard.xyz/solana/mainnet-beta/feed/${aggregatorAccount.publicKey.toBase58()}`,
        '_blank',
      )
      setCreatingOracle(false)
      onClose(aggregatorAccount.publicKey)
    } catch (e) {
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
    connection,
    onClose,
    orcaPoolAddress,
    raydiumPoolAddress,
    tierKey,
    tierToSwapValue,
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
          {t('estimated-oracle-cost')} {tierSettings[tierKey]?.fundAmount} SOL
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
