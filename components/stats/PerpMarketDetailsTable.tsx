import { useTranslation } from 'next-i18next'
import { useViewport } from '../../hooks/useViewport'
import mangoStore from '@store/mangoStore'
import { breakpoints } from '../../utils/theme'
import ContentBox from '../shared/ContentBox'
import MarketLogos from '@components/trade/MarketLogos'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
} from '@heroicons/react/20/solid'
import Tooltip from '@components/shared/Tooltip'
import { Disclosure, Transition } from '@headlessui/react'
import { getOracleProvider } from 'hooks/useOracleProvider'

const PerpMarketDetailsTable = () => {
  const { t } = useTranslation(['common', 'trade'])
  const perpMarkets = mangoStore((s) => s.perpMarkets)
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

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
              <Th className="text-right">{t('trade:oracle')}</Th>
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

              const [oracleProvider, oracleLinkPath] = getOracleProvider(market)

              return (
                <TrBody key={publicKey.toString()}>
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
                  <Td>
                    {oracleLinkPath ? (
                      <a
                        className="flex items-center justify-end"
                        href={oracleLinkPath}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="mr-1.5 font-body">
                          {oracleProvider}
                        </span>
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </a>
                    ) : (
                      <p className="text-right font-body">{oracleProvider}</p>
                    )}
                  </Td>
                  <Td>
                    <p className="text-right">
                      {groupInsuranceFund ? t('yes') : t('no')}
                    </p>
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
            const [oracleProvider, oracleLinkPath] = getOracleProvider(market)
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
                          <p className="whitespace-nowrap text-th-fgd-1">
                            {name}
                          </p>
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
                          <div className="col-span-1">
                            <p className="text-xs">{t('trade:oracle')}</p>
                            {oracleLinkPath ? (
                              <a
                                className="flex items-center"
                                href={oracleLinkPath}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <span className="mr-1.5 font-body">
                                  {oracleProvider}
                                </span>
                                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                              </a>
                            ) : (
                              <p className="text-right font-body">
                                {oracleProvider}
                              </p>
                            )}
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
