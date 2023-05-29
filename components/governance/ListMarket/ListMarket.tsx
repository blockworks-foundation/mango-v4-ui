import { OPENBOOK_PROGRAM_ID } from '@blockworks-foundation/mango-v4'
import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Select from '@components/forms/Select'
import CreateOpenbookMarketModal from '@components/modals/CreateOpenbookMarketModal'
import Button, { IconButton } from '@components/shared/Button'
import Loading from '@components/shared/Loading'
import { Disclosure } from '@headlessui/react'
import {
  ArrowLeftIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import GovernanceStore from '@store/governanceStore'
import mangoStore, { CLUSTER } from '@store/mangoStore'
import useMangoGroup from 'hooks/useMangoGroup'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  MANGO_DAO_WALLET,
  MANGO_DAO_WALLET_GOVERNANCE,
} from 'utils/governance/constants'
import { createProposal } from 'utils/governance/instructions/createProposal'
import { getBestMarket } from 'utils/governance/listingTools'
import { notify } from 'utils/notifications'
import ListTokenSuccess from '../ListToken/ListTokenSuccess'
import { formatTokenSymbol } from 'utils/tokens'
import OnBoarding from '../OnBoarding'
import { calculateTradingParameters } from 'utils/governance/listingTools'
import { useEnhancedWallet } from '@components/wallet/EnhancedWalletProvider'

type FormErrors = Partial<Record<keyof ListMarketForm, string>>

type ListMarketForm = {
  openBookMarketExternalPk: string
  proposalTitle: string
  proposalDescription: string
  marketIndex: number
  marketName: string
}

enum VIEWS {
  BASE_TOKEN,
  PROPS,
  SUCCESS,
}

const defaultFormValues: ListMarketForm = {
  openBookMarketExternalPk: '',
  proposalDescription: '',
  proposalTitle: '',
  marketIndex: 0,
  marketName: '',
}

const ListMarket = ({ goBack }: { goBack: () => void }) => {
  const wallet = useWallet()
  const { handleConnect } = useEnhancedWallet()
  const { t } = useTranslation(['governance'])
  const { group } = useMangoGroup()
  const connection = mangoStore((s) => s.connection)
  const client = mangoStore((s) => s.client)
  const voter = GovernanceStore((s) => s.voter)

  const vsrClient = GovernanceStore((s) => s.vsrClient)
  const proposals = GovernanceStore((s) => s.proposals)

  const [advForm, setAdvForm] = useState<ListMarketForm>({
    ...defaultFormValues,
  })
  const [proposalPk, setProposalPk] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [baseToken, setBaseToken] = useState<null | string>(null)
  const [quoteToken, setQuoteToken] = useState<null | string>(null)
  const [loadingMarketProps, setLoadingMarketProps] = useState(false)
  const [proposing, setProposing] = useState(false)
  const [marketPk, setMarketPk] = useState('')
  const [currentView, setCurrentView] = useState(VIEWS.BASE_TOKEN)
  const [createOpenbookMarketModal, setCreateOpenbookMarket] = useState(false)
  const baseBank =
    group && baseToken ? group.banksMapByName.get(baseToken) : null
  const quoteBank =
    group && quoteToken ? group.banksMapByName.get(quoteToken) : null
  const marketName = `${baseToken?.toUpperCase()}/${quoteToken?.toUpperCase()}`

  const [baseTokens, quoteTokens] = useMemo(() => {
    if (!group) return [[], []]
    const allTokens = [...group.banksMapByName.keys()].sort((a, b) =>
      a.localeCompare(b)
    )
    return [
      allTokens.filter((t) => t !== quoteToken),
      allTokens.filter((t) => t !== baseToken),
    ]
  }, [baseToken, group, quoteToken])

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
    setProposalPk('')
    setAdvForm({
      ...defaultFormValues,
    })
  }
  const handlePropose = useCallback(async () => {
    setProposing(true)
    const index = proposals ? Object.values(proposals).length : 0
    const proposalTx = []

    const registerMarketix = await client!.program.methods
      .serum3RegisterMarket(advForm.marketIndex, advForm.marketName)
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
      setProposalPk(proposalAddress.toBase58())
      setCurrentView(VIEWS.SUCCESS)
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
    client,
    connection,
    group,
    proposals,
    quoteBank,
    t,
    voter,
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

  useEffect(() => {
    const index = proposals ? Object.values(proposals).length : 0

    setAdvForm((prevForm) => ({
      ...prevForm,
      marketIndex: Number(index),
      marketName: marketName,
      proposalTitle: `List market ${marketName}`,
      openBookMarketExternalPk: marketPk,
    }))
  }, [marketName, proposals, marketPk])

  const tradingParams = useMemo(() => {
    if (baseBank && quoteBank) {
      return calculateTradingParameters(
        baseBank[0].uiPrice,
        quoteBank[0].uiPrice,
        baseBank[0].mintDecimals,
        quoteBank[0].mintDecimals
      )
    }
    return {
      baseLots: 0,
      quoteLots: 0,
      minOrderValue: 0,
      baseLotExponent: 0,
      quoteLotExponent: 0,
      minOrderSize: 0,
      priceIncrement: 0,
      priceIncrementRelative: 0,
    }
  }, [baseBank, quoteBank])

  return (
    <div>
      <div className="mb-6 flex items-center">
        <IconButton className="mr-4" onClick={goBack} size="medium">
          <ArrowLeftIcon className="h-5 w-5" />
        </IconButton>
        <h1 className="flex items-center">{t('list-spot-market')}</h1>
      </div>
      <OnBoarding />
      {proposalPk && currentView === VIEWS.SUCCESS ? (
        <ListTokenSuccess proposalPk={proposalPk} token={advForm?.marketName} />
      ) : null}
      {currentView === VIEWS.BASE_TOKEN ? (
        <div className="mb-6">
          <div className="rounded-lg border border-th-bkg-3 px-4 pt-6 pb-2">
            <h2 className="mb-3 px-2 text-base">
              {t('market-pair')}{' '}
              {baseToken && quoteToken
                ? `- ${formatTokenSymbol(baseToken)}/${formatTokenSymbol(
                    quoteToken
                  )}`
                : null}
            </h2>
            <div className="flex flex-wrap">
              <div className="w-1/2 px-2 pb-4">
                <Label text={t('base-token')} />
                <Select
                  value={baseToken}
                  onChange={(token) => setBaseToken(token)}
                  className="w-full"
                >
                  {baseTokens.map((token) => (
                    <Select.Option key={token} value={token}>
                      <div className="flex w-full items-center justify-between">
                        {token}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>
              <div className="w-1/2 px-2 pb-4">
                <Label text={t('quote-token')} />
                <Select
                  value={quoteToken}
                  onChange={(token) => setQuoteToken(token)}
                  className="w-full"
                >
                  {quoteTokens.map((token) => (
                    <Select.Option key={token} value={token}>
                      <div className="flex w-full items-center justify-between">
                        {token}
                      </div>
                    </Select.Option>
                  ))}
                </Select>
              </div>
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
      ) : null}
      {currentView === VIEWS.PROPS ? (
        <div>
          {!marketPk ? (
            <>
              <div className="rounded-lg border border-th-bkg-3 p-4 md:p-6">
                <div className="mb-2 flex items-center">
                  <ExclamationTriangleIcon className="mr-2 h-5 w-5 text-th-warning" />
                  <h2 className="text-base">
                    {t('no-openbook-found', {
                      market: `${baseToken}/${quoteToken}`,
                    })}
                  </h2>
                </div>
                <p className="mb-6">{t('no-openbook-found-desc')}</p>
                <Button onClick={openCreateOpenbookMarket}>
                  {t('create-openbook')}
                </Button>
              </div>
              {createOpenbookMarketModal ? (
                <CreateOpenbookMarketModal
                  quoteSymbol={quoteToken!}
                  baseSymbol={baseToken!}
                  isOpen={createOpenbookMarketModal}
                  onClose={closeCreateOpenBookMarketModal}
                  tradingParams={tradingParams}
                />
              ) : null}
            </>
          ) : (
            <div className="rounded-md bg-th-bkg-2 p-4">
              <h3 className="mb-2">{t('market-details')}</h3>
              <div className="flex items-center justify-between">
                <p>{t('market-name')}</p>
                <p className="text-th-fgd-2">{`${baseToken}/${quoteToken}`}</p>
              </div>
              {tradingParams.minOrderSize ? (
                <div className="mt-2 flex items-center justify-between">
                  <p>{t('min-order')}</p>
                  <p className="text-th-fgd-2">{tradingParams.minOrderSize}</p>
                </div>
              ) : null}
              {tradingParams.minOrderSize ? (
                <div className="mt-2 flex items-center justify-between">
                  <p>{t('price-tick')}</p>
                  <p className="text-th-fgd-2">
                    {tradingParams.priceIncrement}
                  </p>
                </div>
              ) : null}
            </div>
          )}
          {marketPk ? (
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
                        <Label text={t('market-name')} />
                        <Input
                          hasError={formErrors.marketName !== undefined}
                          type="text"
                          value={advForm.marketName.toString()}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleSetAdvForm('marketName', e.target.value)
                          }
                        />
                        {formErrors.marketName && (
                          <div className="mt-1.5 flex items-center space-x-1">
                            <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                            <p className="mb-0 text-xs text-th-down">
                              {formErrors.marketName}
                            </p>
                          </div>
                        )}
                      </div>
                      <div>
                        <Label text={t('market-index')} />
                        <Input
                          hasError={formErrors.marketIndex !== undefined}
                          type="text"
                          value={advForm.marketIndex.toString()}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleSetAdvForm('marketIndex', e.target.value)
                          }
                        />
                        {formErrors.marketIndex && (
                          <div className="mt-1.5 flex items-center space-x-1">
                            <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
                            <p className="mb-0 text-xs text-th-down">
                              {formErrors.marketIndex}
                            </p>
                          </div>
                        )}
                      </div>
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
          ) : null}
          <div className="mt-6">
            <Button
              className="mr-4"
              onClick={goToHomePage}
              disabled={proposing}
              secondary
              size="large"
            >
              {t('cancel')}
            </Button>
            {wallet.connected ? (
              <Button
                onClick={handlePropose}
                disabled={proposing || !marketPk}
                size="large"
              >
                {proposing ? (
                  <Loading className="w-4"></Loading>
                ) : (
                  t('propose-listing')
                )}
              </Button>
            ) : (
              <Button onClick={handleConnect} size="large">
                {t('connect-wallet')}
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ListMarket
