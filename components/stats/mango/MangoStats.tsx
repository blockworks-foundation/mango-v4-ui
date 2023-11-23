import Liquidations from './Liquidations'
import DepositsAndBorrows from './DepositsAndBorrows'
import Fees from './Fees'
import Volume from './Volume'

const MangoStats = () => {
  return (
    <>
      <DepositsAndBorrows />
      <Fees />
      <Volume />
      <Liquidations />
    </>
  )
}

export default MangoStats
