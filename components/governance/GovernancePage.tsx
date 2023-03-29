import GovernancePageWrapper from './GovernancePageWrapper'
import ListToken from './ListToken/ListToken'

const GovernancePage = () => {
  return (
    <div className="px-6 py-4">
      <GovernancePageWrapper>
        <ListToken></ListToken>
      </GovernancePageWrapper>
    </div>
  )
}
export default GovernancePage
