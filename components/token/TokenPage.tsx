import Change from '@components/shared/Change'
import DailyRange from '@components/shared/DailyRange'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import FlipNumbers from 'react-flip-numbers'
import { formatDecimal, formatFixedDecimals } from 'utils/numbers'
import Link from 'next/link'
import SheenLoader from '@components/shared/SheenLoader'
import Tooltip from '@components/shared/Tooltip'
import useMangoGroup from 'hooks/useMangoGroup'
import useJupiterMints from 'hooks/useJupiterMints'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { ANIMATION_SETTINGS_KEY } from 'utils/constants'
import { INITIAL_ANIMATION_SETTINGS } from '@components/settings/AnimationSettings'
import ActionPanel from './ActionPanel'
import ChartTabs from './ChartTabs'
import CoingeckoStats from './CoingeckoStats'

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

const TokenPage = () => {
  const { t } = useTranslation(['common', 'token'])
  const [coingeckoData, setCoingeckoData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { token } = router.query
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const [animationSettings] = useLocalStorageState(
    ANIMATION_SETTINGS_KEY,
    INITIAL_ANIMATION_SETTINGS
  )

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
    if (bank && mangoTokens.length) {
      return mangoTokens.find((t) => t.address === bank.mint.toString())
        ?.logoURI
    }
  }, [bank, mangoTokens])

  const coingeckoId = useMemo(() => {
    if (bank && mangoTokens.length) {
      return mangoTokens.find((t) => t.address === bank.mint.toString())
        ?.extensions?.coingeckoId
    }
  }, [bank, mangoTokens])

  const fetchTokenInfo = async (tokenId: string) => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${tokenId}?localization=false&tickers=false&developer_data=false&sparkline=false
      `
    )
    const data = await response.json()
    return data
  }

  useEffect(() => {
    const getCoingeckoData = async (id: string) => {
      const response = await fetchTokenInfo(id)
      setCoingeckoData(response)
      setLoading(false)
    }

    if (coingeckoId) {
      getCoingeckoData(coingeckoId)
    }
  }, [coingeckoId])

  const { high_24h, low_24h, price_change_percentage_24h } = coingeckoData
    ? coingeckoData.market_data
    : DEFAULT_COINGECKO_VALUES

  return (
    <>
      {bank ? (
        <>
          <div className="flex flex-col border-b border-th-bkg-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-1">
              <div className="mb-1.5 flex items-center space-x-2">
                <Image src={logoURI!} height="20" width="20" />
                {coingeckoData ? (
                  <h1 className="text-base font-normal">
                    {coingeckoData.name}{' '}
                    <span className="text-th-fgd-4">({bank.name})</span>
                  </h1>
                ) : (
                  <h1 className="text-base font-normal">{bank.name}</h1>
                )}
              </div>
              <div className="flex items-end space-x-3 font-display text-5xl text-th-fgd-1">
                {animationSettings['number-scroll'] ? (
                  <FlipNumbers
                    height={48}
                    width={38}
                    play
                    delay={0.05}
                    duration={1}
                    numbers={formatFixedDecimals(bank.uiPrice, true)}
                  />
                ) : (
                  <span>{formatFixedDecimals(bank.uiPrice, true)}</span>
                )}
                {coingeckoData ? (
                  <Change change={price_change_percentage_24h} suffix="%" />
                ) : null}
              </div>
              {coingeckoData ? (
                <div className="mt-2">
                  <DailyRange
                    high={high_24h.usd}
                    low={low_24h.usd}
                    price={bank.uiPrice}
                  />
                </div>
              ) : null}
            </div>
            <ActionPanel bank={bank} />
          </div>
          <ChartTabs token={token as string} />
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
          {coingeckoData && coingeckoId ? (
            <CoingeckoStats
              bank={bank}
              coingeckoData={coingeckoData}
              coingeckoId={coingeckoId}
            />
          ) : (
            <div className="flex flex-col items-center p-6">
              <span className="mb-0.5 text-2xl">🦎</span>
              <p>No CoinGecko data...</p>
            </div>
          )}
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
