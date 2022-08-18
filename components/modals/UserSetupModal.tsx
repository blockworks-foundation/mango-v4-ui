import { Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { ModalProps } from '../../types/modal'
// import { PROFILE_CATEGORIES } from '../../utils/profile'
import Input from '../forms/Input'
import Label from '../forms/Label'
// import Select from '../forms/Select'
import Button, { LinkButton } from '../shared/Button'
import InlineNotification from '../shared/InlineNotification'
import Modal from '../shared/Modal'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { CheckCircleIcon, PencilIcon } from '@heroicons/react/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '../../store/state'
import { IS_ONBOARDED_KEY } from '../Layout'
import { EnterRightExitLeft, FadeInFadeOut } from '../shared/Transitions'
import Image from 'next/image'
import BounceLoader from '../shared/BounceLoader'
import { notify } from '../../utils/notifications'
import { Wallet } from '@project-serum/anchor'
import ActionTokenList from '../account/ActionTokenList'
import { walletBalanceForToken } from './DepositModal'
import { floorToDecimal } from '../../utils/numbers'
import { handleWalletConnect } from '../wallet/WalletListener'

const UserSetupModal = ({ isOpen, onClose }: ModalProps) => {
  const { t } = useTranslation()
  const group = mangoStore((s) => s.group)
  const { connected, select, wallet, wallets } = useWallet()
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const mangoAccountLoading = mangoStore((s) => s.mangoAccount.loading)
  const [accountName, setAccountName] = useState('')
  const [loadingAccount, setLoadingAccount] = useState(false)
  // const [profileName, setProfileName] = useState('')
  // const [profileCategory, setProfileCategory] = useState('')
  const [showSetupStep, setShowSetupStep] = useState(0)
  // const [acceptRisks, setAcceptRisks] = useState(false)
  const [depositToken, setDepositToken] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [submitDeposit, setSubmitDeposit] = useState(false)
  const [, setIsOnboarded] = useLocalStorageState(IS_ONBOARDED_KEY)
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const handleNextStep = () => {
    setShowSetupStep(showSetupStep + 1)
  }

  const handleSaveProfile = () => {
    // save profile details to db then:
    setShowSetupStep(2)
  }

  const handleEndOnboarding = () => {
    onClose()
  }

  const connectWallet = async () => {
    if (wallet) {
      handleWalletConnect(wallet)
      setIsOnboarded(true)
    }
  }

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
        accountName || 'Account 1'
      )
      actions.fetchMangoAccount(wallet!.adapter as unknown as Wallet)
      // actions.fetchMangoAccounts(wallet!.adapter as unknown as Wallet)
      if (tx) {
        setLoadingAccount(false)
        setShowSetupStep(3)
        notify({
          title: t('new-account-success'),
          type: 'success',
          txid: tx,
        })
      }
    } catch (e: any) {
      setLoadingAccount(false)
      notify({
        title: t('new-account-failed'),
        txid: e?.signature,
        type: 'error',
      })
      console.log(e)
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

      await actions.reloadAccount()
      setIsOnboarded(true)
      onClose()
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
  }, [depositAmount, depositToken, onClose, setIsOnboarded])

  useEffect(() => {
    if (mangoAccount && showSetupStep === 1) {
      setIsOnboarded(true)
      onClose()
    }
  }, [mangoAccount, showSetupStep, onClose, setIsOnboarded])

  useEffect(() => {
    if (connected && !mangoAccountLoading) {
      setShowSetupStep(2)
    }
  }, [connected, mangoAccountLoading])

  const banks = useMemo(() => {
    return group?.banksMapByName
      ? Array.from(group?.banksMapByName, ([key, value]) => {
          const walletBalance = walletBalanceForToken(walletTokens, key)
          return {
            key,
            value,
            walletBalance: floorToDecimal(
              walletBalance.maxAmount,
              walletBalance.maxDecimals
            ),
          }
        })
      : []
  }, [group?.banksMapByName, walletTokens])

  return (
    <Modal isOpen={isOpen} onClose={onClose} disableOutsideClose hideClose>
      <div className="absolute top-0 left-0 flex h-0.5 w-full flex-grow bg-th-bkg-4">
        <div
          style={{
            width: `${(showSetupStep / 4) * 100}%`,
          }}
          className="default-transition flex rounded bg-th-primary"
        ></div>
      </div>
      <div className="h-[392px]">
        <Transition
          appear={true}
          className="absolute top-0.5 left-0 z-20 h-full w-full bg-th-bkg-1 p-6"
          show={showSetupStep === 0}
          enter="transition ease-in duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition ease-out duration-500"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <h2 className="mb-1">Welcome.</h2>
          <p className="mb-4">
            {
              "You're seconds away from trading the most liquid dex markets on Solana."
            }
          </p>
          <div className="mb-6 space-y-2 border-y border-th-bkg-4 py-4">
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-th-fgd-1">Trusted by 1,000s of DeFi users</p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-th-fgd-1">Deeply liquid markets</p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-th-fgd-1">
                Up to 20x leverage across 100s of tokens
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-th-fgd-1">Earn interest on your deposits</p>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircleIcon className="h-5 w-5 text-th-green" />
              <p className="text-th-fgd-1">
                Borrow 100s of tokens with many collateral options
              </p>
            </div>
          </div>
          <Button className="w-full" onClick={handleNextStep} size="large">
            {"Let's Go"}
          </Button>
        </Transition>
        <EnterRightExitLeft
          className="absolute top-0.5 left-0 z-20 w-full bg-th-bkg-1 p-6"
          show={showSetupStep === 1}
          style={{ height: 'calc(100% - 12px)' }}
        >
          {connected && mangoAccountLoading ? (
            <div className="flex h-full items-center justify-center">
              <BounceLoader />
            </div>
          ) : (
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="mb-4">
                  <h2 className="mb-1">Connect Wallet</h2>
                </div>
                <p className="mb-2 font-bold">Choose Wallet</p>
                <div className="thin-scroll grid max-h-56 grid-flow-row grid-cols-3 gap-2 overflow-y-auto">
                  {wallets?.map((w) => (
                    <button
                      className={`col-span-1 rounded-md border py-3 px-4 text-base font-normal focus:outline-none md:hover:cursor-pointer md:hover:border-th-fgd-4 ${
                        w.adapter.name === wallet?.adapter.name
                          ? 'border-th-primary md:hover:border-th-primary'
                          : 'border-th-bkg-4'
                      }`}
                      onClick={() => {
                        select(w.adapter.name)
                      }}
                      key={w.adapter.name}
                    >
                      <div className="flex items-center text-th-fgd-4">
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
              </div>
              <Button className="w-full" onClick={connectWallet} size="large">
                Connect Wallet
              </Button>
            </div>
          )}
        </EnterRightExitLeft>
        {/* <EnterRightExitLeft
          className="absolute top-0.5 left-0 z-20 w-full bg-th-bkg-1 p-6"
          show={showSetupStep === 2}
          style={{ height: 'calc(100% - 12px)' }}
        >
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="pb-4">
                <h2 className="mb-1">Create Profile</h2>
                <p>Your public facing identity on Mango...</p>
              </div>
              <div className="pb-4">
                <Label text="Profile Name" />
                <Input
                  type="text"
                  value={profileName}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setProfileName(e.target.value)
                  }
                />
              </div>
              <div className="pb-6">
                <Label text="Profile Category" />
                <Select
                  value={profileCategory}
                  onChange={(cat: string) => setProfileCategory(cat)}
                  className="w-full"
                >
                  {PROFILE_CATEGORIES.map((cat) => (
                    <Select.Option key={cat} value={cat}>
                      {cat}
                    </Select.Option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <Button
                className="mb-4 w-full"
                onClick={handleSaveProfile}
                size="large"
              >
                Save Profile
              </Button>
              <LinkButton onClick={handleNextStep}>Skip for now</LinkButton>
            </div>
          </div>
        </EnterRightExitLeft> */}
        <EnterRightExitLeft
          className="absolute top-0.5 left-0 z-20 w-full bg-th-bkg-1 p-6"
          show={showSetupStep === 2}
          style={{ height: 'calc(100% - 12px)' }}
        >
          {loadingAccount ? (
            <div className="flex h-full items-center justify-center">
              <BounceLoader loadingMessage="Creating Account..." />
            </div>
          ) : (
            <div className="flex h-full flex-col justify-between">
              <div>
                <div className="pb-4">
                  <h2 className="mb-1">Create Account</h2>
                  <p>You need a Mango Account to get started.</p>
                </div>
                <div className="pb-4">
                  <Label text="Account Name" optional />
                  <Input
                    type="text"
                    name="name"
                    id="name"
                    placeholder="Account"
                    value={accountName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setAccountName(e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-6">
                <InlineNotification type="info" desc={t('insufficient-sol')} />
                <Button
                  className="mb-4 w-full"
                  onClick={() => handleCreateAccount()}
                  size="large"
                >
                  Create Account
                </Button>
              </div>
            </div>
          )}
        </EnterRightExitLeft>
        <EnterRightExitLeft
          className="absolute top-0.5 left-0 z-20 w-full bg-th-bkg-1 p-6"
          show={showSetupStep === 3}
          style={{ height: 'calc(100% - 12px)' }}
        >
          {submitDeposit ? (
            <div className="flex h-full items-center justify-center">
              <BounceLoader loadingMessage="Funding your account..." />
            </div>
          ) : (
            <div className="flex h-full flex-col justify-between">
              <div className="relative">
                <h2 className="mb-4">Fund Your Account</h2>
                <FadeInFadeOut show={!!depositToken}>
                  <Label text="Amount" />
                  <div className="grid grid-cols-2">
                    <button
                      className="col-span-1 flex items-center rounded-lg rounded-r-none border border-r-0 border-th-bkg-4 bg-th-bkg-1 px-4 hover:bg-th-bkg-2"
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
                      className="col-span-1 w-full rounded-lg rounded-l-none border border-th-bkg-4 bg-th-bkg-1 p-3 text-right text-xl font-bold tracking-wider text-th-fgd-1 focus:outline-none"
                      type="text"
                      name="deposit"
                      id="deposit"
                      placeholder="0.00"
                      value={depositAmount}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setDepositAmount(e.target.value)
                      }
                    />
                  </div>
                </FadeInFadeOut>
                {!depositToken ? (
                  <div className="absolute top-10 mt-2 h-56 w-full overflow-auto">
                    <div className="flex px-4 pb-2">
                      <div className="w-1/5">
                        <p className="text-xs">{t('token')}</p>
                      </div>
                      <div className="w-2/5 text-right">
                        <p className="text-xs">{t('deposit-rate')}</p>
                      </div>
                      <div className="w-2/5 text-right">
                        <p className="whitespace-nowrap text-xs">
                          {t('wallet-balance')}
                        </p>
                      </div>
                    </div>
                    <ActionTokenList
                      banks={banks}
                      onSelect={setDepositToken}
                      showDepositRates
                      sortByKey="walletBalance"
                    />
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col items-center">
                <Button
                  className="mb-4 w-full"
                  disabled={!depositAmount || !depositToken}
                  onClick={handleDeposit}
                  size="large"
                >
                  Deposit
                </Button>
                <LinkButton onClick={handleEndOnboarding}>
                  Skip for now
                </LinkButton>
              </div>
            </div>
          )}
        </EnterRightExitLeft>
      </div>
    </Modal>
  )
}

export default UserSetupModal
