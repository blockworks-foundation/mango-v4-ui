import MangoPerpStatsCharts from './MangoPerpStatsCharts'
import TotalDepositBorrowCharts from './TotalDepositBorrowCharts'

const MangoStats = () => {
  return (
    <div className="grid grid-cols-2">
      <TotalDepositBorrowCharts />
      <MangoPerpStatsCharts />
    </div>
  )
}

export default MangoStats
