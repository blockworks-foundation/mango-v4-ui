import { Bank, Serum3Market } from '@blockworks-foundation/mango-v4'
import useJupiterMints from 'hooks/useJupiterMints'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import useMangoAccount from 'hooks/useMangoAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import {
  floorToDecimal,
  formatDecimal,
  formatFixedDecimals,
  getDecimalCount,
  trimDecimals,
} from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { calculateLimitPriceForMarketOrder } from 'utils/tradeForm'
import { LinkButton } from './Button'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import useSelectedMarket from 'hooks/useSelectedMarket'
import useMangoGroup from 'hooks/useMangoGroup'
import useCurrencyConversion from 'hooks/useCurrencyConversion'

const BalancesTable = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { mangoAccount } = useMangoAccount()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const currencyConversionPrice = useCurrencyConversion()

  const banks = useMemo(() => {
    if (!group) return []

    const rawBanks = Array.from(group?.banksMapByName, ([key, value]) => ({
      key,
      value,
      balance: mangoAccount?.getTokenBalanceUi(value[0]),
    }))
    const sortedBanks = mangoAccount
      ? rawBanks
          .sort(
            (a, b) =>
              Math.abs(b.balance! * b.value[0].uiPrice) -
              Math.abs(a.balance! * a.value[0].uiPrice)
          )
          .filter(
            (c) =>
              Math.abs(
                floorToDecimal(c.balance!, c.value[0].mintDecimals).toNumber()
              ) > 0
          )
      : rawBanks

    return sortedBanks
  }, [group, mangoAccount])

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
                    {mangoAccount
                      ? `${formatFixedDecimals(
                          (mangoAccount.getTokenBalanceUi(bank) *
                            bank.uiPrice) /
                            currencyConversionPrice,
                          true
                        )}`
                      : formatFixedDecimals(0, true)}
                  </p>
                </Td>
                <Td className="text-right font-mono">
                  <p>{inOrders}</p>
                  <p className="text-sm text-th-fgd-4">
                    {formatFixedDecimals(
                      (inOrders * bank.uiPrice) / currencyConversionPrice,
                      true
                    )}
                  </p>
                </Td>
                <Td className="text-right font-mono">
                  <p>{unsettled ? unsettled.toFixed(bank.mintDecimals) : 0}</p>
                  <p className="text-sm text-th-fgd-4">
                    {formatFixedDecimals(
                      (unsettled * bank.uiPrice) / currencyConversionPrice,
                      true
                    )}
                  </p>
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
                    (
                    {mangoAccount
                      ? `${formatFixedDecimals(
                          (mangoAccount.getTokenBalanceUi(bank) *
                            bank.uiPrice) /
                            currencyConversionPrice,
                          true
                        )}`
                      : formatFixedDecimals(0, true)}
                    )
                  </span>
                </div>
                <div className="flex space-x-2">
                  <p className="text-xs text-th-fgd-4">
                    {t('trade:in-orders')}:{' '}
                    <span className="font-mono text-th-fgd-3">{inOrders}</span>
                  </p>
                  <p className="text-xs text-th-fgd-4">
                    {t('trade:unsettled')}:{' '}
                    <span className="font-mono text-th-fgd-3">
                      {unsettled ? unsettled.toFixed(bank.mintDecimals) : 0}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </>
    )
  ) : (
    <div className="flex flex-col items-center p-8">
      <p>{t('trade:no-balances')}</p>
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
      let tickSize: number
      if (selectedMarket instanceof Serum3Market) {
        const market = group.getSerum3ExternalMarket(
          selectedMarket.serumMarketExternal
        )
        minOrderDecimals = getDecimalCount(market.minOrderSize)
        tickSize = getDecimalCount(market.tickSize)
      } else {
        minOrderDecimals = getDecimalCount(selectedMarket.minOrderSize)
        tickSize = getDecimalCount(selectedMarket.tickSize)
      }

      if (type === 'quote') {
        const trimmedBalance = trimDecimals(balance, tickSize)
        const baseSize = trimDecimals(trimmedBalance / price, minOrderDecimals)
        const quoteSize = trimDecimals(baseSize * price, tickSize)
        set((s) => {
          s.tradeForm.baseSize = baseSize.toString()
          s.tradeForm.quoteSize = quoteSize.toString()
        })
      } else {
        const baseSize = trimDecimals(balance, minOrderDecimals)
        const quoteSize = trimDecimals(baseSize * price, tickSize)
        set((s) => {
          s.tradeForm.baseSize = baseSize.toString()
          s.tradeForm.quoteSize = quoteSize.toString()
        })
      }
    },
    [selectedMarket]
  )

  const handleSwapFormBalanceClick = useCallback((balance: number) => {
    const set = mangoStore.getState().set
    if (balance >= 0) {
      set((s) => {
        s.swap.inputBank = bank
        s.swap.amountIn = balance.toString()
        s.swap.swapMode = 'ExactIn'
      })
    } else {
      console.log('else')

      set((s) => {
        s.swap.outputBank = bank
        s.swap.amountOut = Math.abs(balance).toString()
        s.swap.swapMode = 'ExactOut'
      })
    }
  }, [])

  const balance = useMemo(() => {
    return mangoAccount ? mangoAccount.getTokenBalanceUi(bank) : 0
  }, [bank, mangoAccount])

  const isBaseOrQuote = useMemo(() => {
    if (
      selectedMarket instanceof Serum3Market &&
      (asPath.includes('/trade') || asPath.includes('/swap'))
    ) {
      if (bank.tokenIndex === selectedMarket.baseTokenIndex) {
        return 'base'
      } else if (bank.tokenIndex === selectedMarket.quoteTokenIndex) {
        return 'quote'
      } else return ''
    }
  }, [bank, selectedMarket])

  const handleClick = (balance: number, type: 'base' | 'quote') => {
    if (asPath.includes('/trade')) {
      handleTradeFormBalanceClick(
        parseFloat(formatDecimal(balance, bank.mintDecimals)),
        type
      )
    } else {
      handleSwapFormBalanceClick(
        parseFloat(formatDecimal(balance, bank.mintDecimals))
      )
    }
  }

  return (
    <p className="flex justify-end">
      {balance ? (
        isBaseOrQuote ? (
          <LinkButton
            className="font-normal underline-offset-4"
            onClick={() => handleClick(balance, isBaseOrQuote)}
          >
            {formatDecimal(balance, bank.mintDecimals)}
          </LinkButton>
        ) : (
          formatDecimal(balance, bank.mintDecimals)
        )
      ) : (
        0
      )}
    </p>
  )
}
