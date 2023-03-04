import { Serum3Market } from '@blockworks-foundation/mango-v4'
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
import ConnectEmptyState from './ConnectEmptyState'
import { useWallet } from '@solana/wallet-adapter-react'
import FormatNumericValue from './FormatNumericValue'
import BankAmountWithValue from './BankAmountWithValue'
import useBanksWithBalances, {
  BankWithBalance,
} from 'hooks/useBanksWithBalances'
import useUnownedAccount from 'hooks/useUnownedAccount'

const BalancesTable = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const { connected } = useWallet()
  const showTableView = width ? width > breakpoints.md : false
  const banks = useBanksWithBalances('balance')

  const filteredBanks = useMemo(() => {
    if (banks.length) {
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
  }, [banks])

  return filteredBanks.length ? (
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
          {filteredBanks.map((b) => {
            const bank = b.bank

            let logoURI
            if (mangoTokens.length) {
              logoURI = mangoTokens.find(
                (t) => t.address === bank.mint.toString()
              )?.logoURI
            }

            const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0
            const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0

            return (
              <TrBody key={bank.name} className="text-sm">
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
                  <Balance bank={b} />
                  <p className="text-sm text-th-fgd-4">
                    <FormatNumericValue
                      value={mangoAccount ? b.balance * bank.uiPrice : 0}
                      isUsd
                    />
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
      <>
        {filteredBanks.map((b) => {
          const bank = b.bank

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
              key={bank.name}
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
                  <Balance bank={b} />
                  <span className="text-sm text-th-fgd-4">
                    <FormatNumericValue
                      value={mangoAccount ? b.balance * bank.uiPrice : 0}
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

const Balance = ({ bank }: { bank: BankWithBalance }) => {
  const { selectedMarket } = useSelectedMarket()
  const { asPath } = useRouter()
  const { isUnownedAccount } = useUnownedAccount()

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
          s.swap.inputBank = tokenBank
          s.swap.amountIn = balance.toString()
          s.swap.amountOut = ''
          s.swap.swapMode = 'ExactIn'
        })
      } else {
        set((s) => {
          s.swap.outputBank = tokenBank
          s.swap.amountIn = ''
          s.swap.amountOut = Math.abs(balance).toString()
          s.swap.swapMode = 'ExactOut'
        })
      }
    },
    [bank]
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

  if (!balance) return <p className="flex justify-end">0</p>

  return (
    <p className="flex justify-end">
      {!isUnownedAccount ? (
        asPath.includes('/trade') && isBaseOrQuote ? (
          <LinkButton
            className="font-normal underline-offset-4"
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
            className="font-normal underline-offset-4"
            onClick={() =>
              handleSwapFormBalanceClick(
                Number(formatNumericValue(balance, tokenBank.mintDecimals))
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
