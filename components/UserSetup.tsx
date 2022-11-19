import { toUiDecimalsForQuote } from '@blockworks-foundation/mango-v4'
import { Transition } from '@headlessui/react'
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FireIcon,
  PencilIcon,
  PlusCircleIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { Wallet } from '@project-serum/anchor'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import Decimal from 'decimal.js'
import useLocalStorageState from 'hooks/useLocalStorageState'
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
import { ALPHA_DEPOSIT_LIMIT, IS_ONBOARDED_KEY } from 'utils/constants'
import { notify } from 'utils/notifications'
import { floorToDecimal, formatFixedDecimals } from 'utils/numbers'
import ActionTokenList from './account/ActionTokenList'
import ButtonGroup from './forms/ButtonGroup'
import Input from './forms/Input'
import Label from './forms/Label'
import WalletIcon from './icons/WalletIcon'
import { walletBalanceForToken } from './modals/DepositModal'
import ParticlesBackground from './ParticlesBackground'
import EditNftProfilePic from './profile/EditNftProfilePic'
import EditProfileForm from './profile/EditProfileForm'
import Button, { IconButton, LinkButton } from './shared/Button'
import InlineNotification from './shared/InlineNotification'
import Loading from './shared/Loading'
import MaxAmountButton from './shared/MaxAmountButton'
import SolBalanceWarnings from './shared/SolBalanceWarnings'
import { useEnhancedWallet } from './wallet/EnhancedWalletProvider'

const UserSetup = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation(['common', 'onboarding', 'swap'])
  const group = mangoStore((s) => s.group)
  const { connected, select, wallet, wallets } = useWallet()
  const { mangoAccount } = useMangoAccount()
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.initialLoad)
  const [accountName, setAccountName] = useState('')
  const [loadingAccount, setLoadingAccount] = useState(false)
  const [showSetupStep, setShowSetupStep] = useState(0)
  const [depositToken, setDepositToken] = useState('USDC')
  const [depositAmount, setDepositAmount] = useState('')
  const [submitDeposit, setSubmitDeposit] = useState(false)
  const [sizePercentage, setSizePercentage] = useState('')
  const [showEditProfilePic, setShowEditProfilePic] = useState(false)
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  const [, setIsOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const { handleConnect } = useEnhancedWallet()
  const { maxSolDeposit } = useSolBalance()

  const exceedsAlphaMax = useMemo(() => {
    const mangoAccount = mangoStore.getState().mangoAccount.current
    if (!group || !mangoAccount) return
    if (
      mangoAccount.owner.toString() ===
      '8SSLjXBEVk9nesbhi9UMCA32uijbVBUqWoKPPQPTekzt'
    )
      return false
    const accountValue = toUiDecimalsForQuote(
      mangoAccount.getEquity(group)!.toNumber()
    )
    return (
      parseFloat(depositAmount) > ALPHA_DEPOSIT_LIMIT ||
      accountValue > ALPHA_DEPOSIT_LIMIT
    )
  }, [depositAmount])

  useEffect(() => {
    if (connected) {
      setShowSetupStep(2)
    }
  }, [connected])

  const handleCreateAccount = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    if (!group || !wallet) return
    setLoadingAccount(true)
    try {
      const tx = await client.createMangoAccount(
        group,
        0,
        accountName || 'Account 1',
        undefined, // tokenCount
        undefined, // serum3Count
        8, // perpCount
        8 // perpOoCount
      )
      actions.fetchMangoAccounts(wallet!.adapter as unknown as Wallet)
      if (tx) {
        actions.fetchWalletTokens(wallet!.adapter as unknown as Wallet) // need to update sol balance after account rent
        setShowSetupStep(3)
        notify({
          title: t('new-account-success'),
          type: 'success',
          txid: tx,
        })
      }
    } catch (e: any) {
      notify({
        title: t('new-account-failed'),
        txid: e?.signature,
        type: 'error',
      })
      console.error(e)
    } finally {
      setLoadingAccount(false)
    }
  }, [accountName, wallet, t])

  const handleDeposit = useCallback(async () => {
    const client = mangoStore.getState().client
    const group = mangoStore.getState().group
    const actions = mangoStore.getState().actions
    const mangoAccount = mangoStore.getState().mangoAccount.current

    if (!mangoAccount || !group) return
    const bank = group.banksMapByName.get(depositToken)![0]
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
      setShowSetupStep(4)
      setSubmitDeposit(false)
    } catch (e: any) {
      notify({
        title: 'Transaction failed',
        description: e.message,
        txid: e?.txid,
        type: 'error',
      })
      setSubmitDeposit(false)
      console.error(e)
    }
  }, [depositAmount, depositToken, onClose])

  useEffect(() => {
    if (mangoAccount && showSetupStep === 2) {
      setIsOnboarded(true)
      onClose()
    }
  }, [mangoAccount, showSetupStep, onClose])

  const banks = useMemo(() => {
    const banks = group?.banksMapByName
      ? Array.from(group?.banksMapByName, ([key, value]) => {
          const walletBalance = walletBalanceForToken(walletTokens, key)
          return {
            key,
            value,
            tokenDecimals: walletBalance.maxDecimals,
            walletBalance: floorToDecimal(
              walletBalance.maxAmount,
              walletBalance.maxDecimals
            ).toNumber(),
            walletBalanceValue: walletBalance.maxAmount * value?.[0].uiPrice,
          }
        })
      : []
    return banks
  }, [group?.banksMapByName, walletTokens])

  const depositBank = useMemo(() => {
    return banks.find((b) => b.key === depositToken)
  }, [depositToken])

  const tokenMax = useMemo(() => {
    const bank = banks.find((bank) => bank.key === depositToken)
    if (bank) {
      return { amount: bank.walletBalance, decimals: bank.tokenDecimals }
    }
    return { amount: 0, decimals: 0 }
  }, [banks, depositToken])

  const showInsufficientBalance = tokenMax.amount < Number(depositAmount)

  const handleSizePercentage = useCallback(
    (percentage: string) => {
      setSizePercentage(percentage)
      let amount = new Decimal(tokenMax.amount).mul(percentage).div(100)
      if (percentage !== '100') {
        amount = floorToDecimal(amount, tokenMax.decimals)
      }

      setDepositAmount(amount.toString())
    },
    [tokenMax]
  )

  const handleNextStep = () => {
    setShowSetupStep(showSetupStep + 1)
  }

  return (
    <div className="radial-gradient-bg fixed inset-0 z-20 grid overflow-hidden lg:grid-cols-2">
      <img
        className="absolute -bottom-6 right-0 hidden h-auto w-[53%] lg:block xl:w-[57%]"
        src="/images/trade.png"
        alt="next"
      />
      <img
        className={`absolute top-6 left-6 h-10 w-10 flex-shrink-0`}
        src="/logos/logo-mark.svg"
        alt="next"
      />
      <div className="absolute top-0 left-0 z-10 flex h-1.5 w-full flex-grow bg-th-bkg-3">
        <div
          style={{
            width: `${(showSetupStep / 4) * 100}%`,
          }}
          className="flex bg-th-primary transition-all duration-700 ease-out"
        />
      </div>
      <div className="absolute top-6 right-6 z-10">
        <IconButton hideBg onClick={() => onClose()}>
          <XMarkIcon className="h-6 w-6 text-th-fgd-4" />
        </IconButton>
      </div>
      <div className="col-span-1 flex flex-col items-center justify-center p-6 pt-24">
        <UserSetupTransition show={showSetupStep === 0}>
          <h2 className="mb-4 text-5xl lg:text-6xl">
            {t('onboarding:intro-heading')}
          </h2>
          <p className="mb-4 text-base">{t('onboarding:intro-desc')}</p>
          <div className="mb-6 space-y-2 py-3">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-base">{t('onboarding:bullet-1')}</p>
            </div>
            {/* <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-base">Deeply liquid markets</p>
            </div> */}
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-base">{t('onboarding:bullet-2')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-base">{t('onboarding:bullet-3')}</p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-base">{t('onboarding:bullet-4')}</p>
            </div>
          </div>
          <Button className="w-44" onClick={handleNextStep} size="large">
            <div className="flex items-center justify-center">
              <FireIcon className="mr-2 h-5 w-5" />
              {t('onboarding:lets-go')}
            </div>
          </Button>
        </UserSetupTransition>
        <UserSetupTransition delay show={showSetupStep === 1}>
          {showSetupStep === 1 ? (
            <div>
              <h2 className="mb-6 text-5xl lg:text-6xl">
                {t('onboarding:connect-wallet')}
              </h2>
              <p className="mb-2 text-base">{t('onboarding:choose-wallet')}</p>
              <div className="space-y-2">
                {wallets?.map((w) => (
                  <button
                    className={`col-span-1 w-full rounded-md border py-3 px-4 text-base font-normal focus:outline-none md:hover:cursor-pointer md:hover:border-th-fgd-4 ${
                      w.adapter.name === wallet?.adapter.name
                        ? 'border-th-primary text-th-fgd-1 md:hover:border-th-primary'
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
                className="mt-10 flex w-44 items-center justify-center"
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
                <h2 className="mb-4 text-5xl lg:text-6xl">
                  {t('onboarding:create-account')}
                </h2>
                <p className="text-base">
                  {t('onboarding:create-account-desc')}
                </p>
              </div>
              <div className="pb-4">
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
                  charLimit={30}
                />
              </div>
              <div>
                <InlineNotification type="info" desc={t('insufficient-sol')} />
                <div className="mt-10">
                  <Button
                    className="mb-6 flex w-44 items-center justify-center"
                    disabled={maxSolDeposit <= 0}
                    onClick={handleCreateAccount}
                    size="large"
                  >
                    {loadingAccount ? (
                      <Loading />
                    ) : (
                      <div className="flex items-center justify-center">
                        <PlusCircleIcon className="mr-2 h-5 w-5" />
                        {t('create-account')}
                      </div>
                    )}
                  </Button>
                  <SolBalanceWarnings />
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
              <h2 className="mb-6 text-5xl lg:text-6xl">
                {t('onboarding:fund-account')}
              </h2>
              <UserSetupTransition show={depositToken.length > 0}>
                <div className="mb-4">
                  <InlineNotification
                    type="info"
                    desc={`There is a $${ALPHA_DEPOSIT_LIMIT} deposit limit during alpha testing.`}
                  />
                  <SolBalanceWarnings
                    amount={depositAmount}
                    setAmount={setDepositAmount}
                    selectedToken={depositToken}
                  />
                </div>
                <div className="flex justify-between">
                  <Label text={t('amount')} />
                  <MaxAmountButton
                    className="mb-2"
                    disabled={depositToken === 'SOL' && maxSolDeposit <= 0}
                    label="Wallet Max"
                    onClick={() =>
                      setDepositAmount(
                        floorToDecimal(
                          tokenMax.amount,
                          tokenMax.decimals
                        ).toFixed()
                      )
                    }
                    value={floorToDecimal(
                      tokenMax.amount,
                      tokenMax.decimals
                    ).toFixed()}
                  />
                </div>
                <div className="mb-6 grid grid-cols-2">
                  <button
                    className="col-span-1 flex items-center rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-transparent px-4 hover:bg-transparent"
                    onClick={() => setDepositToken('')}
                  >
                    <div className="ml-1.5 flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <Image
                          alt=""
                          width="20"
                          height="20"
                          src={`/icons/${depositToken.toLowerCase()}.svg`}
                        />
                        <p className="ml-1.5 text-xl font-bold text-th-fgd-1">
                          {depositToken}
                        </p>
                      </div>
                      <PencilIcon className="ml-2 h-5 w-5 text-th-fgd-3" />
                    </div>
                  </button>
                  <Input
                    className="col-span-1 w-full rounded-lg rounded-l-none border border-th-bkg-4 bg-transparent p-3 text-right text-xl font-bold tracking-wider text-th-fgd-1 focus:outline-none"
                    type="text"
                    name="deposit"
                    id="deposit"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setDepositAmount(e.target.value)
                    }
                  />
                  <div className="col-span-2 mt-2">
                    <ButtonGroup
                      activeValue={sizePercentage}
                      disabled={depositToken === 'SOL' && maxSolDeposit <= 0}
                      onChange={(p) => handleSizePercentage(p)}
                      values={['10', '25', '50', '75', '100']}
                      unit="%"
                    />
                  </div>
                </div>
                <div className="mb-10 border-y border-th-bkg-3">
                  <div className="flex justify-between px-2 py-4">
                    <p>{t('deposit-value')}</p>
                    <p className="font-mono">
                      {depositBank
                        ? formatFixedDecimals(
                            depositBank.value[0].uiPrice *
                              Number(depositAmount),
                            true
                          )
                        : ''}
                    </p>
                  </div>
                </div>
                <Button
                  className="mb-6 flex w-44 items-center justify-center"
                  disabled={
                    !depositAmount ||
                    !depositToken ||
                    exceedsAlphaMax ||
                    showInsufficientBalance
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
                <LinkButton onClick={() => setShowSetupStep(4)}>
                  <span className="default-transition text-th-fgd-4 underline md:hover:text-th-fgd-3 md:hover:no-underline">
                    {t('onboarding:skip')}
                  </span>
                </LinkButton>
              </UserSetupTransition>
              <UserSetupTransition show={depositToken.length === 0}>
                <div
                  className="thin-scroll absolute top-36 w-full overflow-auto"
                  style={{ height: 'calc(100vh - 380px)' }}
                >
                  <div className="grid auto-cols-fr grid-flow-col px-4 pb-2">
                    <div className="">
                      <p className="text-xs">{t('token')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">{t('deposit-rate')}</p>
                    </div>
                    <div className="text-right">
                      <p className="whitespace-nowrap text-xs">
                        {t('wallet-balance')}
                      </p>
                    </div>
                  </div>
                  <ActionTokenList
                    banks={banks}
                    onSelect={setDepositToken}
                    showDepositRates
                    sortByKey="walletBalanceValue"
                    valueKey="walletBalance"
                  />
                </div>
              </UserSetupTransition>
            </div>
          ) : null}
        </UserSetupTransition>
        <UserSetupTransition delay show={showSetupStep === 4}>
          {showSetupStep === 4 ? (
            <div className="relative">
              <h2 className="mb-4 text-5xl lg:text-6xl">
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
        </UserSetupTransition>
      </div>
      <div className="col-span-1 hidden h-screen lg:block">
        <ParticlesBackground />
      </div>
    </div>
  )
}

export default UserSetup

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
