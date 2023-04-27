import { PerpMarket } from '@blockworks-foundation/mango-v4'
import { useTranslation } from 'next-i18next'
import { useViewport } from '../../hooks/useViewport'
import mangoStore from '@store/mangoStore'
import { breakpoints } from '../../utils/theme'
import ContentBox from '../shared/ContentBox'
import MarketLogos from '@components/trade/MarketLogos'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
// import Tooltip from '@components/shared/Tooltip'
import { PerpStatsItem } from 'types'
import { NextRouter, useRouter } from 'next/router'
import { Disclosure, Transition } from '@headlessui/react'

export const getOneDayPerpStats = (
  stats: PerpStatsItem[] | null,
  marketName: string
) => {
  return stats
    ? stats
        .filter((s) => s.perp_market === marketName)
        .filter((f) => {
          const seconds = 86400
          const dataTime = new Date(f.date_hour).getTime() / 1000
          const now = new Date().getTime() / 1000
          const limit = now - seconds
          return dataTime >= limit
        })
        .reverse()
    : []
}

const goToPerpMarketDetails = (market: PerpMarket, router: NextRouter) => {
  const query = { ...router.query, ['market']: market.name }
  router.push({ pathname: router.pathname, query })
}

const PerpMarketSettingsTable = () => {
  const { t } = useTranslation(['common', 'trade'])
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const router = useRouter()

  return (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <Table>
          <thead>
            <TrHead>
              <Th className="text-left">{t('market')}</Th>
              <Th className="text-right">{t('trade:min-order-size')}</Th>
              <Th className="text-right">{t('trade:tick-size')}</Th>
              <Th className="text-right">{t('trade:init-leverage')}</Th>
              <Th className="text-right">{t('trade:max-leverage')}</Th>
              <Th className="text-right">{t('fees')}</Th>
              <Th className="text-right">{t('trade:funding-limits')}</Th>
              {/* <Th className="text-right">
                <Tooltip content={t('trade:tooltip-insured')}>
                  <span className="tooltip-underline">
                    {t('trade:insured')}
                  </span>
                </Tooltip>
              </Th> */}
            </TrHead>
          </thead>
          <tbody>
            {perpMarkets.map((market) => {
              const {
                name,
                minOrderSize,
                tickSize,
                initBaseLiabWeight,
                maintBaseLiabWeight,
                makerFee,
                takerFee,
                // groupInsuranceFund,
                minFunding,
                maxFunding,
                publicKey,
              } = market

              return (
                <TrBody
                  className="md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                  key={publicKey.toString()}
                  onClick={() => goToPerpMarketDetails(market, router)}
                >
                  <Td>
                    <div className="flex items-center">
                      <MarketLogos market={market} />
                      <p className="whitespace-nowrap font-body">{name}</p>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-right">{minOrderSize}</p>
                  </Td>
                  <Td>
                    <p className="text-right">{tickSize}</p>
                  </Td>
                  <Td>
                    <p className="text-right">
                      {(1 / (initBaseLiabWeight.toNumber() - 1)).toFixed(2)}x
                    </p>
                  </Td>
                  <Td>
                    <p className="text-right">
                      {(1 / (maintBaseLiabWeight.toNumber() - 1)).toFixed(2)}x
                    </p>
                  </Td>
                  <Td>
                    <p className="text-right">
                      {(100 * makerFee.toNumber()).toFixed(2)}%{' '}
                      <span className="font-body text-th-fgd-3">
                        {t('trade:maker')}
                      </span>
                      <span className="mx-1">|</span>
                      {(100 * takerFee.toNumber()).toFixed(2)}%{' '}
                      <span className="font-body text-th-fgd-3">
                        {t('trade:taker')}
                      </span>
                    </p>
                  </Td>
                  <Td>
                    <p className="text-right">
                      {(100 * minFunding.toNumber()).toFixed(2)}%{' '}
                      <span className="font-body text-th-fgd-3">to</span>{' '}
                      {(100 * maxFunding.toNumber()).toFixed(2)}%
                    </p>
                  </Td>
                  {/* <Td>
                    <p className="text-right">
                      {groupInsuranceFund ? t('yes') : t('no')}
                    </p>
                  </Td> */}
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <div className="border-b border-th-bkg-3">
          {perpMarkets.map((market) => {
            const {
              name,
              minOrderSize,
              tickSize,
              initBaseLiabWeight,
              maintBaseLiabWeight,
              makerFee,
              takerFee,
              // groupInsuranceFund,
              minFunding,
              maxFunding,
              publicKey,
            } = market
            return (
              <Disclosure key={publicKey.toString()}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MarketLogos market={market} />
                          <p className="whitespace-nowrap font-body">{name}</p>
                        </div>
                        <ChevronDownIcon
                          className={`${
                            open ? 'rotate-180' : 'rotate-360'
                          } h-6 w-6 flex-shrink-0 text-th-fgd-3`}
                        />
                      </div>
                    </Disclosure.Button>
                    <Transition
                      enter="transition ease-in duration-200"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                    >
                      <Disclosure.Panel>
                        <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 pt-4 pb-4">
                          <div className="col-span-1">
                            <p className="text-xs text-th-fgd-3">
                              {t('trade:min-order-size')}
                            </p>
                            <p className="font-mono text-th-fgd-1">
                              {minOrderSize}
                            </p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-th-fgd-3">
                              {t('trade:tick-size')}
                            </p>
                            <p className="font-mono text-th-fgd-1">
                              {tickSize}
                            </p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-th-fgd-3">
                              {t('trade:init-leverage')}
                            </p>
                            <p className="font-mono text-th-fgd-1">
                              {(
                                1 /
                                (initBaseLiabWeight.toNumber() - 1)
                              ).toFixed(2)}
                              x
                            </p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-th-fgd-3">
                              {t('trade:max-leverage')}
                            </p>
                            <p className="font-mono text-th-fgd-1">
                              {(
                                1 /
                                (maintBaseLiabWeight.toNumber() - 1)
                              ).toFixed(2)}
                              x
                            </p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-th-fgd-3">{t('fees')}</p>
                            <p className="font-mono text-th-fgd-1">
                              {(100 * makerFee.toNumber()).toFixed(2)}%{' '}
                              <span className="font-body text-th-fgd-3">
                                {t('trade:maker')}
                              </span>
                              <span className="mx-1">|</span>
                              {(100 * takerFee.toNumber()).toFixed(2)}%{' '}
                              <span className="font-body text-th-fgd-3">
                                {t('trade:taker')}
                              </span>
                            </p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs text-th-fgd-3">
                              {t('trade:funding-limits')}
                            </p>
                            <p className="font-mono text-th-fgd-1">
                              {(100 * minFunding.toNumber()).toFixed(2)}%{' '}
                              <span className="font-body text-th-fgd-3">
                                to
                              </span>{' '}
                              {(100 * maxFunding.toNumber()).toFixed(2)}%
                            </p>
                          </div>
                          {/* <div className="col-span-1">
                            <Tooltip
                              content={t('trade:tooltip-insured')}
                              placement="top-start"
                            >
                              <p className="tooltip-underline text-xs text-th-fgd-3">
                                {t('trade:insured')}
                              </p>
                            </Tooltip>
                            <p className="font-mono text-th-fgd-1">
                              {groupInsuranceFund ? t('yes') : t('no')}
                            </p>
                          </div> */}
                        </div>
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            )
          })}
        </div>
      )}
    </ContentBox>
  )
}

export default PerpMarketSettingsTable
