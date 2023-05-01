import { Disclosure, Transition } from '@headlessui/react'
import {
  ArrowTopRightOnSquareIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Image from 'next/legacy/image'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../../utils/theme'
import ContentBox from '../shared/ContentBox'
import Tooltip from '@components/shared/Tooltip'
import { Bank } from '@blockworks-foundation/mango-v4'
import useJupiterMints from 'hooks/useJupiterMints'
import { Table, Td, Th, TrBody, TrHead } from '@components/shared/TableElements'
import useMangoGroup from 'hooks/useMangoGroup'
import useBanksWithBalances from 'hooks/useBanksWithBalances'
import { getOracleProvider } from 'hooks/useOracleProvider'

const TokenSettingsTable = () => {
  const { t } = useTranslation(['common', 'activity', 'token', 'trade'])
  const { group } = useMangoGroup()
  const { mangoTokens } = useJupiterMints()
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false
  const banks = useBanksWithBalances()

  return group ? (
    <ContentBox hideBorder hidePadding>
      {showTableView ? (
        <div className="thin-scroll overflow-x-auto">
          <Table>
            <thead>
              <TrHead>
                <Th className="text-left">{t('token')}</Th>
                <Th>
                  <div className="flex justify-end text-right">
                    <Tooltip content={t('asset-liability-weight-desc')}>
                      <span className="tooltip-underline">
                        {t('asset-liability-weight')}
                      </span>
                    </Tooltip>
                  </div>
                </Th>
                <Th className="text-right">{t('borrow-fee')}</Th>
                <Th className="text-right">{t('activity:liquidation-fee')}</Th>
                <Th className="text-right">{t('trade:oracle')}</Th>
                {/* Uncomment when insurance fund is ready */}
                {/* <Th className="text-right">
                  <Tooltip
                    content={t('trade:tooltip-insured', { tokenOrMarket: '' })}
                  >
                    <span className="tooltip-underline">
                      {t('trade:insured', { token: '' })}
                    </span>
                  </Tooltip>
                </Th> */}
              </TrHead>
            </thead>
            <tbody>
              {banks.map((b) => {
                const bank: Bank = b.bank

                let logoURI
                if (mangoTokens?.length) {
                  logoURI = mangoTokens.find(
                    (t) => t.address === bank.mint.toString()
                  )?.logoURI
                }

                const [oracleProvider, oracleLinkPath] = getOracleProvider(
                  bank,
                  group
                )

                // const mintInfo = group.mintInfosMapByMint.get(
                //   bank.mint.toString()
                // )

                return (
                  <TrBody key={bank.name}>
                    <Td>
                      <div className="flex items-center">
                        <div className="mr-2.5 flex flex-shrink-0 items-center">
                          {logoURI ? (
                            <Image
                              alt=""
                              width="24"
                              height="24"
                              src={logoURI}
                            />
                          ) : (
                            <QuestionMarkCircleIcon className="h-6 w-6 text-th-fgd-3" />
                          )}
                        </div>
                        <p className="font-body">{bank.name}</p>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex justify-end space-x-1.5 text-right">
                        <p>{bank.initAssetWeight.toFixed(2)}</p>
                        <span className="text-th-fgd-4">|</span>
                        <p>{bank.initLiabWeight.toFixed(2)}</p>
                      </div>
                    </Td>
                    <Td>
                      <p className="text-right">
                        {(100 * bank.loanOriginationFeeRate.toNumber()).toFixed(
                          2
                        )}
                        %
                      </p>
                    </Td>
                    <Td>
                      <p className="text-right">
                        {(bank.liquidationFee.toNumber() * 100).toFixed(2)}%
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
                    {/* <Td>
                      <p className="text-right">
                        {mintInfo?.groupInsuranceFund ? t('yes') : t('no')}
                      </p>
                    </Td> */}
                  </TrBody>
                )
              })}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="border-b border-th-bkg-3">
          {banks.map((b, i) => {
            const bank = b.bank
            let logoURI: string | undefined
            if (mangoTokens?.length) {
              logoURI = mangoTokens.find(
                (t) => t.address === bank.mint.toString()
              )?.logoURI
            }
            const [oracleProvider, oracleLinkPath] = getOracleProvider(
              bank,
              group
            )
            // const mintInfo = group.mintInfosMapByMint.get(
            //   bank.mint.toString()
            // )
            return (
              <Disclosure key={bank.name}>
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className={`w-full border-t border-th-bkg-3 p-4 text-left focus:outline-none ${
                        i === 0 ? 'border-t-0' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="mr-2.5 flex flex-shrink-0 items-center">
                            {logoURI ? (
                              <Image
                                alt=""
                                width="24"
                                height="24"
                                src={logoURI}
                              />
                            ) : (
                              <QuestionMarkCircleIcon className="h-7 w-7 text-th-fgd-3" />
                            )}
                          </div>
                          <p className="text-th-fgd-1">{bank.name}</p>
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
                            <Tooltip content={t('asset-liability-weight-desc')}>
                              <p className="tooltip-underline text-xs text-th-fgd-3">
                                {t('asset-liability-weight')}
                              </p>
                            </Tooltip>
                            <div className="flex space-x-1.5 text-right font-mono">
                              <p className="text-th-fgd-1">
                                {bank.initAssetWeight.toFixed(2)}
                              </p>
                              <span className="text-th-fgd-4">|</span>
                              <p className="text-th-fgd-1">
                                {bank.initLiabWeight.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs">{t('borrow-fee')}</p>
                            <p className="font-mono text-th-fgd-1">
                              {(
                                100 * bank.loanOriginationFeeRate.toNumber()
                              ).toFixed(2)}
                              %
                            </p>
                          </div>
                          <div className="col-span-1">
                            <p className="text-xs">
                              {t('activity:liquidation-fee')}
                            </p>
                            <p className="font-mono text-th-fgd-1">
                              {(bank.liquidationFee.toNumber() * 100).toFixed(
                                2
                              )}
                              %
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
  ) : null
}

export default TokenSettingsTable
