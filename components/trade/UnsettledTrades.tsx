import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { IconButton } from '@components/shared/Button'
import { notify } from 'utils/notifications'
import { CheckIcon, LinkIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'
import Loading from '@components/shared/Loading'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import { PerpMarket, PerpPosition } from '@blockworks-foundation/mango-v4'
import { useWallet } from '@solana/wallet-adapter-react'
import TableMarketName from './TableMarketName'

const UnsettledTrades = ({
  unsettledSpotBalances,
  unsettledPerpPositions,
}: {
  unsettledSpotBalances: any
  unsettledPerpPositions: PerpPosition[]
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { connected } = useWallet()
  const { group } = useMangoGroup()
  const [settleMktAddress, setSettleMktAddress] = useState<string>('')
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const handleSettleSerumFunds = useCallback(async (mktAddress: string) => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const actions = mangoStore.getState().actions

    if (!group || !mangoAccount) return
    setSettleMktAddress(mktAddress)

    try {
      const txid = await client.serum3SettleFunds(
        group,
        mangoAccount,
        new PublicKey(mktAddress)
      )
      actions.fetchOpenOrders()
      notify({
        type: 'success',
        title: 'Successfully settled funds',
        txid,
      })
    } catch (e: any) {
      notify({
        type: 'error',
        title: t('trade:settle-funds-error'),
        description: e?.message,
        txid: e?.txid,
      })
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
      const mangoAccounts = await client.getAllMangoAccounts(group)
      const perpPosition = mangoAccount.getPerpPosition(market.perpMarketIndex)
      const mangoAccountPnl = perpPosition?.getEquityUi(group, market)

      if (mangoAccountPnl === undefined)
        throw new Error('Unable to get account P&L')

      const sign = Math.sign(mangoAccountPnl)
      const filteredAccounts = mangoAccounts
        .map((m) => ({
          mangoAccount: m,
          pnl:
            m
              ?.getPerpPosition(market.perpMarketIndex)
              ?.getEquityUi(group, market) || 0,
        }))
        .sort((a, b) => sign * (a.pnl - b.pnl))
      console.log(
        'pnl',
        filteredAccounts.map((m) => [
          m.mangoAccount.publicKey.toString(),
          m.pnl,
        ])
      )

      const profitableAccount =
        mangoAccountPnl >= 0 ? mangoAccount : filteredAccounts[0].mangoAccount
      const unprofitableAccount =
        mangoAccountPnl < 0 ? mangoAccount : filteredAccounts[0].mangoAccount
      // const profitableAccount = mangoAccount
      // const unprofitableAccount =
      //   filteredAccounts[filteredAccounts.length - 1].mangoAccount
      // console.log('unprofitableAccount', unprofitableAccount)

      const txid = await client.perpSettlePnl(
        group,
        profitableAccount,
        unprofitableAccount,
        mangoAccount,
        market.perpMarketIndex
      )
      actions.reloadMangoAccount()
      notify({
        type: 'success',
        title: 'Successfully settled P&L',
        txid,
      })
    } catch (e: any) {
      notify({
        type: 'error',
        title: 'Settle P&L error',
        description: e?.message,
        txid: e?.txid,
      })
      console.error('Settle P&L error:', e)
    } finally {
      setSettleMktAddress('')
    }
  }, [])

  if (!group) return null

  return connected ? (
    Object.values(unsettledSpotBalances).flat().concat(unsettledPerpPositions)
      .length ? (
      showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="bg-th-bkg-1 text-left">{t('market')}</Th>
              <Th className="bg-th-bkg-1 text-right">{t('trade:amount')}</Th>
              <Th className="bg-th-bkg-1 text-right" />
            </TrHead>
          </thead>
          <tbody>
            {Object.entries(unsettledSpotBalances).map(([mktAddress]) => {
              const market = group.getSerum3MarketByExternalMarket(
                new PublicKey(mktAddress)
              )
              const base = market?.name.split('/')[0]
              const quote = market?.name.split('/')[1]

              return (
                <TrBody key={mktAddress} className="text-sm">
                  <Td>
                    <TableMarketName market={market} />
                  </Td>
                  <Td className="text-right font-mono">
                    <div className="flex justify-end">
                      {unsettledSpotBalances[mktAddress].base ? (
                        <div>
                          {unsettledSpotBalances[mktAddress].base}{' '}
                          <span className="font-body tracking-wide text-th-fgd-4">
                            {base}
                          </span>
                        </div>
                      ) : null}
                      {unsettledSpotBalances[mktAddress].quote ? (
                        <div className="ml-4">
                          {unsettledSpotBalances[mktAddress].quote}{' '}
                          <span className="font-body tracking-wide text-th-fgd-4">
                            {quote}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </Td>
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
                </TrBody>
              )
            })}
            {unsettledPerpPositions.map((position) => {
              const market = group.getPerpMarketByMarketIndex(
                position.marketIndex
              )
              return (
                <TrBody key={position.marketIndex} className="text-sm">
                  <Td>
                    <TableMarketName market={market} />
                  </Td>
                  <Td className="text-right font-mono">
                    {position.getEquityUi(group, market)}
                  </Td>
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
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <div className="pb-20">
          {Object.entries(unsettledSpotBalances).map(([mktAddress]) => {
            const market = group.getSerum3MarketByExternalMarket(
              new PublicKey(mktAddress)
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
                  {unsettledSpotBalances[mktAddress].base ? (
                    <span className="font-mono text-sm">
                      {unsettledSpotBalances[mktAddress].base}{' '}
                      <span className="font-body tracking-wide text-th-fgd-4">
                        {base}
                      </span>
                    </span>
                  ) : null}
                  {unsettledSpotBalances[mktAddress].quote ? (
                    <span className="font-mono text-sm">
                      {unsettledSpotBalances[mktAddress].quote}{' '}
                      <span className="font-body tracking-wide text-th-fgd-4">
                        {quote}
                      </span>
                    </span>
                  ) : null}
                  <IconButton
                    onClick={() => handleSettleSerumFunds(mktAddress)}
                  >
                    {settleMktAddress === mktAddress ? (
                      <Loading className="h-4 w-4" />
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                  </IconButton>
                </div>
              </div>
            )
          })}
        </div>
      )
    ) : (
      <div className="flex flex-col items-center p-8">
        <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
        <p>{t('trade:no-unsettled')}</p>
      </div>
    )
  ) : (
    <div className="flex flex-col items-center p-8">
      <LinkIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{t('trade:connect-unsettled')}</p>
    </div>
  )
}

export default UnsettledTrades
