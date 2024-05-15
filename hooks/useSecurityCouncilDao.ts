import { PublicKey } from '@metaplex-foundation/js'
import {
  ProgramAccount,
  TokenOwnerRecord,
  getGovernanceAccounts,
  getTokenOwnerRecord,
  getTokenOwnerRecordAddress,
  pubkeyFilter,
} from '@solana/spl-governance'
import { useWallet } from '@solana/wallet-adapter-react'
import { Connection } from '@solana/web3.js'
import mangoStore from '@store/mangoStore'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import {
  MANGO_GOVERNANCE_PROGRAM,
  MANGO_SECURITY_COUNCIL_MINT,
  MANGO_SECURITY_REALM_PK,
} from 'utils/governance/constants'

export default function useSecurityCouncilDao() {
  const wallet = useWallet()
  const connection = mangoStore((s) => s.connection)
  const [currentDelegate, setDelegate] = useState<string>('')
  const [currentVoter, setVoter] =
    useState<ProgramAccount<TokenOwnerRecord> | null>(null)

  const query = useQuery(
    ['security-council', wallet.publicKey, connection.rpcEndpoint],
    async () => {
      const walletPk = wallet.publicKey!
      const delegatedAccounts = await fetchDelegatedAccounts(
        walletPk,
        connection,
        MANGO_GOVERNANCE_PROGRAM,
      )
      const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
        MANGO_GOVERNANCE_PROGRAM,
        MANGO_SECURITY_REALM_PK,
        MANGO_SECURITY_COUNCIL_MINT,
        walletPk,
      )
      return {
        delegatedAccounts: delegatedAccounts.filter((x) =>
          x.account.realm.equals(MANGO_SECURITY_REALM_PK),
        ),
        tokenOwnerRecordPk,
      }
    },
    {
      cacheTime: 1000 * 60 * 10,
      staleTime: 1000 * 60,
      retry: 2,
      refetchOnWindowFocus: false,
      enabled: !!wallet.publicKey,
    },
  )
  useEffect(() => {
    const updateVoter = async () => {
      setDelegate(currentDelegate)
      try {
        const tokenOwnerRecord = await getTokenOwnerRecord(
          connection,
          currentDelegate
            ? new PublicKey(currentDelegate)
            : query.data!.tokenOwnerRecordPk,
        )
        setVoter(tokenOwnerRecord)
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    if (query.data?.tokenOwnerRecordPk || currentDelegate) {
      updateVoter()
    }
  }, [query.data?.tokenOwnerRecordPk, currentDelegate])
  return {
    currentDelegate,
    currentVoter,
    setDelegate,
    queries: query,
  }
}

const fetchDelegatedAccounts = async (
  wallet: PublicKey,
  connection: Connection,
  programId: PublicKey,
) => {
  const governanceDelegateOffset = 122

  const accounts = await getGovernanceAccounts(
    connection,
    programId,
    TokenOwnerRecord,
    [pubkeyFilter(governanceDelegateOffset, wallet)!],
  )
  return accounts
}
