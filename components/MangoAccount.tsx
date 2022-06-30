import Image from 'next/image'

import mangoStore from '../store/state'
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
              <th className="pr-12 text-left text-sm">Asset</th>
              <th className="pr-12 text-left text-sm">Price</th>
              <th className="pr-12 text-left text-sm">Deposits/Lend</th>
              <th className="pr-12 text-left text-sm">Borrows</th>
              <th className="pr-12 text-left text-sm">Balance</th>
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
                    <div className="flex flex-col">
                      <div>{bank.value.uiDeposits().toFixed(6)}</div>
                      <div className="text-green-500">
                        {bank.value.getDepositRate().toFixed(4)}%
                      </div>
                    </div>
                  </td>
                  <td className="pr-12 pt-4">
                    <div className="flex flex-col">
                      <div>{bank.value.uiBorrows().toFixed(6)}</div>
                      <div className="text-red-500">
                        {bank.value.getBorrowRate().toFixed(4)}%
                      </div>
                    </div>
                  </td>
                  <td className="pr-12 pt-4">
                    <div className="px-2">
                      {mangoAccount
                        ? mangoAccount.deposits(bank.value).toFixed(4)
                        : '-'}
                    </div>
                    <div className="px-2">
                      {mangoAccount
                        ? mangoAccount.borrows(bank.value).toFixed(4)
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
