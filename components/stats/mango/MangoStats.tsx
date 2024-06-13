import Liquidations from './Liquidations'
import DepositsAndBorrows from './DepositsAndBorrows'
import Fees from './Fees'
import Volume from './Volume'
import OpenInterest from './OpenInterest'

interface DaysToShowSetting {
  daysToShow: string
}

interface CumulativeSetting extends DaysToShowSetting {
  showCumulative?: boolean
}

export interface ChartSettings {
  depositValue: DaysToShowSetting
  borrowValue: DaysToShowSetting
  tokenFees: CumulativeSetting
  perpFees: CumulativeSetting
  perpVolume: CumulativeSetting
  openInterest: DaysToShowSetting
}

export const DEFAULT_CHART_SETTINGS: ChartSettings = {
  depositValue: { daysToShow: '30' },
  borrowValue: { daysToShow: '30' },
  tokenFees: { daysToShow: '30', showCumulative: true },
  perpFees: { daysToShow: '30', showCumulative: true },
  perpVolume: { daysToShow: '30', showCumulative: true },
  openInterest: { daysToShow: '30' },
}

const MangoStats = () => {
  return (
    <div className="grid grid-cols-2">
      <DepositsAndBorrows />
      <Fees />
      <Volume />
      <OpenInterest />
      <Liquidations />
    </div>
  )
}

export default MangoStats
