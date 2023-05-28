import { OPENBOOK_PROGRAM_ID } from '@blockworks-foundation/mango-v4'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Select from '@components/forms/Select'
import CreateOpenbookMarketModal from '@components/modals/CreateOpenbookMarketModal'
import Button from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import { Disclosure } from '@headlessui/react'
import {
  ChevronDownIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import GovernanceStore from '@store/governanceStore'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useCallback, useState } from 'react'
import {
  MANGO_DAO_WALLET,
  MANGO_DAO_WALLET_GOVERNANCE,
} from 'utils/governance/constants'
import { createProposal } from 'utils/governance/instructions/createProposal'
import { getBestMarket } from 'utils/governance/listingTools'
import { notify } from 'utils/notifications'

type FormErrors = Partial<Record<keyof ListMarketForm, string>>

type ListMarketForm = {
  marketPk: string
  openBookMarketExternalPk: string
  proposalTitle: string
  proposalDescription: string
}

enum VIEWS {
  BASE_TOKEN,
  PROPS,
  SUCCESS,
}

const defaultFormValues: ListMarketForm = {
  marketPk: '',
  openBookMarketExternalPk: '',
  proposalDescription: '',
  proposalTitle: '',
}

const ListMarket = () => {
  const wallet = useWallet()
  const { t } = useTranslation(['governance'])
  const { group } = useMangoGroup()
  const connection = mangoStore((s) => s.connection)
  const availableTokens = group ? [...group.banksMapByName.keys()] : []
  const client = mangoStore((s) => s.client)
  const voter = GovernanceStore((s) => s.voter)
  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const proposals = GovernanceStore((s) => s.proposals)

  const [advForm, setAdvForm] = useState<ListMarketForm>({
    ...defaultFormValues,
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [baseToken, setBaseToken] = useState<null | string>(null)
  const [quoteToken, setQuoteToken] = useState<null | string>(null)
  const [loadingMarketProps, setLoadingMarketProps] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [currentView, setCurrentView] = useState(VIEWS.BASE_TOKEN)
  const [marketPk, setMarketPk] = useState('')
  const [createOpenbookMarketModal, setCreateOpenbookMarket] = useState(false)
  const baseBank =
    group && baseToken ? group.banksMapByName.get(baseToken) : null
  const quoteBank =
    group && quoteToken ? group.banksMapByName.get(quoteToken) : null

  const handleSetAdvForm = (propertyName: string, value: string | number) => {
    setFormErrors({})
    setAdvForm({ ...advForm, [propertyName]: value })
  }
  const openCreateOpenbookMarket = () => {
    setCreateOpenbookMarket(true)
  }
  const closeCreateOpenBookMarketModal = () => {
    setCreateOpenbookMarket(false)
    handleGetMarketProps()
  }
  const goToHomePage = async () => {
    setCurrentView(VIEWS.BASE_TOKEN)
    setMarketPk('')
    setAdvForm({
      ...defaultFormValues,
    })
  }
  const handlePropose = useCallback(async () => {
    setProposing(true)
    const index = proposals ? Object.values(proposals).length : 0

    const proposalTx = []
    const registerMarketix = await client!.program.methods
      .serum3RegisterMarket(
        Number(index),
        `${baseToken?.toUpperCase()}/${quoteToken?.toUpperCase()}`
      )
      .accounts({
        group: group!.publicKey,
        admin: MANGO_DAO_WALLET,
        serumProgram: OPENBOOK_PROGRAM_ID[CLUSTER],
        serumMarketExternal: new PublicKey(advForm.openBookMarketExternalPk),
        baseBank: baseBank![0]!.publicKey,
        quoteBank: quoteBank![0]!.publicKey,
        payer: MANGO_DAO_WALLET,
      })
      .instruction()
    proposalTx.push(registerMarketix)

    const walletSigner = wallet as never
    try {
      const proposalAddress = await createProposal(
        connection,
        walletSigner,
        MANGO_DAO_WALLET_GOVERNANCE,
        voter.tokenOwnerRecord!,
        advForm.proposalTitle,
        advForm.proposalDescription,
        index,
        proposalTx,
        vsrClient!
      )
      console.log(proposalAddress)
    } catch (e) {
      notify({
        title: t('error-proposal-creation'),
        description: `${e}`,
        type: 'error',
      })
    }
    setProposing(false)
  }, [
    advForm,
    baseBank,
    baseToken,
    client,
    connection,
    group,
    proposals,
    quoteBank,
    quoteToken,
    t,
    voter.tokenOwnerRecord,
    vsrClient,
    wallet,
  ])

  const goToPropsPage = async () => {
    await handleGetMarketProps()
    setCurrentView(VIEWS.PROPS)
  }
  const handleGetMarketProps = useCallback(async () => {
    if (!baseBank?.length || !quoteBank?.length) {
      return
    }
    setLoadingMarketProps(true)
    const [bestMarketPk] = await Promise.all([
      getBestMarket({
        baseMint: baseBank[0].mint.toBase58(),
        quoteMint: quoteBank[0].mint.toBase58(),
        cluster: CLUSTER,
        connection,
      }),
    ])
    setMarketPk(bestMarketPk?.toBase58() || '')
    setLoadingMarketProps(false)
  }, [baseBank, quoteBank, connection])

  return (
    <div className="h-full">
      <h1 className="mb-4 flex items-center">{t('new-market-listing')}</h1>
      {currentView === VIEWS.BASE_TOKEN && (
        <div className="mb-6">
          <h2 className="mb-2 text-lg">{t('before-you-list-market')}</h2>
          <ul>
            <li className="mb-2 flex items-center text-base">
              <InformationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-fgd-4" />
              <span>
                {t('before-listing-1')}{' '}
                <a
                  href="https://dao.mango.markets"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t('mango-governance')}
                </a>
              </span>
            </li>
            <li className="mb-2 flex items-center text-base">
              <InformationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-fgd-4" />
              {t('before-listing-4')}
            </li>
          </ul>
          <div>
            <div className="pb-4">
              <Label text={t('base-token')} />
              <Select
                value={baseToken}
                onChange={(token) => setBaseToken(token)}
                className="w-full"
              >
                {availableTokens
                  .filter((x) => x !== quoteToken)
                  .map((token) => (
                    <Select.Option key={token} value={token}>
                      <div className="flex w-full items-center justify-between">
                        {token}
                      </div>
                    </Select.Option>
                  ))}
              </Select>
            </div>
            <div className="pb-4">
              <Label text={t('quote-token')} />
              <Select
                value={quoteToken}
                onChange={(token) => setQuoteToken(token)}
                className="w-full"
              >
                {availableTokens
                  .filter((x) => x !== baseToken)
                  .map((token) => (
                    <Select.Option key={token} value={token}>
                      <div className="flex w-full items-center justify-between">
                        {token}
                      </div>
                    </Select.Option>
                  ))}
              </Select>
            </div>
          </div>
          <div>
            <Button
              className="float-right mt-6 flex w-36 items-center justify-center"
              onClick={goToPropsPage}
              disabled={loadingMarketProps || !quoteToken || !baseToken}
              size="large"
            >
              {loadingMarketProps ? (
                <Loading className="w-4"></Loading>
              ) : (
                t('next')
              )}
            </Button>
          </div>
        </div>
      )}
      {currentView === VIEWS.PROPS && (
        <div>
          <div>
            Openbook Market:{' '}
            {marketPk ? (
              marketPk
            ) : (
              <>
                Openbook market not found -{' '}
                <Button onClick={openCreateOpenbookMarket}>
                  Create openbook market
                </Button>
                {createOpenbookMarketModal && (
                  <CreateOpenbookMarketModal
                    quoteSymbol={quoteToken!}
                    baseSymbol={baseToken!}
                    isOpen={createOpenbookMarketModal}
                    onClose={closeCreateOpenBookMarketModal}
                  ></CreateOpenbookMarketModal>
                )}
              </>
            )}
          </div>
          <div>
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button
                    className={`mt-4 w-full rounded-md bg-th-bkg-2 p-4 md:hover:bg-th-bkg-3 ${
                      open ? 'rounded-b-none' : ''
                    }`}
                  >
                    <div
                      className={`flex items-center justify-between ${
                        Object.values(formErrors).length
                          ? 'text-th-warning'
                          : ''
                      }`}
                    >
                      {t('adv-fields')}
                      <ChevronDownIcon
                        className={`h-5 w-5 text-th-fgd-3 ${
                          open ? 'rotate-180' : 'rotate-360'
                        }`}
                      />
                    </div>
                  </Disclosure.Button>
                  <Disclosure.Panel>
                    <div className="space-y-4 rounded-md rounded-t-none bg-th-bkg-2 p-4">
                      <div>
                        <Label text={t('openbook-market-external')} />
                        <Input
                          hasError={
                            formErrors.openBookMarketExternalPk !== undefined
                          }
                          type="text"
                          value={advForm.openBookMarketExternalPk.toString()}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleSetAdvForm(
                              'openBookMarketExternalPk',
                              e.target.value
                            )
                          }
                        />
                        {formErrors.openBookMarketExternalPk && (
                          <div className="mt-1.5 flex items-center space-x-1">
                            <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                            <p className="mb-0 text-xs text-th-down">
                              {formErrors.openBookMarketExternalPk}
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label text={t('proposal-title')} />
                        <Input
                          hasError={formErrors.proposalTitle !== undefined}
                          type="text"
                          value={advForm.proposalTitle.toString()}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleSetAdvForm('proposalTitle', e.target.value)
                          }
                        />
                        {formErrors.proposalTitle && (
                          <div className="mt-1.5 flex items-center space-x-1">
                            <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                            <p className="mb-0 text-xs text-th-down">
                              {formErrors.proposalTitle}
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label text={t('proposal-des')} />
                        <Input
                          hasError={
                            formErrors.proposalDescription !== undefined
                          }
                          type="text"
                          value={advForm.proposalDescription.toString()}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleSetAdvForm(
                              'proposalDescription',
                              e.target.value
                            )
                          }
                        />
                        {formErrors.proposalDescription && (
                          <div className="mt-1.5 flex items-center space-x-1">
                            <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                            <p className="mb-0 text-xs text-th-down">
                              {formErrors.proposalDescription}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          </div>
          <div>
            <Button
              className="float-left mt-6 flex w-36 items-center justify-center"
              onClick={goToHomePage}
              disabled={proposing}
              size="large"
            >
              Back
            </Button>
            <Button
              className="float-right mt-6 flex w-36 items-center justify-center"
              onClick={handlePropose}
              disabled={proposing}
              size="large"
            >
              {proposing ? <Loading className="w-4"></Loading> : t('Propose')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListMarket
