import { Transition } from '@headlessui/react'
import { ChevronDownIcon, DotsHorizontalIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { Fragment, useState } from 'react'
import { useViewport } from '../hooks/useViewport'

import mangoStore from '../store/state'
import { formatDecimal, numberFormat } from '../utils/numbers'
import { breakpoints } from '../utils/theme'
import Button, { IconButton, LinkButton } from './shared/Button'
import ContentBox from './shared/ContentBox'
import { UpTriangle } from './shared/DirectionTriangles'
import IconDropMenu from './shared/IconDropMenu'

const TokenList = () => {
  const { t } = useTranslation('common')
  const [showTokenDetails, setShowTokenDetails] = useState('')
  const mangoAccount = mangoStore((s) => s.mangoAccount)
  const group = mangoStore((s) => s.group)
  const router = useRouter()
  const { asPath } = router
  const { width } = useViewport()
  const showTableView = width ? width > breakpoints.md : false

  const banks = group?.banksMap
    ? Array.from(group?.banksMap, ([key, value]) => ({ key, value }))
    : []

  const handleShowTokenDetails = (name: string) => {
    showTokenDetails ? setShowTokenDetails('') : setShowTokenDetails(name)
  }

  return (
    <ContentBox hideBorder hidePadding>
      <h2>{t('tokens')}</h2>
      {showTableView ? (
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="w-[12.5%] text-left">{t('token')}</th>
              <th className="w-[12.5%] text-right">{t('price')}</th>
              {/* <th className="w-[12.5%] text-right">{t('rolling-change')}</th>
              <th className="w-[12.5%] text-right">{t('daily-volume')}</th> */}
              <th className="w-[12.5%] text-right">{t('rates')}</th>
              <th className="w-[12.5%] text-right">{t('liquidity')}</th>
              <th className="w-[12.5%] text-right">{t('available-balance')}</th>
            </tr>
          </thead>
          <tbody>
            {banks.map((bank) => {
              const oraclePrice = bank.value.price
              return (
                <tr key={bank.key}>
                  <td className="w-[12.5%]">
                    <div className="flex items-center">
                      <div className="mr-2.5 flex flex-shrink-0 items-center">
                        <Image
                          alt=""
                          width="24"
                          height="24"
                          src={`/icons/${bank.value.name.toLowerCase()}.svg`}
                        />
                      </div>
                      <p>{bank.value.name}</p>
                    </div>
                  </td>
                  <td className="w-[12.5%]">
                    <div className="flex flex-col text-right">
                      <p>${formatDecimal(oraclePrice.toNumber(), 2)}</p>
                      <div className="flex items-center justify-end">
                        <UpTriangle />
                        <p className="ml-1 text-sm text-th-green">0%</p>
                      </div>
                    </div>
                  </td>
                  {/* <td className="w-[12.5%]">
                    <div className="flex flex-col text-right">
                      <p className="text-th-green">0%</p>
                    </div>
                  </td> */}
                  {/* <td className="w-[12.5%]">
                    <div className="flex flex-col text-right">
                      <p>1000</p>
                    </div>
                  </td> */}
                  <td className="w-[12.5%]">
                    <div className="flex justify-end space-x-2 text-right">
                      <p className="text-th-green">
                        {formatDecimal(
                          bank.value.getDepositRate().toNumber(),
                          2
                        )}
                        %
                      </p>
                      <span className="text-th-fgd-4">|</span>
                      <p className="text-th-red">
                        {formatDecimal(
                          bank.value.getBorrowRate().toNumber(),
                          2
                        )}
                        %
                      </p>
                    </div>
                  </td>
                  <td className="w-[12.5%]">
                    <div className="flex flex-col text-right">
                      <p>
                        {formatDecimal(
                          bank.value.uiDeposits() - bank.value.uiBorrows(),
                          bank.value.mintDecimals
                        )}
                      </p>
                    </div>
                  </td>
                  <td className="w-[12.5%] pt-4 text-right">
                    <p className="px-2">
                      {mangoAccount
                        ? formatDecimal(mangoAccount.getUi(bank.value))
                        : 0}
                    </p>
                    <p className="px-2 text-sm text-th-fgd-4">
                      {mangoAccount
                        ? `$${formatDecimal(
                            mangoAccount.getUi(bank.value) *
                              oraclePrice.toNumber(),
                            2
                          )}`
                        : '$0'}
                    </p>
                  </td>
                  <td className="w-[12.5%]">
                    <div className="flex justify-end space-x-2">
                      <IconDropMenu
                        icon={<DotsHorizontalIcon className="h-5 w-5" />}
                      >
                        <LinkButton
                          className="w-full text-left"
                          disabled={!mangoAccount}
                          // onClick={}
                        >
                          {t('deposit')}
                        </LinkButton>
                        {mangoAccount && mangoAccount.getUi(bank.value) > 0 ? (
                          <LinkButton
                            className="w-full text-left"
                            disabled={!mangoAccount}
                            // onClick={}
                          >
                            {t('withdraw')}
                          </LinkButton>
                        ) : (
                          <LinkButton
                            className="w-full text-left"
                            disabled={!mangoAccount}
                            // onClick={}
                          >
                            {t('borrow')}
                          </LinkButton>
                        )}
                        <LinkButton
                          className="w-full text-left"
                          disabled={!mangoAccount}
                          // onClick={}
                        >
                          {t('buy')}
                        </LinkButton>
                        <LinkButton
                          className="w-full text-left"
                          disabled={!mangoAccount}
                          // onClick={}
                        >
                          {t('sell')}
                        </LinkButton>
                      </IconDropMenu>
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
            return (
              <div
                key={bank.key}
                className="rounded-md border border-th-bkg-4 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="mr-2.5 flex flex-shrink-0 items-center">
                      <Image
                        alt=""
                        width="32"
                        height="32"
                        src={`/icons/${bank.value.name.toLowerCase()}.svg`}
                      />
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
                    <div className="flex space-x-2">
                      <Button>{t('buy')}</Button>
                      <Button secondary>{t('sell')}</Button>
                    </div>
                    <IconButton
                      onClick={() => handleShowTokenDetails(bank.value.name)}
                    >
                      <ChevronDownIcon
                        className={`${
                          showTokenDetails === bank.value.name
                            ? 'rotate-180 transform'
                            : 'rotate-360 transform'
                        } default-transition h-5 w-5 flex-shrink-0 text-th-fgd-1`}
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
                    {/* <div className="col-span-1">
                      <p className="text-xs text-th-fgd-3">
                        {t('daily-volume')}
                      </p>
                      <p className="font-bold">$1000</p>
                    </div> */}
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
