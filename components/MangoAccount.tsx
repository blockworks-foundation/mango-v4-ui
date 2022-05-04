import mangoStore from '../store/state'
import ExplorerLink from './shared/ExplorerLink'

const MangoAccount = () => {
  const mangoAccount = mangoStore((s) => s.mangoAccount)
  const group = mangoStore((s) => s.group)

  if (!mangoAccount) return null

  const activeTokens = mangoAccount
    ? mangoAccount.tokens.filter((ta) => ta.isActive())
    : []

  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []

  return (
    <div key={mangoAccount.publicKey.toString()}>
      <div
        key={mangoAccount?.publicKey.toString()}
        className="rounded border p-4"
      >
        Mango Account:{' '}
        <ExplorerLink address={mangoAccount?.publicKey.toString()} />
        {activeTokens.map((ta, idx) => {
          return (
            <div key={idx} className="mt-2 rounded border p-2">
              <div>Token Index {ta.tokenIndex}</div>
              <div>Indexed Value {ta.indexedValue.toNumber()}</div>
              <div>In Use Count {ta.inUseCount}</div>
            </div>
          )
        })}
        <div className="mt-2 space-y-2 rounded border p-2">
          {banks.map((bank) => {
            return (
              <div key={bank.key}>
                <div>
                  Deposit:{' '}
                  {mangoAccount.getNativeDeposit(bank.value).toNumber()}
                </div>
                <div>
                  Borrows: {mangoAccount.getNativeBorrow(bank.value).toNumber()}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default MangoAccount
