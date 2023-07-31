import { IconButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import { NoSymbolIcon, TrashIcon } from '@heroicons/react/20/solid'
import { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useSortableData } from 'hooks/useSortableData'
// import { useViewport } from 'hooks/useViewport'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { notify } from 'utils/notifications'
import { floorToDecimal } from 'utils/numbers'
// import { breakpoints } from 'utils/theme'
import * as sentry from '@sentry/nextjs'
import { isMangoError } from 'types'
import Loading from '@components/shared/Loading'

const SwapOrders = () => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  //   const { width } = useViewport()
  //   const showTableView = width ? width > breakpoints.md : false
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const { group } = useMangoGroup()
  const { connected } = useWallet()
  const [cancelId, setCancelId] = useState('')

  const orders = useMemo(() => {
    if (!mangoAccount) return []
    return mangoAccount.tokenConditionalSwaps.filter((tcs) => tcs.hasData)
  }, [mangoAccount])

  const formattedTableData = useCallback(() => {
    if (!group) return []
    const formatted = []
    for (const order of orders) {
      const buyBank = group.getFirstBankByTokenIndex(order.buyTokenIndex)
      const sellBank = group.getFirstBankByTokenIndex(order.sellTokenIndex)
      const market = `${sellBank.name}/${buyBank.name}`
      const size = floorToDecimal(
        order.getMaxSellUi(group),
        sellBank.mintDecimals,
      ).toNumber()
      const triggerPrice = order.getPriceLowerLimitUi(group)
      const limitPrice = order.getPriceUpperLimitUi(group)
      const pricePremium = order.getPricePremium()

      const orderType =
        limitPrice === 0
          ? 'trade:stop-market'
          : triggerPrice === limitPrice
          ? 'trade:limit'
          : 'trade:stop-limit'

      const data = {
        ...order,
        buyBank,
        sellBank,
        market,
        size,
        triggerPrice,
        limitPrice,
        orderType,
        fee: pricePremium,
      }
      formatted.push(data)
    }
    return formatted
  }, [group, orders])

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(formattedTableData())

  const handleCancel = async (id: BN) => {
    try {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      const mangoAccount = mangoStore.getState().mangoAccount.current

      if (!mangoAccount || !group) return
      setCancelId(id.toString())

      try {
        const tx = await client.tokenConditionalSwapCancel(
          group,
          mangoAccount,
          id,
        )
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx,
          noSound: true,
        })
        actions.fetchGroup()
        await actions.reloadMangoAccount()
      } catch (e) {
        console.error('failed to cancel swap order', e)
        sentry.captureException(e)
        if (isMangoError(e)) {
          notify({
            title: 'Transaction failed',
            description: e.message,
            txid: e?.txid,
            type: 'error',
          })
        }
      }
    } catch (e) {
      console.error('failed to cancel swap order', e)
    } finally {
      setCancelId('')
    }
  }

  return orders.length ? (
    <Table>
      <thead>
        <TrHead>
          <Th className="text-left">
            <SortableColumnHeader
              sortKey="market"
              sort={() => requestSort('market')}
              sortConfig={sortConfig}
              title={t('market')}
            />
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="orderType"
                sort={() => requestSort('orderType')}
                sortConfig={sortConfig}
                title={t('order-type')}
              />
            </div>
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="size"
                sort={() => requestSort('size')}
                sortConfig={sortConfig}
                title={t('size')}
              />
            </div>
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="triggerPrice"
                sort={() => requestSort('triggerPrice')}
                sortConfig={sortConfig}
                title={t('trigger-price')}
              />
            </div>
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="limitPrice"
                sort={() => requestSort('limitPrice')}
                sortConfig={sortConfig}
                title={t('limit-price')}
              />
            </div>
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="fee"
                sort={() => requestSort('fee')}
                sortConfig={sortConfig}
                title={t('fee')}
              />
            </div>
          </Th>
          <Th className="text-right">{t('cancel')}</Th>
        </TrHead>
      </thead>
      <tbody>
        {tableData.map((data, i) => {
          const {
            buyBank,
            fee,
            market,
            orderType,
            limitPrice,
            sellBank,
            size,
            triggerPrice,
          } = data
          return (
            <TrBody key={i} className="text-sm">
              <Td>{market}</Td>
              <Td>
                <p className="text-right font-body">{t(orderType)}</p>
              </Td>
              <Td>
                <p className="text-right">
                  {size}
                  <span className="text-th-fgd-3 font-body">
                    {' '}
                    {sellBank.name}
                  </span>
                </p>
              </Td>
              <Td>
                {triggerPrice !== limitPrice ? (
                  <p className="text-right">
                    {triggerPrice}
                    <span className="text-th-fgd-3 font-body">
                      {' '}
                      {buyBank.name}
                    </span>
                  </p>
                ) : (
                  <p className="text-right">–</p>
                )}
              </Td>
              <Td>
                {limitPrice ? (
                  <p className="text-right">
                    {limitPrice}
                    <span className="text-th-fgd-3 font-body">
                      {' '}
                      {buyBank.name}
                    </span>
                  </p>
                ) : (
                  <p className="text-right">–</p>
                )}
              </Td>
              <Td>
                <p className="text-right">{fee.toFixed(2)}%</p>
              </Td>
              <Td className="flex justify-end">
                <IconButton onClick={() => handleCancel(data.id)} size="small">
                  {cancelId === data.id.toString() ? (
                    <Loading />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </IconButton>
              </Td>
            </TrBody>
          )
        })}
      </tbody>
    </Table>
  ) : mangoAccountAddress || connected ? (
    <div className="flex flex-col items-center p-8">
      <NoSymbolIcon className="mb-2 h-6 w-6 text-th-fgd-4" />
      <p>{t('trade:no-orders')}</p>
    </div>
  ) : (
    <div className="p-8">
      <ConnectEmptyState text={t('connect-orders')} />
    </div>
  )
}

export default SwapOrders
