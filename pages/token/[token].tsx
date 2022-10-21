import Change from '@components/shared/Change'
import DailyRange from '@components/shared/DailyRange'
import mangoStore from '@store/mangoStore'
import { fetchTokenInfo } from 'apis/coingecko'
import type { GetStaticPaths, NextPage } from 'next'
import { useTranslation } from 'next-i18next'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import FlipNumbers from 'react-flip-numbers'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Button, { IconButton, LinkButton } from '@components/shared/Button'
import { ArrowSmallUpIcon } from '@heroicons/react/20/solid'
import DepositModal from '@components/modals/DepositModal'
import BorrowModal from '@components/modals/BorrowModal'
import parse from 'html-react-parser'
import Link from 'next/link'
import SheenLoader from '@components/shared/SheenLoader'
import Tooltip from '@components/shared/Tooltip'
dayjs.extend(relativeTime)

export async function getStaticProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'token'])),
    },
  }
}

export const getStaticPaths: GetStaticPaths<{ slug: string }> = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

const DEFAULT_COINGECKO_VALUES = {
  ath: 0,
  atl: 0,
  ath_change_percentage: 0,
  atl_change_percentage: 0,
  ath_date: 0,
  atl_date: 0,
  high_24h: 0,
  circulating_supply: 0,
  fully_diluted_valuation: 0,
  low_24h: 0,
  market_cap: 0,
  max_supply: 0,
  price_change_percentage_24h: 0,
  total_supply: 0,
  total_volume: 0,
}

const Token: NextPage = () => {
  const { t } = useTranslation(['common', 'token'])
  const [showFullDesc, setShowFullDesc] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [coingeckoData, setCoingeckoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { token } = router.query
  const group = mangoStore((s) => s.group)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const jupiterTokens = mangoStore((s) => s.jupiterTokens)

  const bank = useMemo(() => {
    if (group && token) {
      const bank = group.banksMapByName.get(token.toString())
      if (bank) {
        return bank[0]
      } else {
        setLoading(false)
      }
    }
  }, [group, token])

  const logoURI = useMemo(() => {
    if (bank && jupiterTokens.length) {
      return jupiterTokens.find((t) => t.address === bank.mint.toString())
        ?.logoURI
    }
  }, [bank, jupiterTokens])

  const coingeckoId = useMemo(() => {
    if (bank && jupiterTokens.length) {
      return jupiterTokens.find((t) => t.address === bank.mint.toString())
        ?.extensions?.coingeckoId
    }
  }, [bank, jupiterTokens])

  const serumMarkets = useMemo(() => {
    if (group) {
      return Array.from(group.serum3MarketsMapByExternal.values())
    }
    return []
  }, [group])

  const handleTrade = () => {
    const set = mangoStore.getState().set
    const market = serumMarkets.find(
      (m) => m.baseTokenIndex === bank?.tokenIndex
    )
    if (market) {
      set((state) => {
        state.selectedMarket.current = market
      })
      router.push('/trade')
    }
  }

  const getCoingeckoData = async (id: string) => {
    const response = await fetchTokenInfo(id)
    setCoingeckoData(response)
    setLoading(false)
  }

  useEffect(() => {
    if (coingeckoId) {
      getCoingeckoData(coingeckoId)
    }
  }, [coingeckoId])

  const {
    ath,
    atl,
    ath_change_percentage,
    atl_change_percentage,
    ath_date,
    atl_date,
    high_24h,
    circulating_supply,
    fully_diluted_valuation,
    low_24h,
    market_cap,
    max_supply,
    price_change_percentage_24h,
    total_supply,
    total_volume,
  } = coingeckoData ? coingeckoData.market_data : DEFAULT_COINGECKO_VALUES

  return (
    <div className="pb-20 md:pb-16">
      {coingeckoData && bank ? (
        <>
          <div className="flex flex-col border-b border-th-bkg-3 px-6 py-3 md:flex-row md:items-end md:justify-between">
            <div className="mb-4 md:mb-1">
              <div className="mb-1.5 flex items-center space-x-2">
                <Image src={logoURI!} height="20" width="20" />
                <h1 className="text-lg font-normal">
                  {coingeckoData.name}{' '}
                  <span className="text-th-fgd-4">({bank.name})</span>
                </h1>
              </div>
              <div className="mb-2 flex items-end space-x-3 text-5xl font-bold text-th-fgd-1">
                $
                <FlipNumbers
                  height={48}
                  width={32}
                  play
                  delay={0.05}
                  duration={1}
                  numbers={formatDecimal(bank.uiPrice, 2)}
                />
                <Change change={price_change_percentage_24h} />
              </div>
              <DailyRange
                high={high_24h.usd}
                low={low_24h.usd}
                price={bank.uiPrice}
              />
            </div>
            <div className="mb-2 w-full rounded-md bg-th-bkg-2 p-4 md:w-[343px]">
              <div className="mb-4 flex justify-between">
                <p>
                  {bank.name} {t('balance')}:
                </p>
                <p className="font-mono text-th-fgd-2">
                  {mangoAccount
                    ? formatDecimal(
                        mangoAccount.getTokenBalanceUi(bank),
                        bank.mintDecimals
                      )
                    : 0}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  size="small"
                  disabled={!mangoAccount}
                  onClick={() => setShowDepositModal(true)}
                >
                  {t('deposit')}
                </Button>
                <Button
                  className="flex-1"
                  size="small"
                  secondary
                  disabled={!mangoAccount}
                  onClick={() => setShowBorrowModal(true)}
                >
                  {t('borrow')}
                </Button>
                <Button
                  className="flex-1"
                  size="small"
                  secondary
                  disabled={
                    !mangoAccount ||
                    !serumMarkets.find(
                      (m) => m.baseTokenIndex === bank?.tokenIndex
                    )
                  }
                  onClick={handleTrade}
                >
                  {t('trade')}
                </Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="col-span-1 border-b border-r border-th-bkg-3 px-6 py-4 sm:border-b-0">
              <h2 className="mb-4 text-base">{t('token:lending')}</h2>
              <div className="flex justify-between border-t border-th-bkg-3 py-4">
                <p>{t('total-deposits')}</p>
                <p className="font-mono text-th-fgd-2">
                  {formatFixedDecimals(bank.uiDeposits())}
                </p>
              </div>
              <div className="flex justify-between border-t border-th-bkg-3 py-4">
                <p>{t('token:total-value')}</p>
                <p className="font-mono text-th-fgd-2">
                  {formatFixedDecimals(bank.uiDeposits() * bank.uiPrice, true)}
                </p>
              </div>
              <div className="flex justify-between border-t border-th-bkg-3 pt-4">
                <p>{t('deposit-rate')}</p>
                <p className="font-mono text-th-green">
                  {formatDecimal(bank.getDepositRateUi(), 2, {
                    fixed: true,
                  })}
                  %
                </p>
              </div>
            </div>
            <div className="col-span-1 px-6 py-4">
              <h2 className="mb-4 text-base">{t('token:borrowing')}</h2>
              <div className="flex justify-between border-t border-th-bkg-3 py-4">
                <p>{t('total-borrows')}</p>
                <p className="font-mono text-th-fgd-2">
                  {formatFixedDecimals(bank.uiBorrows())}
                </p>
              </div>
              <div className="flex justify-between border-t border-th-bkg-3 py-4">
                <p>{t('token:total-value')}</p>
                <p className="font-mono text-th-fgd-2">
                  {formatFixedDecimals(bank.uiBorrows() * bank.uiPrice, true)}
                </p>
              </div>
              <div className="flex justify-between border-t border-th-bkg-3 pt-4">
                <p>{t('borrow-rate')}</p>
                <p className="font-mono text-th-red">
                  {formatDecimal(bank.getBorrowRateUi(), 2, {
                    fixed: true,
                  })}
                  %
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center border-y border-th-bkg-3 px-6 py-4 text-center">
            <Tooltip
              content={'The percentage of deposits that have been lent out.'}
            >
              <p className="tooltip-underline mr-1">{t('utilization')}:</p>
            </Tooltip>
            <span className="font-mono text-th-fgd-2 no-underline">
              {bank.uiDeposits() > 0
                ? formatDecimal(
                    (bank.uiBorrows() / bank.uiDeposits()) * 100,
                    1,
                    { fixed: true }
                  )
                : '0.0'}
              %
            </span>
          </div>
          <div className="border-b border-th-bkg-3 py-4 px-6">
            <h2 className="mb-1 text-xl">About {bank.name}</h2>
            <div className="flex items-end">
              <p
                className={`${
                  showFullDesc ? 'h-full' : 'h-5'
                } max-w-[720px] overflow-hidden`}
              >
                {parse(coingeckoData.description.en)}
              </p>
              <span
                className="default-transition flex cursor-pointer items-end font-normal underline hover:text-th-fgd-2 md:hover:no-underline"
                onClick={() => setShowFullDesc(!showFullDesc)}
              >
                {showFullDesc ? 'Less' : 'More'}
                <ArrowSmallUpIcon
                  className={`h-5 w-5 ${
                    showFullDesc ? 'rotate-360' : 'rotate-180'
                  } default-transition`}
                />
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 border-b border-th-bkg-3 sm:grid-cols-2">
            <div className="col-span-1 border-b border-th-bkg-3 px-6 py-4 sm:col-span-2">
              <h2 className="text-base">{bank.name} Stats</h2>
            </div>
            <div className="col-span-1 border-r border-th-bkg-3 px-6 py-4">
              <div className="flex justify-between pb-4">
                <p>{t('token:market-cap')}</p>
                <p className="font-mono text-th-fgd-2">
                  {formatFixedDecimals(market_cap.usd, true)}{' '}
                  <span className="text-th-fgd-4">
                    #{coingeckoData.market_cap_rank}
                  </span>
                </p>
              </div>
              <div className="flex justify-between border-t border-th-bkg-3 py-4">
                <p>{t('token:volume')}</p>
                <p className="font-mono text-th-fgd-2">
                  {formatFixedDecimals(total_volume.usd, true)}
                </p>
              </div>
              <div className="flex justify-between border-t border-th-bkg-3 py-4">
                <p>{t('token:all-time-high')}</p>
                <div className="flex flex-col items-end">
                  <div className="flex items-center font-mono text-th-fgd-2">
                    <span className="mr-2">
                      {formatFixedDecimals(ath.usd, true)}
                    </span>
                    <Change change={ath_change_percentage.usd} />
                  </div>
                  <p className="text-xs text-th-fgd-4">
                    {dayjs(ath_date.usd).format('MMM, D, YYYY')} (
                    {dayjs(ath_date.usd).fromNow()})
                  </p>
                </div>
              </div>
              <div className="flex justify-between border-b border-t border-th-bkg-3 py-4 sm:border-b-0 sm:pb-0">
                <p>{t('token:all-time-low')}</p>
                <div className="flex flex-col items-end">
                  <div className="flex items-center font-mono text-th-fgd-2">
                    <span className="mr-2">
                      {formatFixedDecimals(atl.usd, true)}
                    </span>
                    <Change change={atl_change_percentage.usd} />
                  </div>
                  <p className="text-xs text-th-fgd-4">
                    {dayjs(atl_date.usd).format('MMM, D, YYYY')} (
                    {dayjs(atl_date.usd).fromNow()})
                  </p>
                </div>
              </div>
            </div>
            <div className="col-span-1 px-6 pb-4 sm:pt-4">
              {fully_diluted_valuation.usd ? (
                <div className="flex justify-between pb-4">
                  <p>{t('token:fdv')}</p>
                  <p className="font-mono text-th-fgd-2">
                    {formatFixedDecimals(fully_diluted_valuation.usd, true)}
                  </p>
                </div>
              ) : null}
              <div
                className={`flex justify-between ${
                  fully_diluted_valuation.usd
                    ? 'border-t border-th-bkg-3 py-4'
                    : 'pb-4'
                }`}
              >
                <p>{t('token:circulating-supply')}</p>
                <p className="font-mono text-th-fgd-2">
                  {formatFixedDecimals(circulating_supply)}
                </p>
              </div>
              <div
                className={`flex justify-between border-t border-th-bkg-3 ${
                  max_supply ? 'py-4' : 'border-b pt-4 sm:pb-4'
                }`}
              >
                <p>{t('token:total-supply')}</p>
                <p className="font-mono text-th-fgd-2">
                  {formatFixedDecimals(total_supply)}
                </p>
              </div>
              {max_supply ? (
                <div className="flex justify-between border-t border-th-bkg-3 pt-4">
                  <p>{t('token:max-supply')}</p>
                  <p className="font-mono text-th-fgd-2">
                    {formatFixedDecimals(max_supply)}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </>
      ) : loading ? (
        <div className="space-y-3 px-6 py-4">
          <SheenLoader className="flex flex-1">
            <div className="h-32 w-full rounded-lg bg-th-bkg-2" />
          </SheenLoader>
          <SheenLoader className="flex flex-1">
            <div className="h-72 w-full rounded-lg bg-th-bkg-2" />
          </SheenLoader>
        </div>
      ) : (
        <div className="-mt-8 flex h-screen flex-col items-center justify-center">
          <p className="text-3xl">😔</p>
          <h2 className="mb-1">{t('token:token-not-found')}</h2>
          <p className="mb-2">
            {t('token:token-not-found-desc', { token: token })}
          </p>
          <Link href="/">
            <a>{t('token:go-to-account')}</a>
          </Link>
        </div>
      )}
      {showDepositModal ? (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          token={bank!.name}
        />
      ) : null}
      {showBorrowModal ? (
        <BorrowModal
          isOpen={showBorrowModal}
          onClose={() => setShowBorrowModal(false)}
          token={bank!.name}
        />
      ) : null}
    </div>
  )
}

export default Token
