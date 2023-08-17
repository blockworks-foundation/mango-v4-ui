import dynamic from 'next/dynamic'
import GovernancePageWrapper from '../GovernancePageWrapper'

const Vote = dynamic(() => import('./Vote'))

const VotePage = () => {
  return (
    <div className="px-4 py-8 pb-20 sm:px-6 md:pb-16 lg:p-10">
      <GovernancePageWrapper>
        <Vote />
      </GovernancePageWrapper>
    </div>
  )
}
export default VotePage
