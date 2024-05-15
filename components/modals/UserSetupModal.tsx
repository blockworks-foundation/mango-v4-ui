import { Transition } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  PencilIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import useMangoAccount from 'hooks/useMangoAccount'
import useSolBalance from 'hooks/useSolBalance'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import {
  ChangeEvent,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createSolanaMessage, notify } from 'utils/notifications'
import ActionTokenList from '../account/ActionTokenList'
import ButtonGroup from '../forms/ButtonGroup'
import Input from '../forms/Input'
import Label from '../forms/Label'
// import ParticlesBackground from '../ParticlesBackground'
// import EditNftProfilePic from '../profile/EditNftProfilePic'
// import EditProfileForm from '../profile/EditProfileForm'
import Button, { LinkButton } from '../shared/Button'
import Loading from '../shared/Loading'
import MaxAmountButton from '../shared/MaxAmountButton'
import SolBalanceWarnings from '../shared/SolBalanceWarnings'
import Modal from '../shared/Modal'
import NumberFormat from 'react-number-format'
import { withValueLimit } from '@components/swap/MarketSwapForm'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import { isMangoError } from 'types'
import ColorBlur from '@components/ColorBlur'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ACCEPT_TERMS_KEY, MAX_ACCOUNTS } from 'utils/constants'
import { ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES } from '@components/BorrowForm'
import { WalletReadyState } from '@solana/wallet-adapter-base'
import Switch from '@components/forms/Switch'
import NotificationCookieStore from '@store/notificationCookieStore'
import { usePlausible } from 'next-plausible'
import { TelemetryEvents } from 'utils/telemetry'
import { waitForSlot } from 'utils/network'
import Checkbox from '@components/forms/Checkbox'
import { handleInputChange } from 'utils/account'
import BounceLoader from '@components/shared/BounceLoader'

const UserSetupModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useTranslation(['common', 'onboarding', 'swap'])
  const { connected, select, wallet, wallets, publicKey, connect } = useWallet()
  const { mangoAccountAddress, initialLoad: mangoAccountLoading } =
    useMangoAccount()
  const telemetry = usePlausible<TelemetryEvents>()
  const [accountName, setAccountName] = useState('')
  const [loadingNewAccount, setLoadingNewAccount] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showSetupStep, setShowSetupStep] = useState(0)
  const [depositToken, setDepositToken] = useState('USDC')
  const [depositAmount, setDepositAmount] = useState('')
  const [submitDeposit, setSubmitDeposit] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const [signToNotifications, setSignToNotifications] = useState(true)
  // const [showEditProfilePic, setShowEditProfilePic] = useState(false)
  const { maxSolDeposit } = useSolBalance()
  const banks = useBanksWithBalances('walletBalance')
  const [, setAcceptTerms] = useLocalStorageState(ACCEPT_TERMS_KEY, '')
  const [walletsToDisplay, setWalletstoDisplay] = useState<'default' | 'all'>(
    'default',
  )
  //used to sign txes
  const walletContext = useWallet()
  const setCookie = NotificationCookieStore((s) => s.setCookie)

  const walletsDisplayed = useMemo(() => {
    const firstFive = wallets.slice(0, 5)
    const detectedWallets = wallets.filter(
      (w) =>
        w.readyState === WalletReadyState.Installed ||
        w.readyState === WalletReadyState.Loadable,
    )

    if (walletsToDisplay === 'default') {
      return detectedWallets.length > firstFive.length
        ? detectedWallets
        : firstFive
    } else {
      return wallets
    }
  }, [walletsToDisplay, wallets])

  // close onboarding if an account already exists after connecting
  useEffect(() => {
    if (connected && mangoAccountAddress && showSetupStep === 1) {
      onClose()
    }
  }, [connected, mangoAccountAddress, showSetupStep])

  // move to create account after connecting wallet
  useEffect(() => {
    if (connected && !mangoAccountAddress && !mangoAccountLoading) {
      setShowSetupStep(2)
    }
  }, [connected, mangoAccountAddress, mangoAccountLoading])

  // move to fund account after creating an account
  useEffect(() => {
    if (mangoAccountAddress && showSetupStep === 2) {
      setShowSetupStep(3)
    }
  }, [mangoAccountAddress, showSetupStep])

  const handleCreateAccount = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const connection = mangoStore.getState().connection
    if (!group || !publicKey) return
    setLoadingNewAccount(true)
    try {
      const { signature: tx, slot } = await client.createMangoAccount(
        group,
        0,
        accountName || 'Account 1',
        parseInt(MAX_ACCOUNTS.tokenAccounts), // tokens
        parseInt(MAX_ACCOUNTS.spotOpenOrders), // serum3
        parseInt(MAX_ACCOUNTS.perpAccounts), // perps
        parseInt(MAX_ACCOUNTS.perpOpenOrders), // perp Oo
      )
      if (tx) {
        if (signToNotifications) {
          createSolanaMessage(walletContext, setCookie)
        }
        await waitForSlot(connection, slot!)
        await actions.fetchMangoAccounts(publicKey)
        await actions.fetchWalletTokens(publicKey) // need to update sol balance after account rent
        telemetry('accountCreate', {
          props: {
            accountNum: 0,
            enableNotifications: signToNotifications,
          },
        })
        notify({
          title: t('new-account-success'),
          type: 'success',
          txid: tx,
        })
      }
    } catch (e) {
      if (isMangoError(e)) {
        notify({
          title: t('new-account-failed'),
          txid: e?.txid,
          type: 'error',
        })
      }
      console.error(e)
    } finally {
      setLoadingNewAccount(false)
    }
  }, [accountName, publicKey, signToNotifications, t])

  const handleDeposit = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const bank = group?.banksMapByName.get(depositToken)?.[0]

    if (!mangoAccount || !group || !bank || !publicKey) return
    try {
      setSubmitDeposit(true)
      const { signature: tx, slot } = await client.tokenDeposit(
        group,
        mangoAccount,
        bank.mint,
        parseFloat(depositAmount),
      )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })

      await actions.reloadMangoAccount(slot)
      actions.fetchWalletTokens(publicKey)
      setSubmitDeposit(false)
      onClose()
      // setShowSetupStep(4)
    } catch (e) {
      setSubmitDeposit(false)
      console.error(e)
      if (!isMangoError(e)) return
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
    }
  }, [depositAmount, depositToken, onClose, publicKey])

  const depositBank = useMemo(() => {
    return banks.find((b) => b.bank.name === depositToken)?.bank
  }, [depositToken, banks])

  const tokenMax = useMemo(() => {
    const bank = banks.find((b) => b.bank.name === depositToken)
    if (bank) {
      return { amount: bank.walletBalance, decimals: bank.bank.mintDecimals }
    }
    return { amount: 0, decimals: 0 }
  }, [banks, depositToken])

  const showInsufficientBalance =
    tokenMax.amount < Number(depositAmount) ||
    (depositToken === 'SOL' && maxSolDeposit <= 0)

  const setMax = useCallback(() => {
    const max = new Decimal(tokenMax.amount).toDecimalPlaces(
      tokenMax.decimals,
      Decimal.ROUND_FLOOR,
    )
    setDepositAmount(max.toString())
    setSizePercentage('100')
  }, [tokenMax])

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)
      const amount = new Decimal(tokenMax.amount)
        .mul(percentage)
        .div(100)
        .toDecimalPlaces(tokenMax.decimals, Decimal.ROUND_FLOOR)
      setDepositAmount(amount.toString())
    },
    [tokenMax],
  )

  const handleNextStep = () => {
    if (showSetupStep === 0) {
      setAcceptTerms(Date.now())
    }
    setShowSetupStep(showSetupStep + 1)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} fullScreen disableOutsideClose>
      <div className="grid h-screen overflow-hidden bg-th-bkg-1 text-left lg:grid-cols-2">
        <ColorBlur
          width="66%"
          height="300px"
          className="-left-20 -top-20 bg-th-button opacity-10 brightness-125"
        />
        <ColorBlur
          width="50%"
          height="100%"
          className="-bottom-20 -right-20 bg-th-bkg-1 opacity-30 mix-blend-multiply"
        />
        <img
          className={`absolute left-6 top-6 h-10 w-10 shrink-0`}
          src="/logos/logo-mark.svg"
          alt="next"
        />
        <div className="absolute left-0 top-0 z-10 flex h-1.5 w-full grow bg-th-bkg-3">
          <div
            style={{
              width: `${(showSetupStep / 3) * 100}%`,
            }}
            className="flex bg-th-active transition-all duration-700 ease-out"
          />
        </div>
        <div className="relative z-10 col-span-1 flex flex-col items-center justify-center p-6 pt-24">
          {connected && mangoAccountLoading ? (
            <div className="flex h-full flex-col items-center justify-center">
              <BounceLoader loadingMessage="Connecting to Mango..." />
            </div>
          ) : (
            <>
              {showSetupStep === 0 ? (
                <UserSetupTransition show={showSetupStep === 0}>
                  <h2 className="mb-4 font-display text-3xl tracking-normal md:text-5xl lg:max-w-[400px]">
                    {t('onboarding:intro-heading')}
                  </h2>
                  <p className="text-base sm:mb-2 lg:text-lg">
                    {t('onboarding:intro-desc')}
                  </p>
                  <div className="mb-3 space-y-2 py-3">
                    <CheckBullet text={t('onboarding:bullet-1')} />
                    <CheckBullet text={t('onboarding:bullet-2')} />
                    <CheckBullet text={t('onboarding:bullet-3')} />
                  </div>
                  {/* <div className="mb-4 rounded-md bg-th-bkg-2 p-4">
              <div className="flex items-center space-x-4">
                <Image
                  src="/images/rewards/chest.png"
                  alt="Rewards"
                  height={56}
                  width={56}
                />
                <div>
                  <h3 className="text-base">Trade. Win. Repeat.</h3>
                  <p>
                    Win amazing prizes every week. Create your account and start
                    trading to earn rewards.
                  </p>
                </div>
              </div>
            </div> */}
                  <div className="mb-8 flex items-center space-x-2">
                    <Checkbox
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                    >
                      <p className="flex flex-wrap">
                        <span className="mr-1">{t('accept-terms-desc')}</span>
                        <a
                          className="flex items-center"
                          href="https://docs.mango.markets/legal/terms-of-use"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {t('terms-of-use')}
                          <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 shrink-0" />
                        </a>
                        <span className="mx-1">and</span>
                        <a
                          className="flex items-center"
                          href="https://docs.mango.markets/mango-markets/risks"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {t('risks')}
                          <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 shrink-0" />
                        </a>
                      </p>
                    </Checkbox>
                  </div>
                  <Button
                    className="mb-12"
                    disabled={!termsAccepted}
                    onClick={handleNextStep}
                    size="large"
                  >
                    {t('agree-and-continue')}
                  </Button>
                </UserSetupTransition>
              ) : null}
              {showSetupStep === 1 ? (
                <UserSetupTransition show={showSetupStep === 1}>
                  <div>
                    <h2 className="mb-6 font-display text-3xl tracking-normal md:text-5xl">
                      {t('onboarding:connect-wallet')}
                    </h2>
                    <p className="mb-2 text-base">
                      {t('onboarding:choose-wallet')}
                    </p>
                    <div className="space-y-2">
                      {walletsDisplayed?.map((w) => (
                        <button
                          className={`col-span-1 w-full rounded-md border px-4 py-3 text-base font-normal focus:outline-none md:hover:cursor-pointer md:hover:border-th-fgd-4 ${
                            w.adapter.name === wallet?.adapter.name
                              ? 'border-th-active text-th-fgd-1 md:hover:border-th-active'
                              : 'border-th-bkg-4 text-th-fgd-2'
                          }`}
                          onClick={() => {
                            if (wallet) {
                              connect()
                            }
                            select(w.adapter.name)
                          }}
                          key={w.adapter.name}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <img
                                src={w.adapter.icon}
                                className="mr-2 h-5 w-5"
                                alt={`${w.adapter.name} icon`}
                              />
                              <div className="ml-2">{w.adapter.name}</div>
                            </div>
                            {w.readyState === WalletReadyState.Installed ||
                            w.readyState === WalletReadyState.Loadable ? (
                              <div className="text-xs">Detected</div>
                            ) : null}
                          </div>
                        </button>
                      ))}
                    </div>
                    {walletsToDisplay !== 'all' ? (
                      <button
                        className="mt-4 flex w-full items-center justify-center text-base text-th-fgd-3 hover:text-th-fgd-1"
                        onClick={() => setWalletstoDisplay('all')}
                      >
                        <div>More</div>
                        <div>
                          <ChevronDownIcon className={`h-5 w-5 shrink-0`} />
                        </div>
                      </button>
                    ) : null}
                  </div>
                </UserSetupTransition>
              ) : null}
              {showSetupStep === 2 ? (
                <UserSetupTransition show={showSetupStep === 2}>
                  <div>
                    <div className="pb-6">
                      <h2 className="mb-4 font-display text-3xl tracking-normal md:text-5xl">
                        {t('onboarding:create-account')}
                      </h2>
                      <p className="text-base">{t('insufficient-sol')}</p>
                    </div>
                    <div className="mb-4">
                      <Label text={t('account-name')} optional />
                      <Input
                        type="text"
                        name="name"
                        id="name"
                        placeholder="e.g. Main Account"
                        value={accountName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setAccountName(e.target.value)
                        }
                        maxLength={30}
                      />
                    </div>
                    <SolBalanceWarnings className="mt-4" />
                    <div className="flex items-center justify-between rounded-md border border-th-bkg-3 px-3 py-2">
                      <div>
                        <p className="text-th-fgd-2">
                          {t('enable-notifications')}
                        </p>
                        <p className="text-xs">{t('asked-sign-transaction')}</p>
                      </div>
                      <Switch
                        className="text-th-fgd-3"
                        checked={signToNotifications}
                        onChange={(checked) => setSignToNotifications(checked)}
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="mt-10">
                        <Button
                          className="mb-6 flex items-center justify-center"
                          disabled={maxSolDeposit <= 0}
                          onClick={handleCreateAccount}
                          size="large"
                        >
                          {loadingNewAccount ? (
                            <Loading />
                          ) : (
                            <div className="flex items-center justify-center">
                              {t('create-account')}
                            </div>
                          )}
                        </Button>
                        <LinkButton onClick={onClose}>
                          {t('onboarding:skip')}
                        </LinkButton>
                      </div>
                    </div>
                  </div>
                </UserSetupTransition>
              ) : null}
              <UserSetupTransition show={showSetupStep === 3}>
                {showSetupStep === 3 ? (
                  <div className="relative">
                    <h2 className="mb-6 font-display text-3xl tracking-normal md:text-5xl">
                      {t('onboarding:fund-account')}
                    </h2>
                    {depositToken ? (
                      <>
                        <div className="mb-4">
                          <SolBalanceWarnings
                            amount={depositAmount}
                            className="mt-4"
                            setAmount={setDepositAmount}
                            selectedToken={depositToken}
                          />
                        </div>
                        <div className="flex justify-between">
                          <Label text={t('amount')} />
                          <MaxAmountButton
                            className="mb-2"
                            decimals={tokenMax.decimals}
                            label="Max"
                            onClick={setMax}
                            value={tokenMax.amount}
                          />
                        </div>
                        <div className="mb-6 grid grid-cols-2">
                          <button
                            className="col-span-1 flex items-center rounded-lg rounded-r-none border border-r-0 border-th-input-border bg-th-input-bkg px-4"
                            onClick={() => setDepositToken('')}
                          >
                            <div className="flex w-full items-center justify-between">
                              <div className="flex items-center">
                                <Image
                                  alt=""
                                  width="20"
                                  height="20"
                                  src={`/icons/${depositToken.toLowerCase()}.svg`}
                                />
                                <p className="ml-2 text-xl font-bold text-th-fgd-1">
                                  {depositToken}
                                </p>
                              </div>
                              <PencilIcon className="ml-2 h-5 w-5 text-th-fgd-3" />
                            </div>
                          </button>
                          <NumberFormat
                            name="amountIn"
                            id="amountIn"
                            inputMode="decimal"
                            thousandSeparator=","
                            allowNegative={false}
                            isNumericString={true}
                            decimalScale={tokenMax.decimals || 6}
                            className={ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES}
                            placeholder="0.00"
                            value={depositAmount}
                            onValueChange={(values, source) =>
                              handleInputChange(
                                values,
                                source,
                                setDepositAmount,
                                setSizePercentage,
                              )
                            }
                            isAllowed={withValueLimit}
                          />
                          <div className="col-span-2 mt-2">
                            <ButtonGroup
                              activeValue={sizePercentage}
                              onChange={(p) => handleSizePercentage(p)}
                              values={['10', '25', '50', '75', '100']}
                              unit="%"
                            />
                          </div>
                        </div>
                        {depositBank ? (
                          <div className="border-y border-th-bkg-3">
                            <div className="flex justify-between px-2 py-4">
                              <p>{t('deposit-amount')}</p>
                              <p className="font-mono text-th-fgd-2">
                                <BankAmountWithValue
                                  amount={depositAmount}
                                  bank={depositBank}
                                />
                                {/* {depositAmount ? (
                            <>
                              <FormatNumericValue
                                value={depositAmount}
                                decimals={depositBank.mintDecimals}
                              />{' '}
                              <span className="text-xs text-th-fgd-3">
                                (
                                <FormatNumericValue
                                  value={
                                    depositBank.uiPrice * Number(depositAmount)
                                  }
                                  decimals={2}
                                  isUsd
                                />
                                )
                              </span>
                            </>
                          ) : (
                            <>
                              0{' '}
                              <span className="text-xs text-th-fgd-3">
                                ($0.00)
                              </span>
                            </>
                          )} */}
                              </p>
                            </div>
                          </div>
                        ) : null}
                        <Button
                          className="mb-6 mt-10 flex items-center justify-center"
                          disabled={
                            !depositAmount ||
                            !depositToken ||
                            showInsufficientBalance
                          }
                          onClick={handleDeposit}
                          size="large"
                        >
                          {submitDeposit ? (
                            <Loading />
                          ) : showInsufficientBalance ? (
                            <div className="flex items-center">
                              <ExclamationCircleIcon className="mr-2 h-5 w-5 shrink-0" />
                              {t('swap:insufficient-balance', {
                                symbol: depositToken,
                              })}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <ArrowDownTrayIcon className="mr-2 h-5 w-5" />
                              {t('deposit')}
                            </div>
                          )}
                        </Button>
                        <LinkButton onClick={onClose}>
                          {t('onboarding:skip')}
                        </LinkButton>
                      </>
                    ) : (
                      <div
                        className="thin-scroll w-full overflow-auto"
                        style={{ height: 'calc(100vh - 380px)' }}
                      >
                        <div className="flex items-center px-4 pb-2">
                          <div className="w-1/4">
                            <p className="text-xs">{t('token')}</p>
                          </div>
                          <div className="w-1/4 text-right">
                            <p className="text-xs">{t('deposit-rate')}</p>
                          </div>
                          <div className="w-1/2 text-right">
                            <p className="whitespace-nowrap text-xs">
                              {t('max')}
                            </p>
                          </div>
                        </div>
                        <ActionTokenList
                          banks={banks}
                          onSelect={setDepositToken}
                          showDepositRates
                          valueKey="walletBalance"
                        />
                      </div>
                    )}
                  </div>
                ) : null}
              </UserSetupTransition>
            </>
          )}
        </div>
        <div className="relative col-span-1 hidden h-screen lg:block">
          {/* <ParticlesBackground /> */}
          <img
            className={`absolute left-1/2 top-1/2 h-auto w-[95%] max-w-[700px] -translate-x-1/2 -translate-y-1/2 ${
              showSetupStep !== 0 ? 'hidden lg:block' : 'hidden sm:block'
            }`}
            src="/images/onboarding-image@1x.png"
            alt="next"
          />
        </div>
      </div>
    </Modal>
  )
}

export default UserSetupModal

const CheckBullet = ({ text }: { text: string }) => {
  return (
    <div className="flex items-center space-x-2">
      <CheckCircleIcon className="h-5 w-5 text-th-active" />
      <p className="text-base text-th-fgd-2">{text}</p>
    </div>
  )
}

const UserSetupTransition = ({
  show,
  children,
  delay = false,
}: {
  show: boolean
  children: ReactNode
  delay?: boolean
}) => {
  return (
    <Transition
      appear
      className="relative top-0 h-full w-full max-w-md"
      show={show}
      enter={`transition ease-in duration-300 ${delay ? 'delay-300' : ''}`}
      enterFrom="opacity-0"
      enterTo="opacity-100"
      leave="transition ease-out duration-300"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      {children}
    </Transition>
  )
}
