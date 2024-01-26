import { Bank } from '@blockworks-foundation/mango-v4'
import PythIcon from '@components/icons/PythIcon'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import useOracleProvider from 'hooks/useOracleProvider'

//will use selected market from mango store if no bank provided
const OracleProvider = ({ bank }: { bank?: Bank }) => {
  const { oracleProvider, oracleLinkPath } = useOracleProvider(bank)
  return oracleLinkPath ? (
    <a
      className="flex items-center"
      href={oracleLinkPath}
      target="_blank"
      rel="noopener noreferrer"
    >
      {oracleProvider === 'Pyth' ? (
        <PythIcon className="mr-1.5 h-4 w-4" />
      ) : null}
      <span className="mr-1.5">{oracleProvider}</span>
      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
    </a>
  ) : (
    <p className="text-th-fgd-2">{oracleProvider}</p>
  )
}

export default OracleProvider
