import DailyRange from '@components/shared/DailyRange'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import SheenLoader from '@components/shared/SheenLoader'
import useMangoGroup from 'hooks/useMangoGroup'
import useJupiterMints from 'hooks/useJupiterMints'
import ActionPanel from './ActionPanel'
import ChartTabs from './ChartTabs'
import { useQuery } from '@tanstack/react-query'
import TopTokenAccounts from './TopTokenAccounts'
import TokenParams from './TokenParams'
import { formatTokenSymbol } from 'utils/tokens'
import TokenLogo from '@components/shared/TokenLogo'
import {
  ArrowLeftIcon,
  ArrowTopRightOnSquareIcon,
  ArrowTrendingUpIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/20/solid'
import RateCurveChart from './RateCurveChart'
import PriceChart from './PriceChart'
import Button from '@components/shared/Button'
import mangoStore from '@store/mangoStore'
import { fetchCMSTokenPage } from 'utils/contentful'

const DEFAULT_COINGECKO_VALUES = {
  ath: 0,
  atl: 0,
  ath_change_percentage: 0,
  atl_change_percentage: 0,
  ath_date: 0,
  atl_date: 0,
  high_24h: { usd: 0 },
  circulating_supply: 0,
  fully_diluted_valuation: 0,
  low_24h: { usd: 0 },
  market_cap: 0,
  max_supply: 0,
  price_change_percentage_24h: 0,
  total_supply: 0,
  total_volume: 0,
}

type CryptoStatsResponse = {
  high_24h: Record<string, number>
  low_24h: Record<string, number>
  price_change_percentage_24h: number
}

export type CoingeckoDataType = {
  market_data: CryptoStatsResponse
  name: string
}

const fetchTokenInfo = async (tokenId: string | undefined) => {
  if (!tokenId) return
  const response = await fetch(
    `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&developer_data=false&sparkline=false&community_data=false
    `,
  )
  const data = await response.json()
  return data
}

const TokenPage = () => {
  const { t } = useTranslation(['common', 'token'])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { token } = router.query
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const spotMarkets = mangoStore((s) => s.serumMarkets)

  const bankName = useMemo(() => {
    if (!token) return
    return token === 'wBTC'
      ? 'wBTC (Portal)'
      : token === 'ETH'
      ? 'ETH (Portal)'
      : token.toString()
  }, [token])

  const bank = useMemo(() => {
    if (group && bankName) {
      const bank = group.banksMapByName.get(bankName)
      if (bank) {
        return bank[0]
      } else {
        setLoading(false)
      }
    }
  }, [group, bankName])

  const coingeckoId = useMemo(() => {
    if (bank && mangoTokens.length) {
      return mangoTokens.find((t) => t.address === bank.mint.toString())
        ?.extensions?.coingeckoId
    }
  }, [bank, mangoTokens])

  const { data: coingeckoTokenInfo } = useQuery<CoingeckoDataType, Error>(
    ['coingecko-token-info', coingeckoId],
    () => fetchTokenInfo(coingeckoId),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 5,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!coingeckoId,
    },
  )

  const { data: cmsTokenData } = useQuery(
    ['cms-token-data', bankName],
    () => fetchCMSTokenPage(bankName),
    {
      cacheTime: 1000 * 60 * 15,
      staleTime: 1000 * 60 * 5,
      retry: 3,
      refetchOnWindowFocus: false,
      enabled: !!bankName,
    },
  )

  const { high_24h, low_24h } = coingeckoTokenInfo?.market_data
    ? coingeckoTokenInfo.market_data
    : DEFAULT_COINGECKO_VALUES

  const formatCoingeckoName = (name: string) => {
    if (name === 'Wrapped Solana') return 'Solana'
    if (name.includes('Wormhole')) return name.replace('Wormhole', 'Portal')
    return name
  }

  const handleTrade = () => {
    const markets = spotMarkets.filter(
      (m) => m.baseTokenIndex === bank?.tokenIndex,
    )
    if (markets) {
      if (markets.length === 1) {
        router.push(`/trade?name=${markets[0].name}`)
      }
      if (markets.length > 1) {
        const market = markets.find((mkt) => !mkt.reduceOnly)
        if (market) {
          router.push(`/trade?name=${market.name}`)
        }
      }
    }
  }

  const handleSwap = () => {
    if (bank?.name === 'USDC') {
      router.push(`/swap?in=USDC&out=SOL`)
    } else {
      router.push(`/swap?in=USDC&out=${bank?.name}`)
    }
  }

  return (
    <>
      <div className="flex h-14 items-center space-x-4 border-b border-th-bkg-3">
        <button
          className="flex h-14 w-14 shrink-0 items-center justify-center border-r border-th-bkg-3 focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2"
          onClick={() =>
            router.push(router.pathname, undefined, { shallow: true })
          }
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        {bank ? (
          <span className="text-lg font-bold text-th-fgd-1">
            {formatTokenSymbol(bank.name)}
          </span>
        ) : null}
      </div>
      {bank && bankName ? (
        <>
          <div className="flex flex-col border-b border-th-bkg-3 px-6 pb-4 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="mb-4 flex flex-col md:mb-1 md:flex-row md:items-center md:space-x-4">
              <div className="mb-2 w-12 shrink-0 md:mb-0">
                <TokenLogo bank={bank} size={48} />
              </div>
              <div>
                <div className="flex flex-wrap items-end">
                  {coingeckoTokenInfo?.name ? (
                    <h1 className="mb-1.5 mr-3">
                      {formatCoingeckoName(coingeckoTokenInfo.name)}
                    </h1>
                  ) : (
                    <h1 className="mb-1.5 mr-3">{bank.name}</h1>
                  )}
                  {cmsTokenData?.length ? (
                    <a
                      className="mb-2 flex cursor-pointer items-center text-th-fgd-3 md:hover:text-th-fgd-2"
                      href={`https://mango.markets/explore/tokens/${cmsTokenData[0]?.slug}`}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <span>What is {bank?.name}?</span>
                      <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" />
                    </a>
                  ) : null}
                </div>
                {high_24h.usd && low_24h.usd ? (
                  <DailyRange
                    high={high_24h.usd}
                    low={low_24h.usd}
                    price={bank.uiPrice}
                  />
                ) : null}
              </div>
            </div>
            <div className="flex space-x-4 pt-4 sm:pt-0">
              <Button
                className="flex w-full items-center justify-center sm:w-auto"
                onClick={handleSwap}
                size="large"
              >
                <ArrowsRightLeftIcon className="mr-2 h-5 w-5" />
                <span>{t('swap')}</span>
              </Button>
              <Button
                className="flex w-full items-center justify-center sm:w-auto"
                onClick={handleTrade}
                size="large"
              >
                <ArrowTrendingUpIcon className="mr-2 h-5 w-5" />
                <span>{t('trade')}</span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-12 border-b border-th-bkg-3">
            <div className="col-span-12 lg:col-span-7 xl:col-span-8">
              <PriceChart bank={bank} />
            </div>
            <div className="col-span-12 lg:col-span-5 xl:col-span-4">
              <ActionPanel bank={bank} />
            </div>
          </div>
          {/* {coingeckoTokenInfo?.market_data ? (
            <CoingeckoStats
              bank={bank}
              coingeckoData={coingeckoTokenInfo.market_data}
            />
          ) : loadingCoingeckoInfo && coingeckoId ? (
            <div className="p-6">
              <SheenLoader className="flex flex-1">
                <div className="h-72 w-full rounded-lg bg-th-bkg-2 md:h-80" />
              </SheenLoader>
            </div>
          ) : (
            <div className="flex flex-col items-center p-6">
              <span className="mb-0.5 text-2xl">🦎</span>
              <p>No CoinGecko data...</p>
            </div>
          )} */}
          {/* <div className="px-4 pb-4 pt-6 md:px-6">
            <h2>{bank?.name} on Mango</h2>
          </div> */}
          <ChartTabs bank={bank} />
          <div className="border-y border-th-bkg-3 px-6 pb-2 pt-6">
            <RateCurveChart bank={bank} />
          </div>
          <TopTokenAccounts bank={bank} />
          <TokenParams bank={bank} />
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
          <Link href="/">{t('token:go-to-account')}</Link>
        </div>
      )}
    </>
  )
}

export default TokenPage
