import { memo, useMemo, useState, useEffect, ChangeEvent } from 'react'
import Image from 'next/legacy/image'
import { Token } from '../../types/jupiter'
import mangoStore from '@store/mangoStore'
import Input from '../forms/Input'
import { IconButton } from '../shared/Button'
import {
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import { floorToDecimal } from '../../utils/numbers'
import Decimal from 'decimal.js'
import { getTokenInMax } from './useTokenMax'

const generateSearchTerm = (item: Token, searchValue: string) => {
  const normalizedSearchValue = searchValue.toLowerCase()
  const values = `${item.symbol} ${item.name}`.toLowerCase()

  const isMatchingWithSymbol =
    item.symbol.toLowerCase().indexOf(normalizedSearchValue) >= 0
  const matchingSymbolPercent = isMatchingWithSymbol
    ? normalizedSearchValue.length / item.symbol.length
    : 0

  return {
    token: item,
    matchingIdx: values.indexOf(normalizedSearchValue),
    matchingSymbolPercent,
  }
}

const startSearch = (items: Token[], searchValue: string) => {
  return items
    .map((item) => generateSearchTerm(item, searchValue))
    .filter((item) => item.matchingIdx >= 0)
    .sort((i1, i2) => i1.matchingIdx - i2.matchingIdx)
    .sort((i1, i2) => i2.matchingSymbolPercent - i1.matchingSymbolPercent)
    .map((item) => item.token)
}

const TokenItem = ({
  token,
  onSubmit,
  useMargin,
  type,
}: {
  token: Token
  onSubmit: (x: string) => void
  useMargin: boolean
  type: string
}) => {
  const { address, symbol, logoURI, name } = token

  return (
    <div>
      <button
        key={address}
        className={`default-transition flex w-full cursor-pointer items-center justify-between rounded-md p-2 font-normal focus:bg-th-bkg-3 focus:outline-none md:hover:bg-th-bkg-2`}
        onClick={() => onSubmit(address)}
      >
        <div className="flex items-center">
          <picture>
            <source srcSet={logoURI} type="image/webp" />
            <img src={logoURI} width="24" height="24" alt={symbol} />
          </picture>
          <div className="ml-2.5">
            <div className="text-left text-th-fgd-2">{symbol || 'unknown'}</div>
            <div className="text-left text-xs text-th-fgd-4">
              {name || 'unknown'}
            </div>
          </div>
        </div>
        {type === 'input' ? (
          <p className="text-sm text-th-fgd-2">
            {useMargin
              ? token.amountWithBorrow!.toString()
              : token.amount!.toString()}
          </p>
        ) : null}
      </button>
    </div>
  )
}

const popularTokenSymbols = ['USDC', 'SOL', 'USDT', 'MNGO', 'BTC']

const SwapFormTokenList = ({
  onClose,
  onTokenSelect,
  type,
  useMargin,
}: {
  onClose: () => void
  onTokenSelect: (x: string) => void
  type: string
  useMargin: boolean
}) => {
  const { t } = useTranslation(['common', 'swap'])
  const [search, setSearch] = useState('')
  const tokens = mangoStore.getState().jupiterTokens
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  // const jupiterTokens = mangoStore((s) => s.jupiterTokens)
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)
  const group = mangoStore((s) => s.group)

  // const popularTokens = useMemo(() => {
  //   return tokens.filter((token) => {
  //     return !token?.name || !token?.symbol
  //       ? false
  //       : popularTokenSymbols.includes(token.symbol)
  //   })
  // }, [tokens])

  useEffect(() => {
    function onEscape(e: any) {
      if (e.keyCode === 27) {
        onClose()
      }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onClose])

  const tokenInfos = useMemo(() => {
    if (
      tokens?.length &&
      group &&
      mangoAccount &&
      outputBank &&
      type === 'input'
    ) {
      const filteredSortedTokens = tokens
        .map((token) => {
          const max = getTokenInMax(
            mangoAccount,
            token.address,
            group,
            useMargin
          )
          return { ...token, ...max }
        })
        .filter((token) => (token.symbol === outputBank?.name ? false : true))
        .sort((a, b) =>
          useMargin
            ? Number(b.amountWithBorrow) - Number(a.amountWithBorrow)
            : Number(b.amount) - Number(a.amount)
        )

      return filteredSortedTokens
    } else if (tokens?.length) {
      const filteredTokens = tokens
        .map((token) => ({
          ...token,
          amount: new Decimal(0),
          amountWithBorrow: new Decimal(0),
        }))
        .filter((token) => (token.symbol === inputBank?.name ? false : true))
      return filteredTokens
    } else {
      return []
    }
  }, [tokens, walletTokens, inputBank, outputBank, mangoAccount, group])

  // const handleUpdateSearch = (e: ChangeEvent<HTMLInputElement>) => {
  //   setSearch(e.target.value)
  // }

  // const sortedTokens = search ? startSearch(tokenInfos, search) : tokenInfos
  const sortedTokens = tokenInfos

  return (
    <>
      <p className="mb-3">
        {type === 'input'
          ? `${t('swap')} ${t('swap:from')}`
          : `${t('swap')} ${t('swap:to')}`}
      </p>
      <IconButton
        className="absolute top-2 right-2 text-th-fgd-3 hover:text-th-fgd-2"
        onClick={onClose}
        hideBg
      >
        <XMarkIcon className="h-6 w-6" />
      </IconButton>
      {/* No need for search/popular tokens until we have more tokens */}

      {/* <div className="flex items-center text-th-fgd-4">
        <Input
          type="text"
          placeholder="Search by token or paste address"
          prefix={<MagnifyingGlassIcon className="h-5 w-5" />}
          autoFocus
          value={search}
          onChange={handleUpdateSearch}
        />
      </div>
      {popularTokens.length ? (
        <div className="mt-4 flex flex-wrap">
          {popularTokens.map((token) => {
            let logoURI
            if (jupiterTokens.length) {
              logoURI = jupiterTokens.find(
                (t) => t.address === token.address
              )!.logoURI
            }
            const disabled =
              (type === 'input' && token.symbol === outputBank?.name) ||
              (type === 'output' && token.symbol === inputBank?.name)
            return (
              <button
                className={`${
                  disabled ? 'opacity-20' : 'hover:border-th-fgd-3'
                } mx-1 mb-2 flex items-center rounded-md border border-th-bkg-4 py-1 px-3 focus:border-th-fgd-2`}
                onClick={() => onTokenSelect(token.address)}
                disabled={disabled}
                key={token.address}
              >
                {logoURI ? (
                  <Image alt="" width="16" height="16" src={logoURI} />
                ) : (
                  <QuestionMarkCircleIcon className="h-5 w-5 text-th-fgd-3" />
                )}
                <span className="ml-1.5 text-th-fgd-1">{token.symbol}</span>
              </button>
            )
          })}
        </div>
      ) : null} */}
      {/* <div className="my-2 border-t border-th-bkg-4"></div> */}
      <div className="mb-2 flex justify-between rounded bg-th-bkg-2 p-2">
        <p className="text-xs text-th-fgd-4">{t('token')}</p>
        {type === 'input' ? (
          <p className="text-xs text-th-fgd-4">{t('max')}</p>
        ) : null}
      </div>
      <div className="overflow-auto">
        {sortedTokens.map((token) => (
          <TokenItem
            key={token.address}
            token={token}
            onSubmit={onTokenSelect}
            useMargin={useMargin}
            type={type}
          />
        ))}
      </div>
    </>
  )
}

export default memo(SwapFormTokenList)
