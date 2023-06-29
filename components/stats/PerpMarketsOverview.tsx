import PerpMarketsOverviewTable from './PerpMarketsOverviewTable'
// import mangoStore from '@store/mangoStore'
// import { getLargestPerpPositions } from '@blockworks-foundation/mango-v4'

// const getLargestOpenPositions = async () => {
//   const client = mangoStore.getState().client
//   const group = mangoStore.getState().group
//   if (!group) return
//   const positions = await getLargestPerpPositions(client, group).then(
//     (res) => res
//   )
//   console.log(positions)
//   return positions
// }

const PerpMarketsOverview = () => {
  //   const largestPositions = async () => {
  //     const positions = await getLargestOpenPositions()
  //     return positions
  //   }

  return <PerpMarketsOverviewTable />
}

export default PerpMarketsOverview
