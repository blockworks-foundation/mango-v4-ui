import Image from 'next/image'

import mangoStore from '../store/state'
import { formatDecimal, numberFormat } from '../utils/numbers'
import ContentBox from './shared/ContentBox'

const TokenList = () => {
  const mangoAccount = mangoStore((s) => s.mangoAccount)
  const group = mangoStore((s) => s.group)

  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []

  return (
    <ContentBox hideBorder hidePadding>
      <h2>Tokens</h2>
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="text-left">Asset</th>
            <th className="text-right">Deposits</th>
            <th className="text-right">APR</th>
            <th className="text-right">Borrows</th>
            <th className="text-right">APR</th>
            <th className="text-right">Your Balance</th>
          </tr>
        </thead>
        <tbody>
          {banks.map((bank) => {
            const oraclePrice = bank.value.price
            return (
              <tr key={bank.key}>
                <td>
                  <div className="flex items-center">
                    <div className="mr-2.5 flex flex-shrink-0 items-center">
                      <Image
                        alt=""
                        width="24"
                        height="24"
                        src={`/icons/${bank.value.name.toLowerCase()}.svg`}
                      />
                    </div>
                    <div className="flex flex-col">
                      <p className="font-bold">{bank.value.name}</p>
                      <p className="text-xs text-th-fgd-4">
                        ${formatDecimal(oraclePrice.toNumber(), 2)}
                      </p>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col text-right">
                    <p>
                      {formatDecimal(
                        bank.value.uiDeposits(),
                        bank.value.mintDecimals
                      )}
                    </p>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col text-right">
                    <p className="text-th-green">
                      {formatDecimal(bank.value.getDepositRate().toNumber(), 2)}
                      %
                    </p>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col text-right">
                    <p>
                      {formatDecimal(
                        bank.value.uiBorrows(),
                        bank.value.mintDecimals
                      )}
                    </p>
                  </div>
                </td>
                <td>
                  <div className="flex flex-col text-right">
                    <p className="text-th-red">
                      {formatDecimal(bank.value.getBorrowRate().toNumber(), 2)}%
                    </p>
                  </div>
                </td>
                <td className="pt-4 text-right">
                  <p className="px-2">
                    {mangoAccount
                      ? formatDecimal(mangoAccount.getUi(bank.value))
                      : '-'}
                  </p>
                  <p className="px-2 text-xs text-th-fgd-4">
                    {mangoAccount
                      ? `$${formatDecimal(
                          mangoAccount.getUi(bank.value) *
                            oraclePrice.toNumber(),
                          2
                        )}`
                      : '-'}
                  </p>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="mt-2 space-y-2 p-2"></div>
    </ContentBox>
  )
}

export default TokenList
