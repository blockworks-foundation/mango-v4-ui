import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import { useViewport } from 'hooks/useViewport'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useMemo } from 'react'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import { breakpoints } from 'utils/theme'

const SwapTradeBalances = () => {
  const { t } = useTranslation(['common', 'trade'])
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const group = mangoStore((s) => s.group)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
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
            if (jupiterTokens.length) {
              logoURI = jupiterTokens.find(
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
                  <p>
                    {mangoAccount
                      ? formatDecimal(
                          mangoAccount.getTokenBalanceUi(bank),
                          bank.mintDecimals
                        )
                      : 0}
                  </p>
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
          if (jupiterTokens.length) {
            logoURI = jupiterTokens.find(
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

export default SwapTradeBalances
