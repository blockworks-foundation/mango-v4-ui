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

  console.log(orders)

  const formattedTableData = useCallback(() => {
    if (!group) return []
    const formatted = []
    for (const order of orders) {
      const buyBank = group.getFirstBankByTokenIndex(order.buyTokenIndex)
      const sellBank = group.getFirstBankByTokenIndex(order.sellTokenIndex)
      const pair = `${sellBank.name}/${buyBank.name}`
      const size = floorToDecimal(
        order.getMaxSellUi(group),
        sellBank.mintDecimals,
      ).toNumber()
      const triggerPrice = order.getPriceUpperLimitUi(group)
      const pricePremium = order.getPricePremium()
      const filled = order.getSoldUi(group)
      const currentPrice = (sellBank.uiPrice / buyBank.uiPrice).toFixed(
        buyBank.mintDecimals,
      )

      const data = {
        ...order,
        buyBank,
        currentPrice,
        sellBank,
        pair,
        size,
        filled,
        triggerPrice,
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
              sortKey="pair"
              sort={() => requestSort('pair')}
              sortConfig={sortConfig}
              title={t('swap:pair')}
            />
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="size"
                sort={() => requestSort('size')}
                sortConfig={sortConfig}
                title={t('trade:size')}
              />
            </div>
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="filled"
                sort={() => requestSort('filled')}
                sortConfig={sortConfig}
                title={t('trade:filled')}
              />
            </div>
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="currentPrice"
                sort={() => requestSort('currentPrice')}
                sortConfig={sortConfig}
                title={t('trade:current-price')}
              />
            </div>
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="triggerPrice"
                sort={() => requestSort('triggerPrice')}
                sortConfig={sortConfig}
                title={t('trade:trigger-price')}
              />
            </div>
          </Th>
          <Th>
            <div className="flex justify-end">
              <SortableColumnHeader
                sortKey="fee"
                sort={() => requestSort('fee')}
                sortConfig={sortConfig}
                title={t('trade:est-slippage')}
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
            currentPrice,
            fee,
            pair,
            sellBank,
            size,
            filled,
            triggerPrice,
          } = data
          return (
            <TrBody key={i} className="text-sm">
              <Td>{pair}</Td>
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
                <p className="text-right">
                  {filled}/{size}
                  <span className="text-th-fgd-3 font-body">
                    {' '}
                    {sellBank.name}
                  </span>
                </p>
              </Td>
              <Td>
                <p className="text-right">
                  {currentPrice}
                  <span className="text-th-fgd-3 font-body">
                    {' '}
                    {buyBank.name}
                  </span>
                </p>
              </Td>
              <Td>
                <p className="text-right">
                  {triggerPrice}
                  <span className="text-th-fgd-3 font-body">
                    {' '}
                    {buyBank.name}
                  </span>
                </p>
              </Td>
              <Td>
                <p className="text-right">{fee.toFixed(2)}%</p>
              </Td>
              <Td className="flex justify-end">
                <IconButton
                  disabled={cancelId === data.id.toString()}
                  onClick={() => handleCancel(data.id)}
                  size="small"
                >
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
