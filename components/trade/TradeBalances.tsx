import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import mangoStore from '@store/mangoStore'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useMemo } from 'react'
import { formatDecimal } from 'utils/numbers'

const Balances = () => {
  const { t } = useTranslation(['common', 'trade'])
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const group = mangoStore((s) => s.group)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

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

  return (
    <table className="min-w-full">
      <thead>
        <tr>
          <th className="bg-th-bkg-1 text-left">{t('token')}</th>
          <th className="bg-th-bkg-1 text-right">{t('balance')}</th>
          <th className="bg-th-bkg-1 text-right">{t('trade:in-orders')}</th>
          <th className="bg-th-bkg-1 text-right">{t('trade:unsettled')}</th>
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
              <td className="pt-4 text-right font-mono">
                <div>
                  {mangoAccount
                    ? formatDecimal(
                        mangoAccount.getTokenBalanceUi(bank),
                        bank.mintDecimals
                      )
                    : 0}
                </div>
              </td>
              <td className="text-right font-mono">
                {spotBalances[bank.mint.toString()]?.inOrders || 0.0}
              </td>
              <td className="text-right font-mono">
                {spotBalances[bank.mint.toString()]?.unsettled || 0.0}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default Balances
