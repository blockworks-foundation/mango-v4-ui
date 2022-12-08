import { Bank, toUiDecimals } from '@blockworks-foundation/mango-v4'
import ExplorerLink from '@components/shared/ExplorerLink'
import { coder } from '@project-serum/anchor/dist/cjs/spl/token'
import mangoStore from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import type { NextPage } from 'next'
import { useCallback, useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
    },
  }
}

const Dashboard: NextPage = () => {
  const { group } = useMangoGroup()
  // const client = mangoStore(s => s.client)

  return (
    <div className="p-8 pb-20 md:pb-16 lg:p-10">
      <h1>Dashboard</h1>
      {group ? (
        <div className="mt-4">
          <h3 className="ml-2">
            Group:{' '}
            <ExplorerLink
              address={group?.publicKey.toString()}
              anchorData
            ></ExplorerLink>
          </h3>

          <div className="mt-4 ml-4">Banks</div>
          {Array.from(group.banksMapByMint).map(([mintAddress, banks]) => {
            return (
              <div key={mintAddress} className="mt-4 ml-4">
                <div>
                  <span className="font-bold">Mint:</span>{' '}
                  <ExplorerLink address={mintAddress} />
                </div>

                {banks.map((bank) => {
                  return (
                    <div
                      key={bank.publicKey.toString()}
                      className="ml-2 mt-1 py-0.5"
                    >
                      <div>Name: {bank.name}</div>
                      <div>
                        Bank:{' '}
                        <ExplorerLink
                          address={bank.publicKey.toString()}
                          anchorData
                        ></ExplorerLink>
                      </div>
                      <div>TokenIndex: {bank.tokenIndex}</div>
                      <div>
                        Vault:{' '}
                        <ExplorerLink
                          address={bank.vault.toString()}
                          anchorData
                        ></ExplorerLink>
                      </div>
                      <div>
                        <span>Price: </span>
                        <span>{bank.price.toNumber()}</span>
                      </div>
                      <div>
                        <span>Ui Price: </span>
                        <span>{bank.uiPrice}</span>
                      </div>
                      <VaultData bank={bank} />
                      <div>
                        <span>Collected fees native: </span>
                        <span>{bank.collectedFeesNative.toString()}</span>
                      </div>
                      <div>
                        <span>Dust: </span>
                        <span>{bank.dust.toString()}</span>
                      </div>
                      <div>
                        <span>Deposits: </span>
                        <span>
                          {toUiDecimals(
                            bank.indexedDeposits
                              .mul(bank.depositIndex)
                              .toNumber(),
                            bank.mintDecimals
                          )}
                        </span>
                      </div>
                      <div>
                        <span>Borrows: </span>
                        <span>
                          {toUiDecimals(
                            bank.indexedBorrows
                              .mul(bank.borrowIndex)
                              .toNumber(),
                            bank.mintDecimals
                          )}
                        </span>
                      </div>
                      <div>
                        <span>Avg Utilization: </span>
                        <span>{bank.avgUtilization.toNumber() * 100}%</span>
                      </div>
                      <div>
                        <span>Maint Asset/Liab Weight: </span>
                        <span>
                          {bank.maintAssetWeight.toFixed(2)}/
                          {bank.maintLiabWeight.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span>Init Asset/Liab Weight: </span>
                        <span>
                          {bank.initAssetWeight.toFixed(2)}/
                          {bank.initLiabWeight.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span>Scaled Init Asset/Liab Weight:</span>
                        <span>
                          {/* {bank.scaledInitAssetWeight().toFixed(4)} */}
                          {/* {bank.scaledInitLiabWeight().toFixed(4)} */}
                        </span>
                      </div>
                      <div>
                        <span>Deposit weight scale start quote: </span>
                        <span>{bank.depositWeightScaleStartQuote}</span>
                      </div>
                      <div>
                        <span>Borrow weight scale start quote: </span>
                        <span>{bank.borrowWeightScaleStartQuote}</span>
                      </div>
                      <div>
                        <span>Rate params: </span>
                        <span>
                          {`${100 * bank.rate0.toNumber()}% @ ${
                            100 * bank.util0.toNumber()
                          }% util, `}
                          {`${100 * bank.rate1.toNumber()}% @ ${
                            100 * bank.util1.toNumber()
                          }% util, `}
                          {`${100 * bank.maxRate.toNumber()}% @ 100% util`}
                        </span>
                      </div>
                      <div>
                        <span>Deposit rate: </span>
                        <span>{bank.getDepositRateUi()}%</span>
                      </div>
                      <div>
                        <span>Borrow rate: </span>
                        <span>{bank.getBorrowRateUi()}%</span>
                      </div>
                      <div>
                        <span>Last index update: </span>
                        <span>
                          {new Date(
                            1000 * bank.indexLastUpdated.toNumber()
                          ).toUTCString()}
                        </span>
                      </div>
                      <div>
                        <span>Last rates updated: </span>
                        <span>
                          {new Date(
                            1000 * bank.bankRateLastUpdated.toNumber()
                          ).toUTCString()}
                        </span>
                      </div>
                      <div>
                        <span>Net borrows in window: </span>
                        <span>
                          {`${bank.netBorrowsInWindow.toNumber()} / ${bank.netBorrowLimitPerWindowQuote.toNumber()}`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      ) : (
        'Loading'
      )}
    </div>
  )
}

const VaultData = ({ bank }: { bank: Bank }) => {
  const [vault, setVault] = useState<any>()
  const client = mangoStore((s) => s.client)

  const getVaultData = useCallback(async () => {
    const res = await client.program.provider.connection.getAccountInfo(
      bank.vault
    )
    const v = res?.data ? coder().accounts.decode('token', res.data) : undefined

    setVault(v)
  }, [bank.vault])

  useEffect(() => {
    getVaultData()
  }, [getVaultData])

  return (
    <div>
      <span>Vault balance: </span>
      <span>
        {vault
          ? toUiDecimals(vault.amount.toNumber(), bank.mintDecimals)
          : '...'}
      </span>
    </div>
  )
}

export default Dashboard
