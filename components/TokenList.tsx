import { Bank, MangoAccount } from '@blockworks-foundation/mango-v4'
import { Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useViewport } from '../hooks/useViewport'
import mangoStore from '@store/mangoStore'
import {
  floorToDecimal,
  formatDecimal,
  formatFixedDecimals,
} from '../utils/numbers'
import { breakpoints } from '../utils/theme'
import Switch from './forms/Switch'
import { IconButton, LinkButton } from './shared/Button'
import ContentBox from './shared/ContentBox'
import IconDropMenu from './shared/IconDropMenu'
import Tooltip from './shared/Tooltip'
import { formatTokenSymbol } from 'utils/tokens'
import useMangoAccount from 'hooks/useMangoAccount'
import useJupiterMints from '../hooks/useJupiterMints'
import { Table, Td, Th, TrBody, TrHead } from './shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import DepositWithdrawModal from './modals/DepositWithdrawModal'
import BorrowRepayModal from './modals/BorrowRepayModal'
import { WRAPPED_SOL_MINT } from '@project-serum/serum/lib/token-instructions'
import { USDC_MINT } from 'utils/constants'
import { PublicKey } from '@solana/web3.js'

const TokenList = () => {
  const { t } = useTranslation(['common', 'token', 'trade'])
  const { connected } = useWallet()
  const [showZeroBalances, setShowZeroBalances] = useState(true)
  const { mangoAccount } = useMangoAccount()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.stats.interestTotals.data
  )
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const router = useRouter()

  const banks = useMemo(() => {
    if (group) {
      const rawBanks = Array.from(group?.banksMapByName, ([key, value]) => ({
        key,
        value,
      }))
      const sortedBanks = mangoAccount
        ? rawBanks.sort((a, b) => {
            const aBalance = Math.abs(
              mangoAccount.getTokenBalanceUi(a.value[0]) * a.value[0].uiPrice
            )
            const bBalance = Math.abs(
              mangoAccount.getTokenBalanceUi(b.value[0]) * b.value[0].uiPrice
            )
            if (aBalance > bBalance) return -1
            if (aBalance < bBalance) return 1

            const aName = a.value[0].name
            const bName = b.value[0].name
            if (aName > bName) return 1
            if (aName < bName) return -1
            return 1
          })
        : rawBanks.sort((a, b) => a.key.localeCompare(b.key))

      return mangoAccount && !showZeroBalances
        ? sortedBanks.filter(
            (b) => mangoAccount?.getTokenBalanceUi(b.value[0]) !== 0
          )
        : sortedBanks
    }
    return []
  }, [showZeroBalances, group, mangoAccount])

  useEffect(() => {
    if (!connected) {
      setShowZeroBalances(true)
    }
  }, [connected])

  const goToTokenPage = (bank: Bank) => {
    router.push(`/token/${bank.name}`, undefined, { shallow: true })
  }

  return (
    <ContentBox hideBorder hidePadding className="md:-mt-[36px]">
      <div className="flex items-center justify-end md:mb-4">
        <div className="flex w-full items-center justify-between border-b border-th-bkg-3 py-3 px-6 md:w-auto md:border-0 md:py-0">
          {!showTableView ? <p>{t('show-zero-balances')}</p> : null}
          <Switch
            className="text-th-fgd-3"
            checked={showZeroBalances}
            disabled={!mangoAccount}
            onChange={() => setShowZeroBalances(!showZeroBalances)}
          >
            {showTableView ? t('show-zero-balances') : ''}
          </Switch>
        </div>
      </div>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('token')}</Th>
              <Th>
                <div className="flex justify-end">
                  <Tooltip content="If your balance is negative, you have a borrow for that token, of that amount.">
                    <span className="tooltip-underline">{t('balance')}</span>
                  </Tooltip>
                </div>
              </Th>
              <Th className="bg-th-bkg-1 text-right">{t('trade:in-orders')}</Th>
              <Th className="bg-th-bkg-1 text-right">{t('trade:unsettled')}</Th>
              <Th className="flex justify-end" id="account-step-nine">
                <Tooltip content="The sum of interest earned and interest paid for each token.">
                  <span className="tooltip-underline">
                    {t('interest-earned-paid')}
                  </span>
                </Tooltip>
              </Th>
              <Th id="account-step-ten">
                <div className="flex justify-end">
                  <Tooltip content="The interest rates for depositing (green/left) and borrowing (red/right).">
                    <span className="tooltip-underline">{t('rates')}</span>
                  </Tooltip>
                </div>
              </Th>
            </TrHead>
          </thead>
          <tbody>
            {banks.map(({ key, value }) => {
              const bank = value[0]
              const oraclePrice = bank.uiPrice

              let logoURI
              if (mangoTokens?.length) {
                logoURI = mangoTokens.find(
                  (t) => t.address === bank.mint.toString()
                )?.logoURI
              }

              const tokenBalance = mangoAccount
                ? floorToDecimal(
                    mangoAccount.getTokenBalanceUi(bank),
                    bank.mintDecimals
                  ).toNumber()
                : 0

              const hasInterestEarned = totalInterestData.find(
                (d) => d.symbol === bank.name
              )

              const interestAmount = hasInterestEarned
                ? hasInterestEarned.borrow_interest +
                  hasInterestEarned.deposit_interest
                : 0

              const interestValue = hasInterestEarned
                ? hasInterestEarned.borrow_interest_usd +
                  hasInterestEarned.deposit_interest_usd
                : 0.0

              const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0

              const unsettled =
                spotBalances[bank.mint.toString()]?.unsettled || 0

              return (
                <TrBody key={key}>
                  <Td>
                    <div className="flex items-center">
                      <div className="mr-2.5 flex flex-shrink-0 items-center">
                        {logoURI ? (
                          <Image alt="" width="24" height="24" src={logoURI} />
                        ) : (
                          <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
                        )}
                      </div>
                      <p className="font-body tracking-wide">{bank.name}</p>
                    </div>
                  </Td>
                  <Td className="text-right">
                    <p>{tokenBalance}</p>
                    <p className="text-sm text-th-fgd-4">
                      {tokenBalance
                        ? `${formatFixedDecimals(
                            tokenBalance * oraclePrice!,
                            true
                          )}`
                        : '$0.00'}
                    </p>
                  </Td>
                  <Td className="text-right">
                    <p>{inOrders}</p>
                    <p className="text-sm text-th-fgd-4">
                      {formatFixedDecimals(inOrders * oraclePrice!, true)}
                    </p>
                  </Td>
                  <Td className="text-right">
                    <p>
                      {unsettled ? unsettled.toFixed(bank.mintDecimals) : 0}
                    </p>
                    <p className="text-sm text-th-fgd-4">
                      {formatFixedDecimals(unsettled * oraclePrice!, true)}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex flex-col text-right">
                      <p>
                        {interestAmount
                          ? interestAmount.toFixed(bank.mintDecimals)
                          : 0}
                      </p>
                      <p className="text-sm text-th-fgd-4">
                        {formatFixedDecimals(interestValue, true)}
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end space-x-2">
                      <p className="text-th-up">
                        {formatDecimal(bank.getDepositRateUi(), 2, {
                          fixed: true,
                        })}
                        %
                      </p>
                      <span className="text-th-fgd-4">|</span>
                      <p className="text-th-down">
                        {formatDecimal(bank.getBorrowRateUi(), 2, {
                          fixed: true,
                        })}
                        %
                      </p>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end space-x-2">
                      <ActionsMenu bank={bank} mangoAccount={mangoAccount} />
                      <IconButton
                        onClick={() => goToTokenPage(bank)}
                        size="small"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  </Td>
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <div>
          {banks.map(({ key, value }) => {
            return <MobileTokenListItem key={key} bank={value[0]} />
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default TokenList

const MobileTokenListItem = ({ bank }: { bank: Bank }) => {
  const { t } = useTranslation(['common', 'token'])
  const [showTokenDetails, setShowTokenDetails] = useState(false)
  const { mangoTokens } = useJupiterMints()
  const spotBalances = mangoStore((s) => s.mangoAccount.spotBalances)
  const { mangoAccount } = useMangoAccount()
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.stats.interestTotals.data
  )
  const symbol = bank.name
  const oraclePrice = bank.uiPrice
  const router = useRouter()

  let logoURI
  if (mangoTokens?.length) {
    logoURI = mangoTokens.find(
      (t) => t.address === bank.mint.toString()
    )!.logoURI
  }

  const hasInterestEarned = totalInterestData.find(
    (d) => d.symbol === bank.name
  )

  const interestAmount = hasInterestEarned
    ? hasInterestEarned.borrow_interest + hasInterestEarned.deposit_interest
    : 0

  const interestValue = hasInterestEarned
    ? hasInterestEarned.borrow_interest_usd +
      hasInterestEarned.deposit_interest_usd
    : 0.0

  const tokenBalance = mangoAccount
    ? floorToDecimal(
        mangoAccount.getTokenBalanceUi(bank),
        bank.mintDecimals
      ).toNumber()
    : 0

  const inOrders = spotBalances[bank.mint.toString()]?.inOrders || 0

  const unsettled = spotBalances[bank.mint.toString()]?.unsettled || 0

  const goToTokenPage = (bank: Bank) => {
    router.push(`/token/${bank.name}`, undefined, { shallow: true })
  }

  return (
    <div key={symbol} className="border-b border-th-bkg-3 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-2.5 flex flex-shrink-0 items-center">
            {logoURI ? (
              <Image alt="" width="24" height="24" src={logoURI} />
            ) : (
              <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
            )}
          </div>
          <div>
            <p className="text-th-fgd-1">{bank.name}</p>
            <p className="font-mono text-sm text-th-fgd-1">
              <span className="mr-1 font-body text-th-fgd-4">
                {t('balance')}:
              </span>
              {tokenBalance}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ActionsMenu bank={bank} mangoAccount={mangoAccount} />
          <IconButton
            onClick={() => setShowTokenDetails((prev) => !prev)}
            size="small"
          >
            <ChevronDownIcon
              className={`${
                showTokenDetails ? 'rotate-180' : 'rotate-360'
              } h-6 w-6 flex-shrink-0 text-th-fgd-1`}
            />
          </IconButton>
        </div>
      </div>
      <Transition
        appear={true}
        show={showTokenDetails}
        as={Fragment}
        enter="transition ease-in duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition ease-out"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pt-4">
          <div className="col-span-1">
            <p className="text-xs text-th-fgd-3">{t('trade:in-orders')}</p>
            <div className="flex font-mono">
              <p className="text-th-fgd-2">{inOrders}</p>
              <p className="ml-1 text-th-fgd-4">
                ({formatFixedDecimals(inOrders * oraclePrice!, true)})
              </p>
            </div>
          </div>
          <div className="col-span-1">
            <p className="text-xs text-th-fgd-3">{t('trade:unsettled')}</p>
            <div className="flex font-mono">
              <p className="text-th-fgd-2">
                {unsettled ? unsettled.toFixed(bank.mintDecimals) : 0}
              </p>
              <p className="ml-1 text-th-fgd-4">
                ({formatFixedDecimals(unsettled * oraclePrice!, true)})
              </p>
            </div>
          </div>
          <div className="col-span-1">
            <p className="text-xs text-th-fgd-3">{t('interest-earned-paid')}</p>
            <div className="flex font-mono">
              <p className="text-th-fgd-2">
                {floorToDecimal(interestAmount, bank.mintDecimals).toNumber()}
              </p>
              <p className="ml-1 text-th-fgd-4">
                ({formatFixedDecimals(interestValue, true)})
              </p>
            </div>
          </div>
          <div className="col-span-1">
            <p className="text-xs text-th-fgd-3">{t('rates')}</p>
            <p className="space-x-2 font-mono">
              <span className="text-th-up">
                {formatDecimal(bank.getDepositRate().toNumber(), 2)}%
              </span>
              <span className="font-normal text-th-fgd-4">|</span>
              <span className="text-th-down">
                {formatDecimal(bank.getBorrowRate().toNumber(), 2)}%
              </span>
            </p>
          </div>
          <div className="col-span-1">
            <LinkButton
              className="flex items-center"
              onClick={() => goToTokenPage(bank)}
            >
              {t('token:token-details')}
              <ChevronRightIcon className="ml-2 h-5 w-5" />
            </LinkButton>
          </div>
        </div>
      </Transition>
    </div>
  )
}

const ActionsMenu = ({
  bank,
  mangoAccount,
}: {
  bank: Bank
  mangoAccount: MangoAccount | undefined
}) => {
  const { t } = useTranslation('common')
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showRepayModal, setShowRepayModal] = useState(false)
  const [selectedToken, setSelectedToken] = useState('')
  const set = mangoStore.getState().set
  const router = useRouter()
  const { query } = router
  const { mangoTokens } = useJupiterMints()
  const spotMarkets = mangoStore((s) => s.serumMarkets)
  const { connected } = useWallet()

  const spotMarket = useMemo(() => {
    return spotMarkets.find((m) => {
      const base = m.name.split('/')[0]
      return base.toUpperCase() === bank.name.toUpperCase()
    })
  }, [spotMarkets])

  const handleShowActionModals = useCallback(
    (token: string, action: 'borrow' | 'deposit' | 'withdraw' | 'repay') => {
      setSelectedToken(token)
      action === 'borrow'
        ? setShowBorrowModal(true)
        : action === 'deposit'
        ? setShowDepositModal(true)
        : action === 'withdraw'
        ? setShowWithdrawModal(true)
        : setShowRepayModal(true)
    },
    []
  )

  const balance = useMemo(() => {
    if (!mangoAccount || !bank) return 0
    return mangoAccount.getTokenBalanceUi(bank)
  }, [bank, mangoAccount])

  const handleSwap = useCallback(() => {
    const tokenInfo = mangoTokens.find(
      (t: any) => t.address === bank.mint.toString()
    )
    const group = mangoStore.getState().group
    if (balance && balance > 0) {
      if (tokenInfo?.symbol === 'SOL') {
        const usdcTokenInfo = mangoTokens.find(
          (t: any) => t.address === USDC_MINT
        )
        const usdcBank = group?.getFirstBankByMint(new PublicKey(USDC_MINT))
        set((s) => {
          s.swap.inputBank = usdcBank
          s.swap.inputTokenInfo = usdcTokenInfo
        })
      }
      set((s) => {
        s.swap.inputBank = bank
        s.swap.inputTokenInfo = tokenInfo
      })
    } else {
      if (tokenInfo?.symbol === 'USDC') {
        const solTokenInfo = mangoTokens.find(
          (t: any) => t.address === WRAPPED_SOL_MINT.toString()
        )
        const solBank = group?.getFirstBankByMint(WRAPPED_SOL_MINT)
        set((s) => {
          s.swap.inputBank = solBank
          s.swap.inputTokenInfo = solTokenInfo
        })
      }
      set((s) => {
        s.swap.outputBank = bank
        s.swap.outputTokenInfo = tokenInfo
      })
    }
    router.push('/swap', undefined, { shallow: true })
  }, [bank, router, set, mangoTokens, mangoAccount])

  const handleTrade = useCallback(() => {
    router.push(`/trade?name=${spotMarket?.name}`, undefined, { shallow: true })
  }, [spotMarket, router])

  const logoURI = useMemo(() => {
    if (!bank || !mangoTokens?.length) return ''
    return mangoTokens.find((t) => t.address === bank.mint.toString())?.logoURI
  }, [bank, mangoTokens])

  const hasBorrow = useMemo(() => {
    if (!mangoAccount || !bank) return false
    return (
      floorToDecimal(
        mangoAccount.getTokenBorrowsUi(bank),
        bank.mintDecimals
      ).toNumber() > 0
    )
  }, [mangoAccount, bank])

  return (
    <>
      <IconDropMenu
        icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
        postion="leftBottom"
        disabled={!!query?.address && !connected}
      >
        <div className="flex items-center justify-center border-b border-th-bkg-3 pb-2">
          <div className="mr-2 flex flex-shrink-0 items-center">
            <Image alt="" width="20" height="20" src={logoURI || ''} />
          </div>
          <p className="font-body tracking-wide">
            {formatTokenSymbol(bank.name)}
          </p>
        </div>
        <LinkButton
          className="w-full text-left font-normal no-underline md:hover:text-th-fgd-1"
          disabled={!mangoAccount}
          onClick={() => handleShowActionModals(bank.name, 'deposit')}
        >
          {t('deposit')}
        </LinkButton>
        {hasBorrow ? (
          <LinkButton
            className="w-full text-left font-normal no-underline md:hover:text-th-fgd-1"
            disabled={!mangoAccount}
            onClick={() => handleShowActionModals(bank.name, 'repay')}
          >
            {t('repay')}
          </LinkButton>
        ) : null}
        {balance && balance > 0 ? (
          <LinkButton
            className="w-full text-left font-normal no-underline md:hover:text-th-fgd-1"
            disabled={!mangoAccount}
            onClick={() => handleShowActionModals(bank.name, 'withdraw')}
          >
            {t('withdraw')}
          </LinkButton>
        ) : null}
        <LinkButton
          className="w-full text-left font-normal no-underline md:hover:text-th-fgd-1"
          disabled={!mangoAccount}
          onClick={() => handleShowActionModals(bank.name, 'borrow')}
        >
          {t('borrow')}
        </LinkButton>
        <LinkButton
          className="w-full text-left font-normal no-underline md:hover:text-th-fgd-1"
          disabled={!mangoAccount}
          onClick={handleSwap}
        >
          {t('swap')}
        </LinkButton>
        {spotMarket ? (
          <LinkButton
            className="w-full text-left font-normal no-underline md:hover:text-th-fgd-1"
            disabled={!mangoAccount}
            onClick={handleTrade}
          >
            {t('trade')}
          </LinkButton>
        ) : null}
      </IconDropMenu>
      {showDepositModal ? (
        <DepositWithdrawModal
          action="deposit"
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          token={selectedToken}
        />
      ) : null}
      {showWithdrawModal ? (
        <DepositWithdrawModal
          action="withdraw"
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          token={selectedToken}
        />
      ) : null}
      {showBorrowModal ? (
        <BorrowRepayModal
          action="borrow"
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
          token={selectedToken}
        />
      ) : null}
      {showRepayModal ? (
        <BorrowRepayModal
          action="repay"
          isOpen={showRepayModal}
          onClose={() => setShowRepayModal(false)}
          token={selectedToken}
        />
      ) : null}
    </>
  )
}
