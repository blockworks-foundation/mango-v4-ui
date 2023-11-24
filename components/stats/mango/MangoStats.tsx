import Liquidations from './Liquidations'
import DepositsAndBorrows from './DepositsAndBorrows'
import Fees from './Fees'
import Volume from './Volume'
import OpenInterest from './OpenInterest'

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
