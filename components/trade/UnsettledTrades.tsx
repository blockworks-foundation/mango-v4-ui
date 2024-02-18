/* eslint-disable @typescript-eslint/no-explicit-any */
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { IconButton } from '@components/shared/Button'
import { notify } from 'utils/notifications'
import { CheckIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'
import Loading from '@components/shared/Loading'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import { PerpMarket } from '@blockworks-foundation/mango-v4'
import TableMarketName from './TableMarketName'
import useMangoAccount from 'hooks/useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { isMangoError } from 'types'
import { useUnsettledSpotBalances } from 'hooks/useUnsettledSpotBalances'
import useUnsettledPerpPositions from 'hooks/useUnsettledPerpPositions'

const UnsettledTrades = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { group } = useMangoGroup()
  const unsettledSpotBalances = useUnsettledSpotBalances()
  const unsettledPerpPositions = useUnsettledPerpPositions()
  const [settleMktAddress, setSettleMktAddress] = useState<string>('')
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const { mangoAccountAddress } = useMangoAccount()
  const { connected } = useWallet()
  const { isUnownedAccount } = useUnownedAccount()

  const handleSettleSerumFunds = useCallback(async (mktAddress: string) => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions

    if (!group || !mangoAccount) return
    setSettleMktAddress(mktAddress)

    try {
      const tx = await client.serum3SettleFunds(
        group,
        mangoAccount,
        new PublicKey(mktAddress),
      )
      actions.fetchOpenOrders()
      notify({
        type: 'success',
        title: 'Successfully settled funds',
        txid: tx.signature,
      })
    } catch (e) {
      if (isMangoError(e)) {
        notify({
          type: 'error',
          title: t('trade:settle-funds-error'),
          description: e?.message,
          txid: e?.txid,
        })
      }
      console.error('Settle funds error:', e)
    } finally {
      setSettleMktAddress('')
    }
  }, [])

  const handleSettlePerpFunds = useCallback(async (market: PerpMarket) => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions

    if (!group || !mangoAccount) return
    setSettleMktAddress(market.publicKey.toString())

    try {
      const perpPosition = mangoAccount.getPerpPosition(market.perpMarketIndex)
      const mangoAccountPnl = perpPosition?.getEquityUi(market)

      if (mangoAccountPnl === undefined)
        throw new Error('Unable to get account P&L')

      const allMangoAccounts = await client.getAllMangoAccounts(group, true)

      const settleCandidates = await market.getSettlePnlCandidates(
        client,
        group,
        allMangoAccounts,
        mangoAccountPnl < 0 ? 'positive' : 'negative',
        2,
      )

      const profitableAccount =
        mangoAccountPnl < 0 ? settleCandidates[0].account : mangoAccount
      const unprofitableAccount =
        mangoAccountPnl > 0 ? settleCandidates[0].account : mangoAccount

      const { signature: txid, slot } = await client.perpSettlePnlAndFees(
        group,
        profitableAccount,
        unprofitableAccount,
        mangoAccount,
        mangoAccount,
        market.perpMarketIndex,
      )
      actions.reloadMangoAccount(slot)
      notify({
        type: 'success',
        title: 'Successfully settled P&L',
        txid,
      })
    } catch (e) {
      if (isMangoError(e)) {
        notify({
          type: 'error',
          title: 'Settle P&L error',
          description: e?.message,
          txid: e?.txid,
        })
      }
      console.error('Settle P&L error:', e)
    } finally {
      setSettleMktAddress('')
    }
  }, [])

  if (!group) return null

  return mangoAccountAddress &&
    (Object.values(unsettledSpotBalances)?.length ||
      unsettledPerpPositions?.length) ? (
    showTableView ? (
      <Table>
        <thead>
          <TrHead>
            <Th className="bg-th-bkg-1 text-left">{t('market')}</Th>
            <Th className="bg-th-bkg-1 text-right">{t('trade:amount')}</Th>
            {!isUnownedAccount ? (
              <Th className="bg-th-bkg-1 text-right" />
            ) : null}
          </TrHead>
        </thead>
        <tbody>
          {Object.entries(unsettledSpotBalances).map(([mktAddress]) => {
            const market = group.getSerum3MarketByExternalMarket(
              new PublicKey(mktAddress),
            )
            const base = market?.name.split('/')[0]
            const quote = market?.name.split('/')[1]

            return (
              <TrBody key={mktAddress} className="text-sm">
                <Td>
                  <TableMarketName market={market} />
                </Td>
                <Td className="text-right font-mono">
                  <div className="flex flex-wrap justify-end">
                    {unsettledSpotBalances[mktAddress].base ? (
                      <p>
                        <FormatNumericValue
                          value={unsettledSpotBalances[mktAddress].base}
                        />{' '}
                        <span className="font-body text-th-fgd-4">{base}</span>
                      </p>
                    ) : null}
                    {unsettledSpotBalances[mktAddress].quote ? (
                      <p className="ml-3">
                        <FormatNumericValue
                          value={unsettledSpotBalances[mktAddress].quote}
                        />{' '}
                        <span className="font-body text-th-fgd-4">{quote}</span>
                      </p>
                    ) : null}
                  </div>
                </Td>
                {!isUnownedAccount ? (
                  <Td>
                    <div className="flex justify-end">
                      <Tooltip content={t('trade:settle-funds')}>
                        <IconButton
                          onClick={() => handleSettleSerumFunds(mktAddress)}
                          size="small"
                        >
                          {settleMktAddress === mktAddress ? (
                            <Loading className="h-4 w-4" />
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </div>
                  </Td>
                ) : null}
              </TrBody>
            )
          })}
          {unsettledPerpPositions.map((position) => {
            const market = group.getPerpMarketByMarketIndex(
              position.marketIndex,
            )
            return (
              <TrBody key={position.marketIndex} className="text-sm">
                <Td>
                  <TableMarketName market={market} />
                </Td>
                <Td>
                  <p className="text-right font-mono">
                    <FormatNumericValue
                      value={position.getUnsettledPnlUi(market)}
                      decimals={2}
                    />{' '}
                    <span className="font-body text-th-fgd-4">USDC</span>
                  </p>
                </Td>
                {!isUnownedAccount ? (
                  <Td>
                    <div className="flex justify-end">
                      <Tooltip content={t('trade:settle-funds')}>
                        <IconButton
                          onClick={() => handleSettlePerpFunds(market)}
                          size="small"
                        >
                          {settleMktAddress === market.publicKey.toString() ? (
                            <Loading className="h-4 w-4" />
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </div>
                  </Td>
                ) : null}
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    ) : (
      <div>
        {unsettledPerpPositions.map((position) => {
          const market = group.getPerpMarketByMarketIndex(position.marketIndex)

          return (
            <div
              key={position.marketIndex}
              className="flex items-center justify-between border-b border-th-bkg-3 p-4"
            >
              <TableMarketName market={market} />
              <div className="flex items-center space-x-3">
                <p className="font-mono text-th-fgd-1">
                  <FormatNumericValue
                    value={position.getUnsettledPnlUi(market)}
                    decimals={market.baseDecimals}
                  />{' '}
                  <span className="font-body text-th-fgd-4">USDC</span>
                </p>
                {!isUnownedAccount ? (
                  <IconButton
                    onClick={() => handleSettlePerpFunds(market)}
                    size="small"
                  >
                    {settleMktAddress === market.publicKey.toString() ? (
                      <Loading className="h-4 w-4" />
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                  </IconButton>
                ) : null}
              </div>
            </div>
          )
        })}
        {Object.entries(unsettledSpotBalances).map(([mktAddress]) => {
          const market = group.getSerum3MarketByExternalMarket(
            new PublicKey(mktAddress),
          )
          const base = market?.name.split('/')[0]
          const quote = market?.name.split('/')[1]

          return (
            <div
              key={mktAddress}
              className="flex items-center justify-between border-b border-th-bkg-3 p-4"
            >
              <TableMarketName market={market} />
              <div className="flex items-center space-x-3">
                <div>
                  {unsettledSpotBalances[mktAddress].base ? (
                    <p className="text-right font-mono text-sm text-th-fgd-1">
                      <FormatNumericValue
                        value={unsettledSpotBalances[mktAddress].base}
                      />{' '}
                      <span className="font-body text-th-fgd-4">{base}</span>
                    </p>
                  ) : null}
                  {unsettledSpotBalances[mktAddress].quote ? (
                    <p className="text-right font-mono text-sm text-th-fgd-1">
                      <FormatNumericValue
                        value={unsettledSpotBalances[mktAddress].quote}
                      />{' '}
                      <span className="font-body text-th-fgd-4">{quote}</span>
                    </p>
                  ) : null}
                </div>
                {!isUnownedAccount ? (
                  <IconButton
                    onClick={() => handleSettleSerumFunds(mktAddress)}
                    size="small"
                  >
                    {settleMktAddress === mktAddress ? (
                      <Loading className="h-4 w-4" />
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                  </IconButton>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    )
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-1 flex-col items-center justify-center">
      <div className="flex flex-col items-center p-8">
        <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
        <p>{t('trade:no-unsettled')}</p>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <ConnectEmptyState text={t('trade:connect-unsettled')} />
    </div>
  )
}

export default UnsettledTrades
