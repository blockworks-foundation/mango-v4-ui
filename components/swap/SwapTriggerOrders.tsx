import { IconButton, LinkButton } from '@components/shared/Button'
import ConnectEmptyState from '@components/shared/ConnectEmptyState'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from '@components/shared/TableElements'
import {
  ChevronDownIcon,
  NoSymbolIcon,
  TrashIcon,
} from '@heroicons/react/20/solid'
import { BN } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import useMangoGroup from 'hooks/useMangoGroup'
import { useSortableData } from 'hooks/useSortableData'
import { useViewport } from 'hooks/useViewport'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { notify } from 'utils/notifications'
import { floorToDecimal } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import * as sentry from '@sentry/nextjs'
import { isMangoError } from 'types'
import Loading from '@components/shared/Loading'
import SideBadge from '@components/shared/SideBadge'
import { Disclosure, Transition } from '@headlessui/react'
import SheenLoader from '@components/shared/SheenLoader'

const SwapOrders = () => {
  const { t } = useTranslation(['common', 'swap', 'trade'])
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
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
      const pair = `${sellBank.name}/${buyBank.name}`
      const maxBuy = floorToDecimal(
        order.getMaxBuyUi(group),
        buyBank.mintDecimals,
      ).toNumber()
      const maxSell = floorToDecimal(
        order.getMaxSellUi(group),
        sellBank.mintDecimals,
      ).toNumber()
      let size
      let side
      if (maxBuy === 0 || maxBuy > maxSell) {
        size = maxSell
        side = 'sell'
      } else {
        size = maxBuy
        side = 'buy'
      }

      const triggerPrice = order.getThresholdPriceUi(group)
      const pricePremium = order.getPricePremium()
      const filled = order.getSoldUi(group)
      const currentPrice = order.getCurrentPairPriceUi(group)

      const data = {
        ...order,
        buyBank,
        currentPrice,
        sellBank,
        pair,
        side,
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
        const { signature: tx, slot } = await client.tokenConditionalSwapCancel(
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
        await actions.reloadMangoAccount(slot)
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
      console.error('failed to cancel trigger order', e)
    } finally {
      setCancelId('')
    }
  }

  const handleCancelAll = async () => {
    try {
      const client = mangoStore.getState().client
      const group = mangoStore.getState().group
      const actions = mangoStore.getState().actions
      const mangoAccount = mangoStore.getState().mangoAccount.current

      if (!mangoAccount || !group) return
      setCancelId('all')

      try {
        const { signature: tx, slot } =
          await client.tokenConditionalSwapCancelAll(group, mangoAccount)
        notify({
          title: 'Transaction confirmed',
          type: 'success',
          txid: tx,
          noSound: true,
        })
        actions.fetchGroup()
        await actions.reloadMangoAccount(slot)
      } catch (e) {
        console.error('failed to cancel trigger orders', e)
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
    showTableView ? (
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
                  sortKey="side"
                  sort={() => requestSort('side')}
                  sortConfig={sortConfig}
                  title={t('trade:side')}
                />
              </div>
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
            <Th>
              <div className="flex justify-end">
                <LinkButton onClick={handleCancelAll}>
                  {t('trade:cancel-all')}
                </LinkButton>
              </div>
            </Th>
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
              side,
              size,
              filled,
              triggerPrice,
            } = data

            const bank = side === 'buy' ? buyBank : sellBank
            return (
              <TrBody key={i} className="text-sm">
                <Td>{pair}</Td>
                <Td>
                  <div className="flex justify-end">
                    <SideBadge side={side} />
                  </div>
                </Td>
                <Td>
                  <p className="text-right">
                    {size}
                    <span className="font-body text-th-fgd-3">
                      {' '}
                      {bank.name}
                    </span>
                  </p>
                </Td>
                <Td>
                  <p className="text-right">
                    {filled}/{size}
                    <span className="font-body text-th-fgd-3">
                      {' '}
                      {bank.name}
                    </span>
                  </p>
                </Td>
                <Td>
                  <p className="text-right">
                    {currentPrice}
                    <span className="font-body text-th-fgd-3">
                      {' '}
                      {buyBank.name}
                    </span>
                  </p>
                </Td>
                <Td>
                  <p className="text-right">
                    {triggerPrice}
                    <span className="font-body text-th-fgd-3">
                      {' '}
                      {side === 'buy' ? sellBank.name : buyBank.name}
                    </span>
                  </p>
                </Td>
                <Td>
                  <p className="text-right">{fee.toFixed(2)}%</p>
                </Td>
                <Td className="flex justify-end">
                  <IconButton
                    disabled={
                      cancelId === data.id.toString() || cancelId === 'all'
                    }
                    onClick={() => handleCancel(data.id)}
                    size="small"
                  >
                    {cancelId === data.id.toString() || cancelId === 'all' ? (
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
    ) : (
      <div className="border-b border-th-bkg-3">
        {tableData.map((data, i) => {
          const {
            buyBank,
            currentPrice,
            fee,
            pair,
            sellBank,
            side,
            size,
            filled,
            triggerPrice,
          } = data

          const bank = side === 'buy' ? buyBank : sellBank
          return (
            <Disclosure key={i}>
              {({ open }) => (
                <>
                  <Disclosure.Button
                    className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none ${
                      i === 0 ? 'border-t-0' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="mr-1 whitespace-nowrap">{pair}</span>
                        <SideBadge side={side} />
                        <p className="font-mono text-th-fgd-2">
                          {size}
                          <span className="font-body text-th-fgd-3">
                            {' '}
                            {bank.name}
                          </span>
                          <span className="font-body text-th-fgd-3">
                            {' at '}
                          </span>
                          {triggerPrice}
                          <span className="font-body text-th-fgd-3">
                            {' '}
                            {side === 'buy' ? sellBank.name : buyBank.name}
                          </span>
                        </p>
                      </div>
                      <ChevronDownIcon
                        className={`${
                          open ? 'rotate-180' : 'rotate-360'
                        } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                      />
                    </div>
                  </Disclosure.Button>
                  <Transition
                    enter="transition ease-in duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                  >
                    <Disclosure.Panel>
                      <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pb-4 pt-4">
                        <div className="col-span-1">
                          <p className="text-xs text-th-fgd-3">
                            {t('trade:size')}
                          </p>
                          <p className="font-mono text-th-fgd-1">
                            {size}
                            <span className="font-body text-th-fgd-3">
                              {' '}
                              {bank.name}
                            </span>
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-th-fgd-3">
                            {t('trade:filled')}
                          </p>
                          <p className="font-mono text-th-fgd-1">
                            {filled}/{size}
                            <span className="font-body text-th-fgd-3">
                              {' '}
                              {bank.name}
                            </span>
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-th-fgd-3">
                            {t('trade:current-price')}
                          </p>
                          <p className="font-mono text-th-fgd-1">
                            {currentPrice}
                            <span className="font-body text-th-fgd-3">
                              {' '}
                              {buyBank.name}
                            </span>
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-th-fgd-3">
                            {t('trade:trigger-price')}
                          </p>
                          <p className="font-mono text-th-fgd-1">
                            {triggerPrice}
                            <span className="font-body text-th-fgd-3">
                              {' '}
                              {side === 'buy' ? sellBank.name : buyBank.name}
                            </span>
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-th-fgd-3">
                            {t('trade:est-slippage')}
                          </p>
                          <p className="font-mono text-th-fgd-1">
                            {fee.toFixed(2)}%
                          </p>
                        </div>

                        <div className="col-span-1">
                          <p className="text-xs text-th-fgd-3">{t('cancel')}</p>
                          <LinkButton onClick={() => handleCancel(data.id)}>
                            {cancelId === data.id.toString() ? (
                              <SheenLoader className="mt-1">
                                <div className="h-3.5 w-20 bg-th-bkg-2" />
                              </SheenLoader>
                            ) : (
                              t('trade:cancel-order')
                            )}
                          </LinkButton>
                        </div>
                      </div>
                    </Disclosure.Panel>
                  </Transition>
                </>
              )}
            </Disclosure>
          )
        })}
      </div>
    )
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
