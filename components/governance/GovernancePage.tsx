import GovernancePageWrapper from './GovernancePageWrapper'
import ListToken from './list-token/ListToken'

const GovernancePage = () => {
  return (
    <div className="p-8 pb-20 md:pb-16 lg:p-10">
      <GovernancePageWrapper>
        <ListToken />
      </GovernancePageWrapper>
    </div>
  )
}
export default GovernancePage
