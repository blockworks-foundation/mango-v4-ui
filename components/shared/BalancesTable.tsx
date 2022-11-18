import { Bank, Serum3Market } from '@blockworks-foundation/mango-v4'
import useJupiterMints from 'hooks/useJupiterMints'
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import useMangoAccount from 'hooks/useMangoAccount'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import { breakpoints } from 'utils/theme'
import { calculateMarketPrice } from 'utils/tradeForm'
import { LinkButton } from './Button'

const BalancesTable = () => {
  const { t } = useTranslation(['common', 'trade'])
  const { mangoAccount } = useMangoAccount()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const group = mangoStore((s) => s.group)
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const banks = useMemo(() => {
    if (group) {
      const rawBanks = Array.from(group?.banksMapByName, ([key, value]) => ({
        key,
        value,
      }))
      const sortedBanks = mangoAccount
        ? rawBanks.sort(
            (a, b) =>
              Math.abs(
                mangoAccount?.getTokenBalanceUi(b.value[0]) *
                  b.value[0].uiPrice!
              ) -
              Math.abs(
                mangoAccount?.getTokenBalanceUi(a.value[0]) *
                  a.value[0].uiPrice!
              )
          )
        : rawBanks

      return mangoAccount
        ? sortedBanks.filter(
            (b) => mangoAccount?.getTokenBalanceUi(b.value[0]) !== 0
          )
        : sortedBanks
    }
    return []
  }, [group, mangoAccount])

  return banks?.length ? (
    showTableView ? (
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="bg-th-bkg-1 text-left">{t('token')}</th>
            <th className="bg-th-bkg-1 text-right">{t('balance')}</th>
            <th className="bg-th-bkg-1 text-right">{t('trade:in-orders')}</th>
            <th className="bg-th-bkg-1 text-right" id="trade-step-ten">
              {t('trade:unsettled')}
            </th>
          </tr>
        </thead>
        <tbody>
          {banks.map(({ key, value }) => {
            const bank = value[0]

            let logoURI
            if (mangoTokens.length) {
              logoURI = mangoTokens.find(
                (t) => t.address === bank.mint.toString()
              )!.logoURI
            }

            const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0.0
            const unsettled =
              spotBalances[bank.mint.toString()]?.unsettled || 0.0

            return (
              <tr key={key} className="text-sm">
                <td>
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
                </td>
                <td className="text-right">
                  <Balance bank={bank} />
                  <p className="text-sm text-th-fgd-4">
                    {mangoAccount
                      ? `${formatFixedDecimals(
                          mangoAccount.getTokenBalanceUi(bank) * bank.uiPrice!,
                          true
                        )}`
                      : '$0.00'}
                  </p>
                </td>
                <td className="text-right font-mono">
                  <p>{formatDecimal(inOrders)}</p>
                  <p className="text-sm text-th-fgd-4">
                    {formatFixedDecimals(inOrders * bank.uiPrice!, true)}
                  </p>
                </td>
                <td className="text-right font-mono">
                  <p>{formatDecimal(unsettled)}</p>
                  <p className="text-sm text-th-fgd-4">
                    {formatFixedDecimals(unsettled * bank.uiPrice!, true)}
                  </p>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    ) : (
      <>
        {banks.map(({ key, value }) => {
          const bank = value[0]

          let logoURI
          if (mangoTokens.length) {
            logoURI = mangoTokens.find(
              (t) => t.address === bank.mint.toString()
            )!.logoURI
          }

          const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0.0
          const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0.0

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
                <p className="mb-0.5 font-mono text-sm text-th-fgd-1">
                  {mangoAccount
                    ? formatDecimal(
                        mangoAccount.getTokenBalanceUi(bank),
                        bank.mintDecimals
                      )
                    : 0}{' '}
                  <span className="text-sm text-th-fgd-4">
                    (
                    {mangoAccount
                      ? `${formatFixedDecimals(
                          mangoAccount.getTokenBalanceUi(bank) * bank.uiPrice!,
                          true
                        )}`
                      : '$0.00'}
                    )
                  </span>
                </p>
                <div className="flex space-x-3">
                  <p className="text-xs text-th-fgd-4">
                    {t('trade:in-orders')}:{' '}
                    <span className="font-mono text-th-fgd-3">
                      {formatDecimal(inOrders)}
                    </span>
                  </p>
                  <p className="text-xs text-th-fgd-4">
                    {t('trade:unsettled')}:{' '}
                    <span className="font-mono text-th-fgd-3">
                      {formatDecimal(unsettled)}
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
  const selectedMarket = mangoStore((s) => s.selectedMarket.current)
  const { asPath } = useRouter()

  const handleBalanceClick = (balance: number, type: 'base' | 'quote') => {
    const set = mangoStore.getState().set
    const tradeForm = mangoStore.getState().tradeForm

    let price: number
    if (tradeForm.tradeType === 'Market') {
      const orderbook = mangoStore.getState().selectedMarket.orderbook
      const side =
        (balance > 0 && type === 'quote') || (balance < 0 && type === 'base')
          ? 'buy'
          : 'sell'
      price = calculateMarketPrice(orderbook, balance, side)
    } else {
      price = new Decimal(tradeForm.price).toNumber()
    }
    console.log('balance', balance)

    if (balance > 0) {
      if (type === 'quote') {
        set((s) => {
          s.tradeForm.baseSize = (balance / price).toString()
          s.tradeForm.quoteSize = balance.toString()
        })
      } else {
        set((s) => {
          s.tradeForm.baseSize = balance.toString()
          s.tradeForm.quoteSize = (balance * price).toString()
        })
      }
    } else {
      if (type === 'quote') {
        set((s) => {
          s.tradeForm.baseSize = (balance / price).toString()
          s.tradeForm.quoteSize = balance.toString()
        })
      } else {
        set((s) => {
          s.tradeForm.baseSize = balance.toString()
          s.tradeForm.quoteSize = (balance * price).toString()
        })
      }
    }
  }

  const balance = useMemo(() => {
    return mangoAccount ? mangoAccount.getTokenBalanceUi(bank) : 0
  }, [mangoAccount])

  const isBaseOrQuote = useMemo(() => {
    if (selectedMarket instanceof Serum3Market && asPath === '/trade') {
      if (bank.tokenIndex === selectedMarket.baseTokenIndex) {
        return 'base'
      } else if (bank.tokenIndex === selectedMarket.quoteTokenIndex) {
        return 'quote'
      } else return ''
    }
  }, [bank, selectedMarket])

  return (
    <p className="flex justify-end">
      {balance ? (
        isBaseOrQuote ? (
          <LinkButton
            onClick={() =>
              handleBalanceClick(
                parseFloat(formatDecimal(balance, bank.mintDecimals)),
                isBaseOrQuote
              )
            }
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
