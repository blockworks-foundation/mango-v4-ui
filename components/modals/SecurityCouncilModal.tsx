import { useCallback, useState } from 'react'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import mangoStore from '@store/mangoStore'
import { useWallet } from '@solana/wallet-adapter-react'
import { Bank, Group } from '@blockworks-foundation/mango-v4'
import { AccountMeta, PublicKey, Transaction } from '@solana/web3.js'
import {
  MANGO_DAO_SECURITY_WALLET_GOVERNANCE,
  MANGO_GOVERNANCE_PROGRAM,
  MANGO_SECURITY_COUNCIL_MINT,
  MANGO_SECURITY_COUNCIL_WALLET,
  MANGO_SECURITY_REALM_PK,
} from 'utils/governance/constants'
import { createProposal } from 'utils/governance/instructions/createProposal'
import { notify } from 'utils/notifications'
import Button from '@components/shared/Button'
import { getAllProposals } from '@solana/spl-governance'
import useSecurityCouncilDao from 'hooks/useSecurityCouncilDao'
import Loading from '@components/shared/Loading'
import Select from '@components/forms/Select'
import { abbreviateAddress } from 'utils/formatting'

const SecurityCouncilModal = ({
  isOpen,
  onClose,
  bank,
  group,
}: ModalProps & {
  bank: Bank
  group: Group
}) => {
  const client = mangoStore((s) => s.client)
  //do not deconstruct wallet is used for anchor to sign
  const wallet = useWallet()
  const connection = mangoStore((s) => s.connection)
  const fee = mangoStore((s) => s.priorityFee)
  const { queries, currentDelegate, setDelegate, currentVoter } =
    useSecurityCouncilDao()
  const [proposing, setProposing] = useState(false)

  //2 no borrows
  //1 no borrows no deposits
  const proposeEdit = useCallback(
    async (bank: Bank, mode: number | null, initAssetWeight: number | null) => {
      if (!currentVoter) {
        notify({
          type: 'error',
          description: 'No vote record found',
          title: 'No vote record found',
        })
      }
      const mintInfo = group!.mintInfosMapByTokenIndex.get(bank.tokenIndex)!
      setProposing(true)
      const proposalTx = []

      const walletSigner = wallet as never
      const ix = await client!.program.methods
        .tokenEdit(
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          initAssetWeight,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          false,
          false,
          mode,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          null,
          false,
          false,
          null,
          null,
          null,
          null,
          null,
          null,
        )
        .accounts({
          group: group!.publicKey,
          oracle: bank.oracle,
          admin: MANGO_SECURITY_COUNCIL_WALLET,
          mintInfo: mintInfo.publicKey,
          fallbackOracle: bank.fallbackOracle,
        })
        .remainingAccounts([
          {
            pubkey: bank.publicKey,
            isWritable: true,
            isSigner: false,
          } as AccountMeta,
        ])
        .instruction()

      proposalTx.push(ix)

      try {
        setProposing(true)
        const simTransaction = new Transaction({ feePayer: wallet.publicKey })
        simTransaction.add(...proposalTx)
        const simulation = await connection.simulateTransaction(simTransaction)

        if (!simulation.value.err) {
          const proposals = await getAllProposals(
            connection,
            MANGO_GOVERNANCE_PROGRAM,
            MANGO_SECURITY_REALM_PK,
          )
          const index = proposals ? Object.values(proposals).length : 0
          const proposalAddress = await createProposal(
            connection,
            client,
            walletSigner,
            MANGO_DAO_SECURITY_WALLET_GOVERNANCE,
            currentVoter!,
            `Edit ${bank.name} token`,
            '',
            index,
            proposalTx,
            null,
            fee,
            MANGO_SECURITY_COUNCIL_MINT,
            MANGO_SECURITY_REALM_PK,
          )
          window.open(
            `https://dao.mango.markets/dao/AQbsV8b3Yv3UHUmd62hw9vFmNTHgBTdiLfaWzwmVfXB2/proposal/${proposalAddress.toBase58()}`,
            '_blank',
          )
        } else {
          throw simulation.value.logs
        }
      } catch (e) {
        console.log(e)
        notify({
          title: 'Error during proposal creation',
          description: `${e}`,
          type: 'error',
        })
      }
      setProposing(false)
    },
    [client, connection, currentVoter, fee, group, wallet],
  )

  return (
    <Modal
      panelClassNames="!max-w-[300px] min-h-[300px]"
      isOpen={isOpen}
      onClose={onClose}
    >
      <h3 className="mb-6">Token: {bank.name}</h3>
      {queries.data?.delegatedAccounts.length ? (
        <div className="flex items-start">
          <p className="mr-2">delegate</p>
          <Select
            value={
              currentDelegate
                ? abbreviateAddress(
                    new PublicKey(
                      queries.data.delegatedAccounts.find(
                        (x) => x.pubkey.toBase58() === currentDelegate,
                      )!.account.governingTokenOwner!,
                    ),
                  )
                : 'none'
            }
            onChange={(selected) => {
              setDelegate(selected)
            }}
            className="w-full"
          >
            <Select.Option value={''}>
              <div className="flex w-full items-center justify-between">
                none
              </div>
            </Select.Option>
            {queries.data.delegatedAccounts.map((x) => (
              <Select.Option
                key={x.pubkey.toBase58()}
                value={x.pubkey.toBase58()}
              >
                <div className="flex w-full items-center justify-between">
                  {abbreviateAddress(x.account.governingTokenOwner)}
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>
      ) : null}
      <div className="mt-6 space-y-3">
        <Button onClick={() => proposeEdit(bank, 1, null)} disabled={proposing}>
          {proposing ? (
            <Loading className="w-5"></Loading>
          ) : (
            'No borrows no deposits'
          )}
        </Button>
        <Button onClick={() => proposeEdit(bank, 2, null)} disabled={proposing}>
          {proposing ? <Loading className="w-5"></Loading> : 'No borrows'}
        </Button>
        <Button onClick={() => proposeEdit(bank, null, 0)} disabled={proposing}>
          {proposing ? (
            <Loading className="w-5"></Loading>
          ) : (
            '0 init asset weight'
          )}
        </Button>
      </div>
    </Modal>
  )
}

export default SecurityCouncilModal
