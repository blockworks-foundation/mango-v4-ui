import LiquidationsCharts from './LiquidationsCharts'
import MangoPerpStatsCharts from './MangoPerpStatsCharts'
import TokenStatsCharts from './TokenStatsCharts'

const MangoStats = () => {
  return (
    <div className="grid grid-cols-2">
      <TokenStatsCharts />
      <MangoPerpStatsCharts />
      <LiquidationsCharts />
    </div>
  )
}

export default MangoStats
