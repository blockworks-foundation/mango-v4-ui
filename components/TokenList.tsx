import { Bank, MangoAccount } from '@blockworks-foundation/mango-v4'
import { Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
// import useLocalStorageState from '../hooks/useLocalStorageState'
import { useViewport } from '../hooks/useViewport'

import mangoStore from '@store/mangoStore'
import { COLORS } from '../styles/colors'
// import { SHOW_ZERO_BALANCES_KEY } from '../utils/constants'
import { formatDecimal, formatFixedDecimals } from '../utils/numbers'
import { breakpoints } from '../utils/theme'
import Switch from './forms/Switch'
import BorrowModal from './modals/BorrowModal'
import DepositModal from './modals/DepositModal'
import WithdrawModal from './modals/WithdrawModal'
import { IconButton, LinkButton } from './shared/Button'
import ContentBox from './shared/ContentBox'
import IconDropMenu from './shared/IconDropMenu'
import PercentageChange from './shared/PercentageChange'
import SimpleAreaChart from './shared/SimpleAreaChart'
import Tooltip from './shared/Tooltip'
import { formatTokenSymbol } from 'utils/tokens'

const TokenList = () => {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const [showZeroBalances, setShowZeroBalances] = useState(true)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const coingeckoPrices = mangoStore((s) => s.coingeckoPrices.data)
  const loadingCoingeckoPrices = mangoStore((s) => s.coingeckoPrices.loading)
  const group = mangoStore((s) => s.group)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.stats.interestTotals.data
  )
  const { theme } = useTheme()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const banks = useMemo(() => {
    if (group) {
      const rawBanks = Array.from(group?.banksMapByName, ([key, value]) => ({
        key,
        value,
      }))
      const sortedBanks = mangoAccount
        ? rawBanks.sort(
            (a, b) =>
              Math.abs(
                mangoAccount?.getTokenBalanceUi(b.value[0]) *
                  b.value[0].uiPrice!
              ) -
              Math.abs(
                mangoAccount?.getTokenBalanceUi(a.value[0]) *
                  a.value[0].uiPrice!
              )
          )
        : rawBanks

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

  return (
    <ContentBox hideBorder hidePadding className="-mt-[36px]">
      <div className="mb-5 flex items-center justify-end pr-6">
        <Switch
          className="text-th-fgd-3"
          checked={showZeroBalances}
          disabled={!mangoAccount}
          onChange={() => setShowZeroBalances(!showZeroBalances)}
        >
          {t('show-zero-balances')}
        </Switch>
      </div>
      {showTableView ? (
        <table className="-mt-1 min-w-full">
          <thead>
            <tr>
              <th className="text-left">{t('token')}</th>
              <th>
                <div className="flex justify-end">
                  <Tooltip content="If your balance is negative, you have a borrow for that token, of that amount.">
                    <span className="tooltip-underline">{t('balance')}</span>
                  </Tooltip>
                </div>
              </th>
              <th className="text-right" id="account-step-eight">
                <Tooltip content="The sum of interest earned and interest paid for each token.">
                  <span className="tooltip-underline">
                    {t('interest-earned-paid')}
                  </span>
                </Tooltip>
              </th>
              <th className="text-right" id="account-step-nine">
                <Tooltip content="The interest rates (per year) for depositing (green/left) and borrowing (red/right).">
                  <span className="tooltip-underline">{t('rates')}</span>
                </Tooltip>
              </th>
              <th className="text-right">{t('price')}</th>
              <th className="hidden text-right lg:block"></th>
              <th className="text-right">{t('rolling-change')}</th>
            </tr>
          </thead>
          <tbody>
            {banks.map(({ key, value }, i) => {
              const bank = value[0]
              const oraclePrice = bank.uiPrice

              const coingeckoData = coingeckoPrices.find((asset) =>
                key === 'soETH' ? asset.symbol === 'ETH' : asset.symbol === key
              )

              const change = coingeckoData
                ? ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
                    coingeckoData.prices[0][1]) /
                    coingeckoData.prices[0][1]) *
                  100
                : 0

              const chartData = coingeckoData ? coingeckoData.prices : undefined

              let logoURI
              if (jupiterTokens.length) {
                logoURI = jupiterTokens.find(
                  (t) => t.address === bank.mint.toString()
                )!.logoURI
              }

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

              return (
                <tr key={key}>
                  <td>
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
                  </td>
                  <td className="pt-4 text-right">
                    <p>
                      {mangoAccount
                        ? formatDecimal(
                            mangoAccount.getTokenBalanceUi(bank),
                            bank.mintDecimals
                          )
                        : 0}
                    </p>
                    <p className="text-sm text-th-fgd-4">
                      {mangoAccount
                        ? `${formatFixedDecimals(
                            mangoAccount.getTokenBalanceUi(bank) * oraclePrice!,
                            true
                          )}`
                        : '$0.00'}
                    </p>
                  </td>
                  <td>
                    <div className="flex flex-col text-right">
                      <p>{formatDecimal(interestAmount)}</p>
                      <p className="text-sm text-th-fgd-4">
                        {formatFixedDecimals(interestValue, true)}
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="flex justify-end space-x-2">
                      <p className="text-th-green">
                        {formatDecimal(bank.getDepositRateUi(), 2, {
                          fixed: true,
                        })}
                        %
                      </p>
                      <span className="text-th-fgd-4">|</span>
                      <p className="text-th-red">
                        {formatDecimal(bank.getBorrowRateUi(), 2, {
                          fixed: true,
                        })}
                        %
                      </p>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col text-right">
                      <p>{formatFixedDecimals(oraclePrice!, true)}</p>
                    </div>
                  </td>
                  <td className="hidden lg:table-cell">
                    {!loadingCoingeckoPrices ? (
                      chartData !== undefined ? (
                        <SimpleAreaChart
                          color={
                            change >= 0
                              ? COLORS.GREEN[theme]
                              : COLORS.RED[theme]
                          }
                          data={chartData}
                          height={40}
                          name={key}
                          width={104}
                          xKey="0"
                          yKey="1"
                        />
                      ) : key === 'USDC' || key === 'USDT' ? null : (
                        <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                      )
                    ) : (
                      <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col items-end">
                      <PercentageChange change={change} />
                    </div>
                  </td>
                  <td>
                    <div
                      className="flex justify-end space-x-2"
                      id={i === 0 ? 'account-step-ten' : ''}
                    >
                      <ActionsMenu bank={bank} mangoAccount={mangoAccount} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
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
  const { t } = useTranslation('common')
  const [showTokenDetails, setShowTokenDetails] = useState(false)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const coingeckoPrices = mangoStore((s) => s.coingeckoPrices.data)
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.stats.interestTotals.data
  )
  const symbol = bank.name
  const oraclePrice = bank.uiPrice

  const coingeckoData = coingeckoPrices.find((asset) =>
    symbol === 'soETH' ? asset.symbol === 'ETH' : asset.symbol === symbol
  )

  const change = coingeckoData
    ? ((coingeckoData.prices[coingeckoData.prices.length - 1][1] -
        coingeckoData.prices[0][1]) /
        coingeckoData.prices[0][1]) *
      100
    : 0

  let logoURI
  if (jupiterTokens.length) {
    logoURI = jupiterTokens.find(
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
              {mangoAccount
                ? formatDecimal(mangoAccount.getTokenBalanceUi(bank))
                : 0}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ActionsMenu bank={bank} mangoAccount={mangoAccount} />
          <IconButton onClick={() => setShowTokenDetails((prev) => !prev)}>
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
            <p className="text-xs text-th-fgd-3">{t('interest-earned-paid')}</p>
            <div className="flex">
              <p>{formatDecimal(interestAmount)}</p>
              <p className="ml-1 text-th-fgd-4">
                ({formatFixedDecimals(interestValue, true)})
              </p>
            </div>
          </div>
          <div className="col-span-1">
            <p className="text-xs text-th-fgd-3">{t('rates')}</p>
            <p className="space-x-2">
              <span className="text-th-green">
                {formatDecimal(bank.getDepositRate().toNumber(), 2)}%
              </span>
              <span className="font-normal text-th-fgd-4">|</span>
              <span className="text-th-red">
                {formatDecimal(bank.getBorrowRate().toNumber(), 2)}%
              </span>
            </p>
          </div>
          <div className="col-span-1">
            <p className="text-xs text-th-fgd-3">{t('price')}</p>
            <p>{formatFixedDecimals(oraclePrice!, true)}</p>
          </div>
          <div className="col-span-1">
            <p className="text-xs text-th-fgd-3">{t('rolling-change')}</p>
            <PercentageChange change={change} />
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
  const [selectedToken, setSelectedToken] = useState('')
  const set = mangoStore.getState().set
  const router = useRouter()
  const { asPath } = router
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  const handleShowActionModals = useCallback(
    (token: string, action: 'borrow' | 'deposit' | 'withdraw') => {
      setSelectedToken(token)
      action === 'borrow'
        ? setShowBorrowModal(true)
        : action === 'deposit'
        ? setShowDepositModal(true)
        : setShowWithdrawModal(true)
    },
    []
  )

  const handleBuy = useCallback(() => {
    const outputTokenInfo = jupiterTokens.find(
      (t: any) => t.address === bank.mint.toString()
    )
    set((s) => {
      s.swap.outputBank = bank
      s.swap.outputTokenInfo = outputTokenInfo
    })
    if (asPath === '/') {
      router.push('/swap', undefined, { shallow: true })
    }
  }, [bank, router, asPath, set, jupiterTokens])

  const handleSell = useCallback(() => {
    const inputTokenInfo = jupiterTokens.find(
      (t: any) => t.address === bank.mint.toString()
    )
    set((s) => {
      s.swap.inputBank = bank
      s.swap.inputTokenInfo = inputTokenInfo
    })
    if (asPath === '/') {
      router.push('/swap', undefined, { shallow: true })
    }
  }, [router, asPath, set, bank, jupiterTokens])

  const logoURI = useMemo(() => {
    if (!bank || !jupiterTokens.length) return ''
    return jupiterTokens.find((t) => t.address === bank.mint.toString())
      ?.logoURI
  }, [bank, jupiterTokens])

  return (
    <>
      <IconDropMenu
        icon={<EllipsisHorizontalIcon className="h-5 w-5" />}
        postion="leftBottom"
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
          className="w-full text-left"
          disabled={!mangoAccount}
          onClick={() => handleShowActionModals(bank.name, 'deposit')}
        >
          {t('deposit')}
        </LinkButton>
        <LinkButton
          className="w-full text-left"
          disabled={!mangoAccount}
          onClick={() => handleShowActionModals(bank.name, 'withdraw')}
        >
          {t('withdraw')}
        </LinkButton>
        <LinkButton
          className="w-full text-left"
          disabled={!mangoAccount}
          onClick={() => handleShowActionModals(bank.name, 'borrow')}
        >
          {t('borrow')}
        </LinkButton>
        <LinkButton
          className="w-full text-left"
          disabled={!mangoAccount}
          onClick={handleBuy}
        >
          {t('buy')}
        </LinkButton>
        <LinkButton
          className="w-full text-left"
          disabled={!mangoAccount}
          onClick={handleSell}
        >
          {t('sell')}
        </LinkButton>
      </IconDropMenu>
      {showDepositModal ? (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          token={selectedToken}
        />
      ) : null}
      {showWithdrawModal ? (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          token={selectedToken}
        />
      ) : null}
      {showBorrowModal ? (
        <BorrowModal
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
          token={selectedToken}
        />
      ) : null}
    </>
  )
}
