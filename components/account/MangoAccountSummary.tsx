import mangoStore from '../../store/state'
import { toUiDecimals, HealthType } from '@blockworks-foundation/mango-v4'
import { formatDecimal } from '../../utils/numbers'

const MangoAccountSummary = () => {
  const mangoAccount = mangoStore((s) => s.mangoAccount)

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <p className="text-th-fgd-3">Account Value</p>
          <p className="font-bold text-th-fgd-1">
            $
            {mangoAccount
              ? formatDecimal(
                  toUiDecimals(mangoAccount.getEquity().toNumber()),
                  2
                )
              : (0).toFixed(2)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-th-fgd-3">Free Collateral</p>
          <p className="font-bold text-th-fgd-1">
            $
            {mangoAccount
              ? formatDecimal(
                  toUiDecimals(mangoAccount.getCollateralValue().toNumber()),
                  2
                )
              : (0).toFixed(2)}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-th-fgd-3">Health</p>
          <p className="font-bold text-th-fgd-1">
            {mangoAccount
              ? mangoAccount.getHealthRatio(HealthType.init).toNumber()
              : 100}
            %
          </p>
        </div>
      </div>
    </>
  )
}

export default MangoAccountSummary
