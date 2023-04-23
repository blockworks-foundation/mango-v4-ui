import { Transition } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
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
import { notify } from 'utils/notifications'
import ActionTokenList from '../account/ActionTokenList'
import ButtonGroup from '../forms/ButtonGroup'
import Input from '../forms/Input'
import Label from '../forms/Label'
import WalletIcon from '../icons/WalletIcon'
import ParticlesBackground from '../ParticlesBackground'
// import EditNftProfilePic from '../profile/EditNftProfilePic'
// import EditProfileForm from '../profile/EditProfileForm'
import Button, { LinkButton } from '../shared/Button'
import InlineNotification from '../shared/InlineNotification'
import Loading from '../shared/Loading'
import MaxAmountButton from '../shared/MaxAmountButton'
import SolBalanceWarnings from '../shared/SolBalanceWarnings'
import { useEnhancedWallet } from '../wallet/EnhancedWalletProvider'
import Modal from '../shared/Modal'
import NumberFormat, { NumberFormatValues } from 'react-number-format'
import { withValueLimit } from '@components/swap/SwapForm'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import BankAmountWithValue from '@components/shared/BankAmountWithValue'
import { isMangoError } from 'types'
import ColorBlur from '@components/ColorBlur'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ACCEPT_TERMS_KEY } from 'utils/constants'
import { ACCOUNT_ACTIONS_NUMBER_FORMAT_CLASSES } from '@components/BorrowForm'

const UserSetupModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => {
  const { t } = useTranslation(['common', 'onboarding', 'swap'])
  const { connected, select, wallet, wallets, publicKey } = useWallet()
  const { mangoAccount } = useMangoAccount()
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const [accountName, setAccountName] = useState('')
  const [loadingAccount, setLoadingAccount] = useState(false)
  const [showSetupStep, setShowSetupStep] = useState(0)
  const [depositToken, setDepositToken] = useState('USDC')
  const [depositAmount, setDepositAmount] = useState('')
  const [submitDeposit, setSubmitDeposit] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  // const [showEditProfilePic, setShowEditProfilePic] = useState(false)
  const { handleConnect } = useEnhancedWallet()
  const { maxSolDeposit } = useSolBalance()
  const banks = useBanksWithBalances('walletBalance')
  const [, setAcceptTerms] = useLocalStorageState(ACCEPT_TERMS_KEY, '')

  useEffect(() => {
    if (connected) {
      setShowSetupStep(2)
    }
  }, [connected])

  const handleCreateAccount = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    if (!group || !publicKey) return
    setLoadingAccount(true)
    try {
      const tx = await client.createMangoAccount(
        group,
        0,
        accountName || 'Account 1',
        undefined, // tokenCount
        undefined, // serum3Count
        8, // perpCount
        10 // perpOoCount
      )
      actions.fetchMangoAccounts(publicKey)
      if (tx) {
        actions.fetchWalletTokens(publicKey) // need to update sol balance after account rent
        setShowSetupStep(3)
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
      setLoadingAccount(false)
    }
  }, [accountName, publicKey, t])

  const handleDeposit = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount.current
    const bank = group?.banksMapByName.get(depositToken)?.[0]

    if (!mangoAccount || !group || !bank) return
    try {
      setSubmitDeposit(true)
      const tx = await client.tokenDeposit(
        group,
        mangoAccount,
        bank.mint,
        parseFloat(depositAmount)
      )
      notify({
        title: 'Transaction confirmed',
        type: 'success',
        txid: tx,
      })

      await actions.reloadMangoAccount()
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
  }, [depositAmount, depositToken, onClose])

  useEffect(() => {
    if (mangoAccount && showSetupStep === 2) {
      onClose()
    }
  }, [mangoAccount, showSetupStep, onClose])

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
      Decimal.ROUND_FLOOR
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
    [tokenMax]
  )

  const handleNextStep = () => {
    if (showSetupStep === 0) {
      setAcceptTerms(Date.now())
    }
    setShowSetupStep(showSetupStep + 1)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} fullScreen disableOutsideClose>
      <div className="grid h-screen overflow-auto bg-th-bkg-1 text-left lg:grid-cols-2">
        <img
          className={`absolute -bottom-20 left-1/2 mt-8 h-auto -translate-x-1/2 sm:w-[60%] md:w-[410px] lg:left-auto lg:-right-10 lg:w-[55%] lg:-translate-x-0 xl:-bottom-40 ${
            showSetupStep !== 0 ? 'hidden lg:block' : 'hidden sm:block'
          }`}
          src="/images/swap-trade@0.75x.png"
          srcSet="/images/swap-trade@0.75x.png 1098x, /images/swap-trade@1x.png 1463w,
          /images/swap-trade@2x.png 2926w"
          sizes="(max-width: 1600px) 1098px, (max-width: 2500px) 1463px, 2926px"
          alt="next"
        />
        <img
          className={`absolute top-6 left-6 h-10 w-10 flex-shrink-0`}
          src="/logos/logo-mark.svg"
          alt="next"
        />
        <ColorBlur
          width="66%"
          height="300px"
          className="-top-20 left-0 opacity-20 brightness-125"
        />
        <div className="absolute top-0 left-0 z-10 flex h-1.5 w-full flex-grow bg-th-bkg-3">
          <div
            style={{
              width: `${(showSetupStep / 3) * 100}%`,
            }}
            className="flex bg-th-active transition-all duration-700 ease-out"
          />
        </div>
        <div className="col-span-1 flex flex-col items-center justify-center p-6 pt-24">
          <UserSetupTransition show={showSetupStep === 0}>
            <h2 className="mb-4 font-display text-3xl tracking-normal md:text-5xl lg:max-w-[400px] lg:text-6xl">
              {t('onboarding:intro-heading')}
            </h2>
            <p className="text-base sm:mb-2 lg:text-lg">
              {t('onboarding:intro-desc')}
            </p>
            <div className="mb-3 space-y-2 py-3">
              <CheckBullet text={t('onboarding:bullet-1')} />
              <CheckBullet text={t('onboarding:bullet-2')} />
              <CheckBullet text={t('onboarding:bullet-3')} />
              <CheckBullet text={t('onboarding:bullet-4')} />
            </div>
            <p className="mb-6 flex flex-wrap">
              <span className="mr-1">{t('accept-terms-desc')}</span>
              <a
                className="flex items-center"
                href="https://docs.mango.markets/legal/terms-of-use"
                rel="noopener noreferrer"
                target="_blank"
              >
                {t('terms-of-use')}
                <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4 flex-shrink-0" />
              </a>
            </p>
            <Button className="mb-12" onClick={handleNextStep} size="large">
              {t('agree-and-continue')}
            </Button>
          </UserSetupTransition>
          <UserSetupTransition delay show={showSetupStep === 1}>
            {showSetupStep === 1 ? (
              <div>
                <h2 className="mb-6 font-display text-3xl tracking-normal md:text-5xl lg:text-6xl">
                  {t('onboarding:connect-wallet')}
                </h2>
                <p className="mb-2 text-base">
                  {t('onboarding:choose-wallet')}
                </p>
                <div className="space-y-2">
                  {wallets?.map((w) => (
                    <button
                      className={`col-span-1 w-full rounded-md border py-3 px-4 text-base font-normal focus:outline-none md:hover:cursor-pointer md:hover:border-th-fgd-4 ${
                        w.adapter.name === wallet?.adapter.name
                          ? 'border-th-active text-th-fgd-1 md:hover:border-th-active'
                          : 'border-th-bkg-4 text-th-fgd-4'
                      }`}
                      onClick={() => {
                        select(w.adapter.name)
                      }}
                      key={w.adapter.name}
                    >
                      <div className="flex items-center">
                        <img
                          src={w.adapter.icon}
                          className="mr-2 h-5 w-5"
                          alt={`${w.adapter.name} icon`}
                        />
                        {w.adapter.name}
                      </div>
                    </button>
                  ))}
                </div>
                <Button
                  className="mt-10 flex items-center justify-center"
                  onClick={handleConnect}
                  size="large"
                >
                  {connected && mangoAccountLoading ? (
                    <Loading />
                  ) : (
                    <div className="flex items-center justify-center">
                      <WalletIcon className="mr-2 h-5 w-5" />

                      {t('onboarding:connect-wallet')}
                    </div>
                  )}
                </Button>
              </div>
            ) : null}
          </UserSetupTransition>
          <UserSetupTransition
            delay
            show={showSetupStep === 2 && !mangoAccountLoading}
          >
            {showSetupStep === 2 ? (
              <div>
                <div className="pb-6">
                  <h2 className="mb-4 font-display text-3xl tracking-normal md:text-5xl lg:text-6xl">
                    {t('onboarding:create-account')}
                  </h2>
                  <p className="text-base">
                    {t('onboarding:create-account-desc')}
                  </p>
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
                <div className="mt-2">
                  <InlineNotification
                    type="info"
                    desc={t('insufficient-sol')}
                  />
                  <div className="mt-10">
                    <Button
                      className="mb-6 flex items-center justify-center"
                      disabled={maxSolDeposit <= 0}
                      onClick={handleCreateAccount}
                      size="large"
                    >
                      {loadingAccount ? (
                        <Loading />
                      ) : (
                        <div className="flex items-center justify-center">
                          {t('create-account')}
                        </div>
                      )}
                    </Button>
                    <LinkButton onClick={onClose}>
                      <span className="default-transition text-th-fgd-4 underline md:hover:text-th-fgd-3 md:hover:no-underline">
                        {t('onboarding:skip')}
                      </span>
                    </LinkButton>
                  </div>
                </div>
              </div>
            ) : null}
          </UserSetupTransition>
          <UserSetupTransition delay show={showSetupStep === 3}>
            {showSetupStep === 3 ? (
              <div className="relative">
                <h2 className="mb-6 font-display text-3xl tracking-normal md:text-5xl lg:text-6xl">
                  {t('onboarding:fund-account')}
                </h2>
                <UserSetupTransition show={depositToken.length > 0}>
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
                      onValueChange={(e: NumberFormatValues) => {
                        setDepositAmount(
                          !Number.isNaN(Number(e.value)) ? e.value : ''
                        )
                      }}
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
                      !depositAmount || !depositToken || showInsufficientBalance
                    }
                    onClick={handleDeposit}
                    size="large"
                  >
                    {submitDeposit ? (
                      <Loading />
                    ) : showInsufficientBalance ? (
                      <div className="flex items-center">
                        <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0" />
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
                    <span className="default-transition text-th-fgd-4 underline md:hover:text-th-fgd-3 md:hover:no-underline">
                      {t('onboarding:skip')}
                    </span>
                  </LinkButton>
                </UserSetupTransition>
                <UserSetupTransition show={depositToken.length === 0}>
                  <div
                    className="thin-scroll absolute top-[62px] w-full overflow-auto md:top-[74px] lg:top-36"
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
                          {t('wallet-balance')}
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
                </UserSetupTransition>
              </div>
            ) : null}
          </UserSetupTransition>
          {/* <UserSetupTransition delay show={showSetupStep === 4}>
            {showSetupStep === 4 ? (
              <div className="relative">
                <h2 className="mb-4 font-display text-3xl tracking-normal md:text-5xl lg:text-6xl">
                  {t('onboarding:your-profile')}
                </h2>
                <p className="text-base">{t('onboarding:profile-desc')}</p>
                {!showEditProfilePic ? (
                  <div className="mt-6 border-t border-th-bkg-3 pt-3">
                    <EditProfileForm
                      onFinish={onClose}
                      onEditProfileImage={() => setShowEditProfilePic(true)}
                      onboarding
                    />
                    <LinkButton className="mt-6" onClick={onClose}>
                      <span className="default-transition text-th-fgd-4 underline md:hover:text-th-fgd-3 md:hover:no-underline">
                        {t('onboarding:skip-finish')}
                      </span>
                    </LinkButton>
                  </div>
                ) : null}
                <UserSetupTransition show={showEditProfilePic}>
                  <div
                    className="thin-scroll absolute mt-6 w-full overflow-auto border-t border-th-bkg-3 px-2 pt-6"
                    style={{ height: 'calc(100vh - 360px)' }}
                  >
                    <EditNftProfilePic
                      onClose={() => setShowEditProfilePic(false)}
                    />
                  </div>
                </UserSetupTransition>
              </div>
            ) : null}
          </UserSetupTransition> */}
        </div>
        <div className="col-span-1 hidden h-screen lg:block">
          <ParticlesBackground />
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
      className="h-full w-full max-w-md"
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
