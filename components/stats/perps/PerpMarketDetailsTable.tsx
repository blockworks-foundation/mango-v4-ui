import { useTranslation } from 'next-i18next'
import mangoStore from '@store/mangoStore'
import ContentBox from '@components/shared/ContentBox'
import MarketLogos from '@components/trade/MarketLogos'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure, Transition } from '@headlessui/react'
import { NextRouter, useRouter } from 'next/router'
import { LinkButton } from '@components/shared/Button'
import SoonBadge from '@components/shared/SoonBadge'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'utils/theme'
import OracleProvider from '@components/shared/OracleProvider'

export const goToPerpMarketDetails = (
  market: string | undefined,
  router: NextRouter,
) => {
  if (market) {
    const query = { ...router.query, ['market']: market }
    router.push({ pathname: router.pathname, query })
  }
}

const PerpMarketDetailsTable = () => {
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
              <Th className="text-right">{t('trade:maker-fee')}</Th>
              <Th className="text-right">{t('trade:taker-fee')}</Th>
              <Th className="text-right">{t('trade:funding-limits')}</Th>
              <Th className="text-right">
                <Tooltip
                  content={
                    <div>
                      {t('trade:tooltip-insured', { tokenOrMarket: '' })}
                      <a
                        className="mt-2 flex items-center"
                        href="https://docs.mango.markets/mango-markets/insurance-fund"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Learn more
                      </a>
                    </div>
                  }
                >
                  <span className="tooltip-underline">
                    {t('trade:insured', { token: '' })}
                  </span>
                </Tooltip>
              </Th>
              <Th className="text-right">{t('trade:oracle')}</Th>
              <Th />
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
                groupInsuranceFund,
                minFunding,
                maxFunding,
                publicKey,
              } = market

              const isComingSoon = market.oracleLastUpdatedSlot == 0

              return (
                <TrBody
                  className="default-transition md:hover:cursor-pointer md:hover:bg-th-bkg-2"
                  key={publicKey.toString()}
                  onClick={() => goToPerpMarketDetails(market.name, router)}
                >
                  <Td>
                    <div className="flex items-center">
                      <MarketLogos market={market} size="large" />
                      <p className="mr-2 whitespace-nowrap font-body">{name}</p>
                      {isComingSoon ? <SoonBadge /> : null}
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
                      {(100 * makerFee.toNumber()).toFixed(2)}%
                    </p>
                  </Td>
                  <Td>
                    <p className="text-right">
                      {(100 * takerFee.toNumber()).toFixed(2)}%
                    </p>
                  </Td>
                  <Td>
                    <p className="text-right">
                      {(100 * minFunding.toNumber()).toFixed(2)}%{' '}
                      <span className="font-body text-th-fgd-3">to</span>{' '}
                      {(100 * maxFunding.toNumber()).toFixed(2)}%
                    </p>
                  </Td>
                  <Td>
                    <p className="text-right">
                      {groupInsuranceFund ? t('yes') : t('no')}
                    </p>
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <OracleProvider />
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end">
                      <ChevronRightIcon className="h-5 w-5 text-th-fgd-3" />
                    </div>
                  </Td>
                </TrBody>
              )
            })}
          </tbody>
        </Table>
      ) : (
        <div className="border-b border-th-bkg-3">
          {perpMarkets.map((market, i) => {
            const {
              name,
              minOrderSize,
              tickSize,
              initBaseLiabWeight,
              maintBaseLiabWeight,
              makerFee,
              takerFee,
              groupInsuranceFund,
              minFunding,
              maxFunding,
              publicKey,
            } = market
            const isComingSoon = market.oracleLastUpdatedSlot == 0
            return (
              <Disclosure key={publicKey.toString()}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none ${
                        i === 0 ? 'border-t-0' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <MarketLogos market={market} />
                          <p className="mr-2 whitespace-nowrap text-th-fgd-1">
                            {name}
                          </p>
                          {isComingSoon ? <SoonBadge /> : null}
                        </div>
                        <ChevronDownIcon
                          className={`${
                            open ? 'rotate-180' : 'rotate-0'
                          } h-6 w-6 shrink-0 text-th-fgd-3`}
                        />
                      </div>
                    </Disclosure.Button>
                    <Transition
                      enter="transition ease-in duration-200"
                      enterFrom="opacity-0"
                      enterTo="opacity-100"
                    >
                      <Disclosure.Panel>
                        <div className="mx-4 grid grid-cols-2 gap-4 border-t border-th-bkg-3 py-4">
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
                          <div className="col-span-1">
                            <p className="text-xs">{t('trade:oracle')}</p>
                            <OracleProvider />
                          </div>
                          <div className="col-span-1">
                            <Tooltip
                              content={t('trade:tooltip-insured', {
                                tokenOrMarket: name,
                              })}
                              placement="top-start"
                            >
                              <p className="tooltip-underline text-xs text-th-fgd-3">
                                {t('trade:insured', { token: '' })}
                              </p>
                            </Tooltip>
                            <p className="font-mono text-th-fgd-1">
                              {groupInsuranceFund ? t('yes') : t('no')}
                            </p>
                          </div>
                          <div className="col-span-1">
                            <LinkButton
                              className="flex items-center"
                              onClick={() =>
                                goToPerpMarketDetails(market.name, router)
                              }
                            >
                              {t('stats:perp-details', { market: market.name })}
                              <ChevronRightIcon className="ml-2 h-5 w-5" />
                            </LinkButton>
                          </div>
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

export default PerpMarketDetailsTable
