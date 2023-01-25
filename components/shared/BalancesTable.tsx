import { Bank, Serum3Market } from '@blockworks-foundation/mango-v4'
import useJupiterMints from 'hooks/useJupiterMints'
import { NoSymbolIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import {
  floorToDecimal,
  formatNumericValue,
  getDecimalCount,
} from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import { LinkButton } from './Button'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useMangoGroup from 'hooks/useMangoGroup'
import AmountWithValue from './AmountWithValue'
import ConnectEmptyState from './ConnectEmptyState'
import { useWallet } from '@solana/wallet-adapter-react'
import Decimal from 'decimal.js'
import FormatNumericValue from './FormatNumericValue'

const BalancesTable = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const { connected } = useWallet()
  const showTableView = width ? width > breakpoints.md : false

  const banks = useMemo(() => {
    if (!group || !mangoAccount) return []

    const rawBanks = Array.from(group?.banksMapByName, ([key, value]) => ({
      key,
      value,
      balance: mangoAccount.getTokenBalanceUi(value[0]),
    }))
    const sortedBanks = mangoAccount
      ? rawBanks
          .sort(
            (a, b) =>
              Math.abs(b.balance * b.value[0].uiPrice) -
              Math.abs(a.balance * a.value[0].uiPrice)
          )
          .filter((c) => {
            return (
              Math.abs(
                floorToDecimal(c.balance, c.value[0].mintDecimals).toNumber()
              ) > 0 ||
              spotBalances[c.value[0].mint.toString()]?.unsettled > 0 ||
              spotBalances[c.value[0].mint.toString()]?.inOrders > 0
            )
          })
      : rawBanks

    return sortedBanks
  }, [group, mangoAccount, spotBalances])

  return banks?.length ? (
    showTableView ? (
      <Table>
        <thead>
          <TrHead>
            <Th className="bg-th-bkg-1 text-left">{t('token')}</Th>
            <Th className="bg-th-bkg-1 text-right">{t('balance')}</Th>
            <Th className="bg-th-bkg-1 text-right">{t('trade:in-orders')}</Th>
            <Th className="bg-th-bkg-1 text-right" id="trade-step-ten">
              {t('trade:unsettled')}
            </Th>
          </TrHead>
        </thead>
        <tbody>
          {banks.map(({ key, value }) => {
            const bank = value[0]

            let logoURI
            if (mangoTokens.length) {
              logoURI = mangoTokens.find(
                (t) => t.address === bank.mint.toString()
              )?.logoURI
            }

            const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0
            const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0

            return (
              <TrBody key={key} className="text-sm">
                <Td>
                  <div className="flex items-center">
                    <div className="mr-2.5 flex flex-shrink-0 items-center">
                      {logoURI ? (
                        <Image alt="" width="20" height="20" src={logoURI} />
                      ) : (
                        <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
                      )}
                    </div>
                    <span>{bank.name}</span>
                  </div>
                </Td>
                <Td className="text-right">
                  <Balance bank={bank} />
                  <p className="text-sm text-th-fgd-4">
                    <FormatNumericValue
                      value={
                        mangoAccount
                          ? mangoAccount.getTokenBalanceUi(bank) * bank.uiPrice
                          : 0
                      }
                      isUsd
                    />
                  </p>
                </Td>
                <Td className="text-right">
                  <AmountWithValue
                    amount={inOrders}
                    amountDecimals={bank.mintDecimals}
                    value={inOrders * bank.uiPrice}
                    stacked
                  />
                </Td>
                <Td className="text-right">
                  <AmountWithValue
                    amount={unsettled}
                    amountDecimals={bank.mintDecimals}
                    value={unsettled * bank.uiPrice}
                    stacked
                  />
                </Td>
              </TrBody>
            )
          })}
        </tbody>
      </Table>
    ) : (
      <>
        {banks.map(({ key, value }) => {
          const bank = value[0]

          let logoURI
          if (mangoTokens.length) {
            logoURI = mangoTokens.find(
              (t) => t.address === bank.mint.toString()
            )?.logoURI
          }

          const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0
          const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0

          return (
            <div
              className="flex items-center justify-between border-b border-th-bkg-3 p-4"
              key={key}
            >
              <div className="flex items-center">
                <div className="mr-2.5 flex flex-shrink-0 items-center">
                  {logoURI ? (
                    <Image alt="" width="20" height="20" src={logoURI} />
                  ) : (
                    <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
                  )}
                </div>
                <span>{bank.name}</span>
              </div>
              <div className="text-right">
                <div className="mb-0.5 flex justify-end space-x-1.5">
                  <Balance bank={bank} />
                  <span className="text-sm text-th-fgd-4">
                    <FormatNumericValue
                      value={
                        mangoAccount
                          ? mangoAccount.getTokenBalanceUi(bank) * bank.uiPrice
                          : 0
                      }
                      isUsd
                    />
                  </span>
                </div>
                <div className="flex space-x-2">
                  <p className="text-xs text-th-fgd-4">
                    {t('trade:in-orders')}:{' '}
                    <span className="font-mono text-th-fgd-3">
                      <FormatNumericValue
                        value={inOrders}
                        decimals={bank.mintDecimals}
                      />
                    </span>
                  </p>
                  <p className="text-xs text-th-fgd-4">
                    {t('trade:unsettled')}:{' '}
                    <span className="font-mono text-th-fgd-3">
                      <FormatNumericValue
                        value={unsettled}
                        decimals={bank.mintDecimals}
                      />
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </>
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

const Balance = ({ bank }: { bank: Bank }) => {
  const { mangoAccount } = useMangoAccount()
  const { selectedMarket } = useSelectedMarket()
  const { asPath } = useRouter()

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
          selectedMarket.serumMarketExternal
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
          minOrderDecimals
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
    [selectedMarket]
  )

  const handleSwapFormBalanceClick = useCallback(
    (balance: number) => {
      const set = mangoStore.getState().set
      if (balance >= 0) {
        set((s) => {
          s.swap.inputBank = bank
          s.swap.amountIn = balance.toString()
          s.swap.amountOut = ''
          s.swap.swapMode = 'ExactIn'
        })
      } else {
        set((s) => {
          s.swap.outputBank = bank
          s.swap.amountIn = ''
          s.swap.amountOut = Math.abs(balance).toString()
          s.swap.swapMode = 'ExactOut'
        })
      }
    },
    [bank]
  )

  const balance = useMemo(() => {
    return mangoAccount ? mangoAccount.getTokenBalanceUi(bank) : 0
  }, [bank, mangoAccount])

  const isBaseOrQuote = useMemo(() => {
    if (selectedMarket instanceof Serum3Market) {
      if (bank.tokenIndex === selectedMarket.baseTokenIndex) {
        return 'base'
      } else if (bank.tokenIndex === selectedMarket.quoteTokenIndex) {
        return 'quote'
      } else return ''
    }
  }, [bank, selectedMarket])

  console.log(bank.name, ' balance', new Decimal(balance).toFixed())
  if (!balance) return <p className="flex justify-end">0</p>

  return (
    <p className="flex justify-end">
      {asPath.includes('/trade') && isBaseOrQuote ? (
        <LinkButton
          className="font-normal underline-offset-4"
          onClick={() =>
            handleTradeFormBalanceClick(Math.abs(balance), isBaseOrQuote)
          }
        >
          <FormatNumericValue value={balance} decimals={bank.mintDecimals} />
        </LinkButton>
      ) : asPath.includes('/swap') ? (
        <LinkButton
          className="font-normal underline-offset-4"
          onClick={() =>
            handleSwapFormBalanceClick(
              Number(formatNumericValue(balance, bank.mintDecimals))
            )
          }
        >
          <FormatNumericValue value={balance} decimals={bank.mintDecimals} />
        </LinkButton>
      ) : (
        <FormatNumericValue value={balance} decimals={bank.mintDecimals} />
      )}
    </p>
  )
}
