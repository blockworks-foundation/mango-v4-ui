import { Serum3Market } from '@blockworks-foundation/mango-v4'
import { ChevronDownIcon, NoSymbolIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { floorToDecimal, getDecimalCount } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import { LinkButton } from './Button'
import {
  SortableColumnHeader,
  Table,
  Td,
  Th,
  TrBody,
  TrHead,
} from './TableElements'
import useSelectedMarket from 'hooks/useSelectedMarket'
import ConnectEmptyState from './ConnectEmptyState'
import { useWallet } from '@solana/wallet-adapter-react'
import FormatNumericValue from './FormatNumericValue'
import BankAmountWithValue from './BankAmountWithValue'
import useBanksWithBalances, {
  BankWithBalance,
} from 'hooks/useBanksWithBalances'
import useUnownedAccount from 'hooks/useUnownedAccount'
import { Disclosure, Transition } from '@headlessui/react'
import useHealthContributions from 'hooks/useHealthContributions'
import Tooltip from './Tooltip'
import { PublicKey } from '@solana/web3.js'
import { USDC_MINT } from 'utils/constants'
import { WRAPPED_SOL_MINT } from '@project-serum/serum/lib/token-instructions'
import { useSortableData } from 'hooks/useSortableData'
import TableTokenName from './TableTokenName'

const BalancesTable = () => {
  const { t } = useTranslation(['common', 'account', 'trade'])
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const { width } = useViewport()
  const { connected } = useWallet()
  const showTableView = width ? width > breakpoints.md : false
  const banks = useBanksWithBalances('balance')
  const { initContributions } = useHealthContributions()

  const filteredBanks = useMemo(() => {
    if (banks.length && mangoAccountAddress) {
      return banks.filter((b) => {
        return (
          Math.abs(floorToDecimal(b.balance, b.bank.mintDecimals).toNumber()) >
            0 ||
          spotBalances[b.bank.mint.toString()]?.unsettled > 0 ||
          spotBalances[b.bank.mint.toString()]?.inOrders > 0
        )
      })
    }
    return []
  }, [banks, mangoAccountAddress])

  const formattedTableData = useCallback(() => {
    const formatted = []
    for (const b of filteredBanks) {
      const bank = b.bank
      const balance = b.balance
      const balanceValue = balance * bank.uiPrice
      const symbol = bank.name === 'MSOL' ? 'mSOL' : bank.name

      const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0
      const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0

      const collateralValue =
        initContributions.find((val) => val.asset === bank.name)
          ?.contribution || 0

      const assetWeight = bank.scaledInitAssetWeight(bank.price)
      const liabWeight = bank.scaledInitLiabWeight(bank.price)

      const data = {
        assetWeight,
        balance,
        balanceValue,
        bankWithBalance: b,
        collateralValue,
        inOrders,
        liabWeight,
        symbol,
        unsettled,
      }
      formatted.push(data)
    }
    return formatted
  }, [filteredBanks])

  const {
    items: tableData,
    requestSort,
    sortConfig,
  } = useSortableData(formattedTableData())

  return filteredBanks.length ? (
    showTableView ? (
      <Table>
        <thead>
          <TrHead>
            <Th className="text-left">
              <SortableColumnHeader
                sortKey="symbol"
                sort={() => requestSort('symbol')}
                sortConfig={sortConfig}
                title={t('token')}
              />
            </Th>
            <Th>
              <div className="flex justify-end">
                <SortableColumnHeader
                  sortKey="balanceValue"
                  sort={() => requestSort('balanceValue')}
                  sortConfig={sortConfig}
                  title={t('balance')}
                />
              </div>
            </Th>
            <Th>
              <div className="flex justify-end">
                <Tooltip content={t('account:tooltip-collateral-value')}>
                  <SortableColumnHeader
                    sortKey="collateralValue"
                    sort={() => requestSort('collateralValue')}
                    sortConfig={sortConfig}
                    title={t('collateral-value')}
                    titleClass="tooltip-underline"
                  />
                </Tooltip>
              </div>
            </Th>
            <Th>
              <div className="flex justify-end">
                <SortableColumnHeader
                  sortKey="inOrders"
                  sort={() => requestSort('inOrders')}
                  sortConfig={sortConfig}
                  title={t('trade:in-orders')}
                />
              </div>
            </Th>
            <Th>
              <div className="flex justify-end">
                <SortableColumnHeader
                  sortKey="unsettled"
                  sort={() => requestSort('unsettled')}
                  sortConfig={sortConfig}
                  title={t('trade:unsettled')}
                />
              </div>
            </Th>
          </TrHead>
        </thead>
        <tbody>
          {tableData.map((data) => {
            const {
              assetWeight,
              balance,
              bankWithBalance,
              collateralValue,
              inOrders,
              liabWeight,
              symbol,
              unsettled,
            } = data
            const bank = bankWithBalance.bank

            return (
              <TrBody key={bank.name} className="text-sm">
                <Td>
                  <TableTokenName bank={bank} symbol={symbol} />
                </Td>
                <Td className="text-right">
                  <Balance bank={bankWithBalance} />
                  <p className="text-sm text-th-fgd-4">
                    <FormatNumericValue
                      value={mangoAccount ? balance * bank.uiPrice : 0}
                      isUsd
                    />
                  </p>
                </Td>
                <Td className="text-right">
                  <p>
                    <FormatNumericValue
                      value={collateralValue}
                      decimals={2}
                      isUsd
                    />
                  </p>
                  <p className="text-sm text-th-fgd-4">
                    <FormatNumericValue
                      value={
                        collateralValue <= -0.01
                          ? liabWeight.toFixed(2)
                          : assetWeight.toFixed(2)
                      }
                    />
                    x
                  </p>
                </Td>
                <Td className="text-right">
                  <BankAmountWithValue amount={inOrders} bank={bank} stacked />
                </Td>
                <Td className="text-right">
                  <BankAmountWithValue amount={unsettled} bank={bank} stacked />
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
            assetWeight,
            balance,
            bankWithBalance,
            collateralValue,
            inOrders,
            liabWeight,
            symbol,
            unsettled,
          } = data
          const bank = bankWithBalance.bank

          return (
            <Disclosure key={bank.name}>
              {({ open }) => (
                <>
                  <Disclosure.Button
                    as="div"
                    className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none ${
                      i === 0 ? 'border-t-0' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <TableTokenName bank={bank} symbol={symbol} />
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <Balance bank={bankWithBalance} />
                          <span className="font-mono text-xs text-th-fgd-3">
                            <FormatNumericValue
                              value={mangoAccount ? balance * bank.uiPrice : 0}
                              isUsd
                            />
                          </span>
                        </div>
                        <ChevronDownIcon
                          className={`${
                            open ? 'rotate-180' : 'rotate-0'
                          } h-6 w-6 shrink-0 text-th-fgd-3`}
                        />
                      </div>
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
                          <Tooltip
                            content={t('account:tooltip-collateral-value')}
                          >
                            <p className="tooltip-underline text-xs text-th-fgd-3">
                              {t('collateral-value')}
                            </p>
                          </Tooltip>
                          <p className="font-mono text-th-fgd-2">
                            <FormatNumericValue
                              value={collateralValue}
                              decimals={2}
                              isUsd
                            />
                            <span className="text-th-fgd-3">
                              {' '}
                              <FormatNumericValue
                                value={
                                  collateralValue <= -0.01
                                    ? liabWeight.toFixed(2)
                                    : assetWeight.toFixed(2)
                                }
                              />
                              x
                            </span>
                          </p>
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-th-fgd-3">
                            {t('trade:in-orders')}
                          </p>
                          <BankAmountWithValue amount={inOrders} bank={bank} />
                        </div>
                        <div className="col-span-1">
                          <p className="text-xs text-th-fgd-3">
                            {t('trade:unsettled')}
                          </p>
                          <BankAmountWithValue amount={unsettled} bank={bank} />
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
      <p>{t('trade:no-balances')}</p>
    </div>
  ) : (
    <div className="p-8">
      <ConnectEmptyState text={t('connect-balances')} />
    </div>
  )
}

export default BalancesTable

const Balance = ({ bank }: { bank: BankWithBalance }) => {
  const { selectedMarket } = useSelectedMarket()
  const { asPath } = useRouter()
  const { isUnownedAccount } = useUnownedAccount()
  const { isDesktop } = useViewport()

  const tokenBank = bank.bank

  const handleTradeFormBalanceClick = useCallback(
    (balance: number, type: 'base' | 'quote') => {
      const set = mangoStore.getState().set
      const group = mangoStore.getState().group
      const tradeForm = mangoStore.getState().tradeForm

      if (!group || !selectedMarket) return

      let price: number
      if (tradeForm.tradeType === 'Market') {
        const orderbook = mangoStore.getState().selectedMarket.orderbook
        const side =
          (balance > 0 && type === 'quote') || (balance < 0 && type === 'base')
            ? 'buy'
            : 'sell'
        price = calculateLimitPriceForMarketOrder(orderbook, balance, side)
      } else {
        price = Number(tradeForm.price)
      }

      let minOrderDecimals: number
      let tickDecimals: number
      if (selectedMarket instanceof Serum3Market) {
        const market = group.getSerum3ExternalMarket(
          selectedMarket.serumMarketExternal,
        )
        minOrderDecimals = getDecimalCount(market.minOrderSize)
        tickDecimals = getDecimalCount(market.tickSize)
      } else {
        minOrderDecimals = getDecimalCount(selectedMarket.minOrderSize)
        tickDecimals = getDecimalCount(selectedMarket.tickSize)
      }

      if (type === 'quote') {
        const floorBalance = floorToDecimal(balance, tickDecimals).toNumber()
        const baseSize = floorToDecimal(
          floorBalance / price,
          minOrderDecimals,
        ).toNumber()
        const quoteSize = floorToDecimal(baseSize * price, tickDecimals)
        set((s) => {
          s.tradeForm.baseSize = baseSize.toString()
          s.tradeForm.quoteSize = quoteSize.toString()
        })
      } else {
        const baseSize = floorToDecimal(balance, minOrderDecimals).toNumber()
        const quoteSize = floorToDecimal(baseSize * price, tickDecimals)
        set((s) => {
          s.tradeForm.baseSize = baseSize.toString()
          s.tradeForm.quoteSize = quoteSize.toString()
        })
      }
    },
    [selectedMarket],
  )

  const handleSwapFormBalanceClick = useCallback(
    (balance: number) => {
      const set = mangoStore.getState().set
      const group = mangoStore.getState().group
      const swap = mangoStore.getState().swap
      const usdcBank = group?.getFirstBankByMint(new PublicKey(USDC_MINT))
      const solBank = group?.getFirstBankByMint(WRAPPED_SOL_MINT)
      if (balance >= 0) {
        set((s) => {
          s.swap.inputBank = tokenBank
          s.swap.amountIn = balance.toString()
          s.swap.amountOut = ''
          s.swap.swapMode = 'ExactIn'
          if (tokenBank.name === swap.outputBank?.name) {
            s.swap.outputBank =
              swap.outputBank.name === 'USDC' ? solBank : usdcBank
          }
          s.swap.triggerPrice = ''
        })
      } else {
        set((s) => {
          if (swap.swapOrTrigger === 'swap') {
            s.swap.outputBank = tokenBank
            s.swap.amountIn = ''
            s.swap.amountOut = Math.abs(balance).toString()
            s.swap.swapMode = 'ExactOut'
            if (tokenBank.name === swap.inputBank?.name) {
              s.swap.inputBank =
                swap.inputBank.name === 'USDC' ? solBank : usdcBank
            }
          } else {
            s.swap.inputBank = tokenBank
            s.swap.amountIn = Math.abs(balance).toString()
            s.swap.amountOut = ''
            if (tokenBank.name === swap.outputBank?.name) {
              s.swap.outputBank =
                swap.outputBank.name === 'USDC' ? solBank : usdcBank
            }
          }
        })
      }
    },
    [bank],
  )

  const balance = bank.balance

  const isBaseOrQuote = useMemo(() => {
    if (selectedMarket instanceof Serum3Market) {
      if (tokenBank.tokenIndex === selectedMarket.baseTokenIndex) {
        return 'base'
      } else if (tokenBank.tokenIndex === selectedMarket.quoteTokenIndex) {
        return 'quote'
      } else return ''
    }
  }, [tokenBank, selectedMarket])

  if (!balance) return <p className="md:flex md:justify-end">0</p>

  return (
    <p className="font-mono text-th-fgd-2 md:flex md:justify-end">
      {!isUnownedAccount && isDesktop ? (
        asPath.includes('/trade') && isBaseOrQuote ? (
          <LinkButton
            className="font-normal underline underline-offset-2 md:underline-offset-4 md:hover:no-underline"
            onClick={() =>
              handleTradeFormBalanceClick(Math.abs(balance), isBaseOrQuote)
            }
          >
            <FormatNumericValue
              value={balance}
              decimals={tokenBank.mintDecimals}
            />
          </LinkButton>
        ) : asPath.includes('/swap') ? (
          <LinkButton
            className="font-normal underline underline-offset-2 md:underline-offset-4 md:hover:no-underline"
            onClick={() =>
              handleSwapFormBalanceClick(
                Number(floorToDecimal(balance, tokenBank.mintDecimals)),
              )
            }
          >
            <FormatNumericValue
              value={balance}
              decimals={tokenBank.mintDecimals}
            />
          </LinkButton>
        ) : (
          <FormatNumericValue
            value={balance}
            decimals={tokenBank.mintDecimals}
          />
        )
      ) : (
        <FormatNumericValue value={balance} decimals={tokenBank.mintDecimals} />
      )}
    </p>
  )
}
