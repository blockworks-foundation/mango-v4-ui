import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import { useCallback, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { IconButton } from '@components/shared/Button'
import { notify } from 'utils/notifications'
import { CheckIcon, LinkIcon } from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'
import Loading from '@components/shared/Loading'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import MarketLogos from './MarketLogos'
import useMangoAccount from 'hooks/useMangoAccount'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'

const UnsettledTrades = ({
  unsettledSpotBalances,
}: {
  unsettledSpotBalances: any
}) => {
  const { t } = useTranslation(['common', 'trade'])
  const { mangoAccount } = useMangoAccount()
  const group = mangoStore((s) => s.group)
  const [settleMktAddress, setSettleMktAddress] = useState<string>('')
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const handleSettleFunds = useCallback(async (mktAddress: string) => {
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
      actions.reloadMangoAccount()
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

  if (!group) return null

  return mangoAccount ? (
    Object.values(unsettledSpotBalances).flat().length ? (
      showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="bg-th-bkg-1 text-left">{t('market')}</Th>
              <Th className="bg-th-bkg-1 text-right">{t('trade:base')}</Th>
              <Th className="bg-th-bkg-1 text-right">{t('trade:quote')}</Th>
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
                    <div className="flex items-center">
                      <MarketLogos market={market!} />
                      <span>{market ? market.name : ''}</span>
                    </div>
                  </Td>
                  <Td className="text-right font-mono">
                    {unsettledSpotBalances[mktAddress].base || 0.0}{' '}
                    <span className="font-body tracking-wide text-th-fgd-4">
                      {base}
                    </span>
                  </Td>
                  <Td className="text-right font-mono">
                    {unsettledSpotBalances[mktAddress].quote || 0.0}{' '}
                    <span className="font-body tracking-wide text-th-fgd-4">
                      {quote}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <Tooltip content={t('trade:settle-funds')}>
                        <IconButton
                          onClick={() => handleSettleFunds(mktAddress)}
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
                <div className="flex items-center">
                  <MarketLogos market={market!} />
                  <span>{market ? market.name : ''}</span>
                </div>
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
                  <IconButton onClick={() => handleSettleFunds(mktAddress)}>
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
