import { Bank, MangoAccount } from '@blockworks-foundation/mango-v4'
import { Transition } from '@headlessui/react'
import {
  ChevronDownIcon,
  DotsHorizontalIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { useViewport } from '../hooks/useViewport'

import mangoStore from '../store/state'
import { COLORS } from '../styles/colors'
import { formatDecimal, formatFixedDecimals } from '../utils/numbers'
import { breakpoints } from '../utils/theme'
import Switch from './forms/Switch'
import BorrowModal from './modals/BorrowModal'
import DepositModal from './modals/DepositModal'
import WithdrawModal from './modals/WithdrawModal'
import { IconButton, LinkButton } from './shared/Button'
import ContentBox from './shared/ContentBox'
import { UpTriangle } from './shared/DirectionTriangles'
import IconDropMenu from './shared/IconDropMenu'
import SimpleAreaChart from './shared/SimpleAreaChart'
import { FadeInList } from './shared/Transitions'

const TokenList = () => {
  const { t } = useTranslation('common')
  const { connected } = useWallet()
  const [showTokenDetails, setShowTokenDetails] = useState('')
  const [showZeroBalances, setShowZeroBalances] = useState(true)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const coingeckoPrices = mangoStore((s) => s.coingeckoPrices.data)
  const loadingCoingeckoPrices = mangoStore((s) => s.coingeckoPrices.loading)
  const actions = mangoStore((s) => s.actions)
  const group = mangoStore((s) => s.group)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const totalInterestData = mangoStore(
    (s) => s.mangoAccount.stats.interestTotals.data
  )
  const { theme } = useTheme()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  useEffect(() => {
    if (coingeckoPrices.length === 0) {
      actions.fetchCoingeckoPrices()
    }
  }, [coingeckoPrices, actions])

  const banks = useMemo(() => {
    if (group?.banksMap) {
      const rawBanks = Array.from(group?.banksMap, ([key, value]) => ({
        key,
        value,
      }))
      return mangoAccount
        ? showZeroBalances
          ? rawBanks.sort(
              (a, b) =>
                Math.abs(mangoAccount?.getUi(b.value) * Number(b.value.price)) -
                Math.abs(mangoAccount?.getUi(a.value) * Number(a.value.price))
            )
          : rawBanks
              .filter((b) => mangoAccount?.getUi(b.value) !== 0)
              .sort(
                (a, b) =>
                  Math.abs(
                    mangoAccount?.getUi(b.value) * Number(b.value.price)
                  ) -
                  Math.abs(mangoAccount?.getUi(a.value) * Number(a.value.price))
              )
        : rawBanks
    }
    return []
  }, [showZeroBalances, group, mangoAccount])

  useEffect(() => {
    if (!connected) {
      setShowZeroBalances(true)
    }
  }, [connected])

  const handleShowTokenDetails = (name: string) => {
    showTokenDetails ? setShowTokenDetails('') : setShowTokenDetails(name)
  }

  return (
    <ContentBox hideBorder hidePadding className="mt-0 md:-mt-10">
      <div className="mb-6 flex items-center justify-end">
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
              <th className="w-[16.67%] text-left">{t('token')}</th>
              <th className="w-[16.67%] text-right">{t('price')}</th>
              <th className="className='hidden lg:block' w-[16.67%] text-right"></th>
              <th className="w-[16.67%] text-center">{t('rates')}</th>
              <th className="w-[16.67%] text-right">{t('interest-earned')}</th>
              <th className="w-[16.67%] text-right">
                {t('available-balance')}
              </th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank, index) => {
              const oraclePrice = bank.value.price

              const coingeckoData = coingeckoPrices.find(
                (asset) => asset.symbol === bank.key
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
                  (t) => t.address === bank.value.mint.toString()
                )!.logoURI
              }

              const hasInterestEarned = totalInterestData.find(
                (d) => d.symbol === bank.value.name
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
                <tr key={bank.key}>
                  <td className="w-[16.67%]">
                    <div className="flex items-center">
                      <div className="mr-2.5 flex flex-shrink-0 items-center">
                        {logoURI ? (
                          <Image alt="" width="24" height="24" src={logoURI} />
                        ) : (
                          <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
                        )}
                      </div>
                      <p>{bank.value.name}</p>
                    </div>
                  </td>
                  <td className="w-[16.67%]">
                    <div className="flex flex-col text-right">
                      <p>{formatFixedDecimals(oraclePrice.toNumber(), true)}</p>
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
                          name={bank.key}
                          width={104}
                          xKey="0"
                          yKey="1"
                        />
                      ) : bank.key === 'USDC' || bank.key === 'USDT' ? null : (
                        <p className="mb-0 text-th-fgd-4">{t('unavailable')}</p>
                      )
                    ) : (
                      <div className="h-10 w-[104px] animate-pulse rounded bg-th-bkg-3" />
                    )}
                  </td>
                  <td className="w-[16.67%]">
                    <div className="flex justify-center space-x-2">
                      <p className="text-th-green">
                        {formatDecimal(
                          bank.value.getDepositRate().toNumber(),
                          2,
                          { fixed: true }
                        )}
                        %
                      </p>
                      <span className="text-th-fgd-4">|</span>
                      <p className="text-th-red">
                        {formatDecimal(
                          bank.value.getBorrowRate().toNumber(),
                          2,
                          { fixed: true }
                        )}
                        %
                      </p>
                    </div>
                  </td>
                  <td className="w-[16.67%]">
                    <div className="flex flex-col text-right">
                      <p>{formatDecimal(interestAmount)}</p>
                      <p className="text-sm text-th-fgd-4">
                        {formatFixedDecimals(interestValue, true)}
                      </p>
                    </div>
                  </td>
                  <td className="w-[16.67%] pt-4 text-right">
                    <p className="px-2">
                      {mangoAccount
                        ? formatDecimal(mangoAccount.getUi(bank.value))
                        : 0}
                    </p>
                    <p className="px-2 text-sm text-th-fgd-4">
                      {mangoAccount
                        ? `${formatFixedDecimals(
                            mangoAccount.getUi(bank.value) *
                              oraclePrice.toNumber(),
                            true
                          )}`
                        : '$0.00'}
                    </p>
                  </td>
                  <td className="w-[16.67%]">
                    <div className="flex justify-end space-x-2">
                      <ActionsMenu
                        bank={bank.value}
                        mangoAccount={mangoAccount}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <div className="mt-4 space-y-2">
          {banks.map((bank) => {
            const oraclePrice = bank.value.price
            let logoURI
            if (jupiterTokens.length) {
              logoURI = jupiterTokens.find(
                (t) => t.address === bank.value.mint.toString()
              )!.logoURI
            }
            return (
              <div
                key={bank.key}
                className="rounded-md border border-th-bkg-4 p-4"
              >
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
                      <p>{bank.value.name}</p>
                      <p className="text-sm">
                        <span className="mr-1 text-th-fgd-4">
                          {t('available')}:
                        </span>
                        {mangoAccount
                          ? formatDecimal(mangoAccount.getUi(bank.value))
                          : 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <ActionsMenu
                      bank={bank.value}
                      mangoAccount={mangoAccount}
                    />
                    <IconButton
                      onClick={() => handleShowTokenDetails(bank.value.name)}
                    >
                      <ChevronDownIcon
                        className={`${
                          showTokenDetails === bank.value.name
                            ? 'rotate-180 transform'
                            : 'rotate-360 transform'
                        } default-transition h-6 w-6 flex-shrink-0 text-th-fgd-1`}
                      />
                    </IconButton>
                  </div>
                </div>
                <Transition
                  appear={true}
                  show={showTokenDetails === bank.value.name}
                  as={Fragment}
                  enter="transition-all ease-in duration-200"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition ease-out"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="mt-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pt-4">
                    <div className="col-span-1">
                      <p className="text-xs text-th-fgd-3">{t('price')}</p>
                      <p className="font-bold">
                        ${formatDecimal(oraclePrice.toNumber(), 2)}
                      </p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-th-fgd-3">
                        {t('rolling-change')}
                      </p>
                      <div className="flex items-center">
                        <UpTriangle />
                        <p className="ml-1 font-bold text-th-green">0%</p>
                      </div>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-th-fgd-3">{t('rates')}</p>
                      <p className="space-x-2 font-bold">
                        <span className="text-th-green">
                          {formatDecimal(
                            bank.value.getDepositRate().toNumber(),
                            2
                          )}
                          %
                        </span>
                        <span className="font-normal text-th-fgd-4">|</span>
                        <span className="text-th-red">
                          {formatDecimal(
                            bank.value.getBorrowRate().toNumber(),
                            2
                          )}
                          %
                        </span>
                      </p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-th-fgd-3">{t('liquidity')}</p>
                      <p className="font-bold">
                        {formatDecimal(
                          bank.value.uiDeposits() - bank.value.uiBorrows(),
                          bank.value.mintDecimals
                        )}
                      </p>
                    </div>
                  </div>
                </Transition>
              </div>
            )
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default TokenList

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

  const handleShowActionModals = (
    token: string,
    action: 'borrow' | 'deposit' | 'withdraw'
  ) => {
    setSelectedToken(token)
    action === 'borrow'
      ? setShowBorrowModal(true)
      : action === 'deposit'
      ? setShowDepositModal(true)
      : setShowWithdrawModal(true)
  }

  const handleBuy = () => {
    set((s) => {
      s.swap.inputToken = 'USDC'
      s.swap.outputToken = bank.name
    })
    if (asPath === '/') {
      router.push('/trade', undefined, { shallow: true })
    }
  }

  const handleSell = () => {
    set((s) => {
      s.swap.inputToken = bank.name
      s.swap.outputToken = 'USDC'
    })
    if (asPath === '/') {
      router.push('/trade', undefined, { shallow: true })
    }
  }

  return (
    <>
      <IconDropMenu
        icon={<DotsHorizontalIcon className="h-5 w-5" />}
        postion="leftBottom"
      >
        <div className="flex items-center justify-center border-b border-th-bkg-3 pb-2">
          <div className="mr-2 flex flex-shrink-0 items-center">
            <Image
              alt=""
              width="20"
              height="20"
              src={`/icons/${bank.name.toLowerCase()}.svg`}
            />
          </div>
          <p>{bank.name}</p>
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
          onClick={() => handleBuy()}
        >
          {t('buy')}
        </LinkButton>
        <LinkButton
          className="w-full text-left"
          disabled={!mangoAccount}
          onClick={() => handleSell()}
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
