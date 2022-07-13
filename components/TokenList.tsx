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
    <ContentBox>
      <div className="">
        <div className="text-2xl font-bold">Tokens</div>
        <table className="mt-4 min-w-full">
          <thead>
            <tr>
              <th className="text-left text-sm">Asset</th>
              <th className="text-right text-sm">Deposits</th>
              <th className="text-right text-sm">APR</th>
              <th className="text-right text-sm">Borrows</th>
              <th className="text-right text-sm">APR</th>
              <th className="text-right text-sm">Balance</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => {
              const oraclePrice = bank.value.price
              return (
                <tr key={bank.key}>
                  <td className="pt-4">
                    <div className="flex items-center">
                      <div className="mr-4 flex min-w-[30px] items-center">
                        <Image
                          alt=""
                          width="30"
                          height="30"
                          src={`/icons/${bank.value.name.toLowerCase()}.svg`}
                        />
                      </div>
                      <div className="flex flex-col">
                        <div>{bank.value.name}</div>
                        <div className="text-sm text-th-fgd-4">
                          ${formatDecimal(oraclePrice.toNumber(), 2)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="pt-4">
                    <div className="flex flex-col text-right">
                      <div>
                        {formatDecimal(
                          bank.value.uiDeposits(),
                          bank.value.mintDecimals
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="pt-4">
                    <div className="flex flex-col text-right">
                      <div className="text-th-green">
                        {formatDecimal(
                          bank.value.getDepositRate().toNumber(),
                          2
                        )}
                        %
                      </div>
                    </div>
                  </td>
                  <td className="pt-4">
                    <div className="flex flex-col text-right">
                      <div>
                        {formatDecimal(
                          bank.value.uiBorrows(),
                          bank.value.mintDecimals
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="pt-4">
                    <div className="flex flex-col text-right">
                      <div className="text-th-red">
                        {formatDecimal(
                          bank.value.getBorrowRate().toNumber(),
                          2
                        )}
                        %
                      </div>
                    </div>
                  </td>
                  <td className="pt-4 text-right">
                    <div className="px-2">
                      {mangoAccount
                        ? formatDecimal(mangoAccount.getUi(bank.value))
                        : '-'}
                    </div>
                    <div className="px-2 text-sm text-th-fgd-4">
                      $
                      {mangoAccount
                        ? formatDecimal(
                            mangoAccount.getUi(bank.value) *
                              oraclePrice.toNumber(),
                            2
                          )
                        : '-'}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="mt-2 space-y-2 p-2"></div>
      </div>
    </ContentBox>
  )
}

export default TokenList
