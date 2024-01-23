import PythIcon from '@components/icons/PythIcon'
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/20/solid'
import useOracleProvider from 'hooks/useOracleProvider'

const OracleProvider = () => {
  const { oracleProvider, oracleLinkPath } = useOracleProvider()
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
