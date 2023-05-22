import dynamic from 'next/dynamic'
import GovernancePageWrapper from '../GovernancePageWrapper'

const ListMarket = dynamic(() => import('./ListMarket'))

const ListMarketPage = () => {
  return (
    <div className="p-8 pb-20 md:pb-16 lg:p-10">
      <GovernancePageWrapper>
        <ListMarket />
      </GovernancePageWrapper>
    </div>
  )
}
export default ListMarketPage
