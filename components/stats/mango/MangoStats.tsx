import MangoPerpStatsCharts from '../perps/MangoPerpStatsCharts'
import TokenStatsCharts from '../tokens/TokenStatsCharts'

const MangoStats = () => {
  return (
    <div className="grid grid-cols-2">
      <TokenStatsCharts />
      <MangoPerpStatsCharts />
    </div>
  )
}

export default MangoStats
