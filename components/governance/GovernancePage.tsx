import GovernancePageWrapper from './GovernancePageWrapper'
import ListToken from './ListToken/ListToken'

const GovernancePage = () => {
  return (
    <div className="py-8 px-4 pb-20 sm:px-6 md:pb-16 lg:p-10">
      <GovernancePageWrapper>
        <ListToken />
      </GovernancePageWrapper>
    </div>
  )
}
export default GovernancePage
