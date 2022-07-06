import Image from 'next/image'

import mangoStore from '../store/state'
import { formatDecimal } from '../utils/numbers'
import ContentBox from './shared/ContentBox'

const MangoAccount = () => {
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
              <th className="pr-12 text-sm">Asset</th>
              <th className="pr-12 text-sm">Price</th>
              <th className="pr-12 text-sm">Deposits/Lend</th>
              <th className="pr-12 text-sm">Borrows</th>
              <th className="pr-12 text-sm">Balance</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => {
              return (
                <tr key={bank.key}>
                  <td className="pr-12 pt-4">
                    <div className="flex items-center">
                      <div className="mr-4 flex min-w-[30px] items-center">
                        <Image
                          alt=""
                          width="30"
                          height="30"
                          src={`/icons/${bank.value.name.toLowerCase()}.svg`}
                        />
                      </div>
                      <div>
                        <div>{bank.value.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="pr-12 pt-4 text-right">
                    <div className="">${bank.value.price?.toFixed(2)}</div>
                  </td>
                  <td className="pr-12 pt-4">
                    <div className="flex flex-col text-right">
                      <div>
                        {formatDecimal(
                          bank.value.uiDeposits(),
                          bank.value.mintDecimals
                        )}
                      </div>
                      <div className="text-green-500">
                        {formatDecimal(
                          bank.value.getDepositRate().toNumber(),
                          2
                        )}
                        %
                      </div>
                    </div>
                  </td>
                  <td className="pr-12 pt-4">
                    <div className="flex flex-col text-right">
                      <div>
                        {formatDecimal(
                          bank.value.uiBorrows(),
                          bank.value.mintDecimals
                        )}
                      </div>
                      <div className="text-red-500">
                        {formatDecimal(
                          bank.value.getBorrowRate().toNumber(),
                          2
                        )}
                        %
                      </div>
                    </div>
                  </td>
                  <td className="pr-12 pt-4 text-right">
                    <div className="px-2">
                      {mangoAccount
                        ? formatDecimal(
                            mangoAccount.deposits(bank.value),
                            bank.value.mintDecimals
                          )
                        : '-'}
                    </div>
                    <div className="px-2">
                      {mangoAccount
                        ? formatDecimal(
                            mangoAccount.borrows(bank.value),
                            bank.value.mintDecimals
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

export default MangoAccount
