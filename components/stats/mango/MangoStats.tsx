import MangoPerpStatsCharts from './MangoPerpStatsCharts'
import TokenStatsCharts from './TokenStatsCharts'

const MangoStats = () => {
  return (
    <div className="grid grid-cols-2">
      <TokenStatsCharts />
      <MangoPerpStatsCharts />
    </div>
  )
}

export default MangoStats
