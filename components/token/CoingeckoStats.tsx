import { Bank } from '@blockworks-foundation/mango-v4'
import Change from '@components/shared/Change'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { ArrowSmallUpIcon } from '@heroicons/react/20/solid'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import parse from 'html-react-parser'
import { useTranslation } from 'next-i18next'
import { useMemo, useState } from 'react'
dayjs.extend(relativeTime)

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

const CoingeckoStats = ({
  bank,
  coingeckoData,
}: {
  bank: Bank
  // TODO: Add Coingecko api types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coingeckoData: any
}) => {
  const { t } = useTranslation(['common', 'token'])
  const [showFullDesc, setShowFullDesc] = useState(false)

  const {
    ath,
    atl,
    ath_change_percentage,
    atl_change_percentage,
    ath_date,
    atl_date,
    circulating_supply,
    fully_diluted_valuation,
    market_cap,
    max_supply,
    total_supply,
    total_volume,
  } = coingeckoData ? coingeckoData : DEFAULT_COINGECKO_VALUES

  const truncateDescription = (desc: string) =>
    desc.substring(0, (desc + ' ').lastIndexOf(' ', 144))

  const description = useMemo(() => {
    const desc = coingeckoData?.description?.en
    if (!desc) return ''
    return showFullDesc
      ? coingeckoData.description.en
      : truncateDescription(coingeckoData.description.en)
  }, [coingeckoData, showFullDesc])

  return (
    <>
      {description ? (
        <div className="border-b border-th-bkg-3 px-6 py-4">
          <h2 className="mb-1 text-xl">About {bank.name}</h2>
          <div className="flex items-end">
            <p className="max-w-[720px]">{parse(description)}</p>
            {coingeckoData.description.en.length > description.length ||
            showFullDesc ? (
              <span
                className="ml-4 flex cursor-pointer items-end font-normal underline hover:text-th-fgd-2 md:hover:no-underline"
                onClick={() => setShowFullDesc(!showFullDesc)}
              >
                {showFullDesc ? 'Less' : 'More'}
                <ArrowSmallUpIcon
                  className={`h-5 w-5 ${
                    showFullDesc ? 'rotate-0' : 'rotate-180'
                  } default-transition`}
                />
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 border-b border-th-bkg-3 md:grid-cols-2">
        <div className="col-span-1 border-b border-th-bkg-3 px-6 py-4 md:col-span-2">
          <h2 className="text-base">{bank.name} Stats</h2>
        </div>
        <div className="col-span-1 px-6 py-4 md:border-r md:border-th-bkg-3">
          <div className="flex justify-between pb-4">
            <p>{t('token:market-cap')}</p>
            <p className="font-mono text-th-fgd-2">
              {market_cap?.usd ? (
                <FormatNumericValue value={market_cap.usd} isUsd />
              ) : (
                <span className="font-body text-th-fgd-4">
                  {t('unavailable')}
                </span>
              )}{' '}
              <span className="text-th-fgd-4">
                {coingeckoData.market_cap_rank
                  ? `#${coingeckoData.market_cap_rank}`
                  : ''}
              </span>
            </p>
          </div>
          <div className="flex justify-between border-t border-th-bkg-3 py-4">
            <p>{t('token:volume')}</p>
            <p className="font-mono text-th-fgd-2">
              {total_volume?.usd ? (
                <FormatNumericValue value={total_volume.usd} isUsd />
              ) : (
                <span className="font-body text-th-fgd-4">
                  {t('unavailable')}
                </span>
              )}
            </p>
          </div>
          <div className="flex justify-between border-t border-th-bkg-3 py-4">
            <p>{t('token:all-time-high')}</p>
            <div className="flex flex-col items-end">
              <div className="flex items-center font-mono text-th-fgd-2">
                <span className="mr-2">
                  {ath?.usd ? (
                    <FormatNumericValue value={ath.usd} isUsd />
                  ) : (
                    <span className="font-body text-th-fgd-4">
                      {t('unavailable')}
                    </span>
                  )}
                </span>
                {ath_change_percentage.usd ? (
                  <Change change={ath_change_percentage.usd} suffix="%" />
                ) : null}
              </div>
              <p className="text-xs text-th-fgd-4">
                {dayjs(ath_date.usd).format('MMM, D, YYYY')} (
                {dayjs(ath_date.usd).fromNow()})
              </p>
            </div>
          </div>
          <div className="flex justify-between border-y border-th-bkg-3 py-4 md:border-b-0 md:pb-0">
            <p>{t('token:all-time-low')}</p>
            <div className="flex flex-col items-end">
              <div className="flex items-center font-mono text-th-fgd-2">
                <span className="mr-2">
                  {atl?.usd ? (
                    <FormatNumericValue value={atl.usd} isUsd />
                  ) : (
                    <span className="font-body text-th-fgd-4">
                      {t('unavailable')}
                    </span>
                  )}
                </span>
                <Change change={atl_change_percentage.usd} suffix="%" />
              </div>
              <p className="text-xs text-th-fgd-4">
                {dayjs(atl_date.usd).format('MMM, D, YYYY')} (
                {dayjs(atl_date.usd).fromNow()})
              </p>
            </div>
          </div>
        </div>
        <div className="col-span-1 px-6 pb-4 md:pt-4">
          {fully_diluted_valuation.usd ? (
            <div className="flex justify-between pb-4">
              <p>{t('token:fdv')}</p>
              <p className="font-mono text-th-fgd-2">
                {fully_diluted_valuation?.usd ? (
                  <FormatNumericValue
                    value={fully_diluted_valuation.usd}
                    isUsd
                  />
                ) : (
                  <span className="font-body text-th-fgd-4">
                    {t('unavailable')}
                  </span>
                )}
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
              {circulating_supply ? (
                <FormatNumericValue value={circulating_supply} />
              ) : (
                <span className="font-body text-th-fgd-4">
                  {t('unavailable')}
                </span>
              )}
            </p>
          </div>
          <div
            className={`flex justify-between border-t border-th-bkg-3 ${
              max_supply ? 'py-4' : 'pt-4 md:pb-4'
            }`}
          >
            <p>{t('token:total-supply')}</p>
            <p className="font-mono text-th-fgd-2">
              {total_supply ? (
                <FormatNumericValue value={total_supply} />
              ) : (
                <span className="font-body text-th-fgd-4">
                  {t('unavailable')}
                </span>
              )}
            </p>
          </div>
          {max_supply ? (
            <div className="flex justify-between border-t border-th-bkg-3 pt-4">
              <p>{t('token:max-supply')}</p>
              <p className="font-mono text-th-fgd-2">
                {max_supply ? (
                  <FormatNumericValue value={max_supply} />
                ) : (
                  <span className="font-body text-th-fgd-4">
                    {t('unavailable')}
                  </span>
                )}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default CoingeckoStats
