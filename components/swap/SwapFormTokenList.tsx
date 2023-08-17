import { memo, useMemo, useEffect, useRef, useState, ChangeEvent } from 'react'
import { Token } from '../../types/jupiter'
import mangoStore from '@store/mangoStore'
import { IconButton } from '../shared/Button'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Decimal from 'decimal.js'
import { getTokenInMax } from './useTokenMax'
import useMangoAccount from 'hooks/useMangoAccount'
import useJupiterMints from 'hooks/useJupiterMints'
import useMangoGroup from 'hooks/useMangoGroup'
import { PublicKey } from '@solana/web3.js'
import FormatNumericValue from '@components/shared/FormatNumericValue'
import { formatTokenSymbol } from 'utils/tokens'
import TokenLogo from '@components/shared/TokenLogo'
import Input from '@components/forms/Input'

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
  token: TokenInfoWithAmounts
  onSubmit: (x: string) => void
  useMargin: boolean
  type: 'input' | 'output' | undefined
}) => {
  const { t } = useTranslation('trade')
  const { address, symbol, name } = token

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group) return
    return group.getFirstBankByMint(new PublicKey(address))
  }, [address])

  const isReduceOnly = useMemo(() => {
    if (!bank) return false
    const borrowsReduceOnly = bank.areBorrowsReduceOnly()
    const depositsReduceOnly = bank.areDepositsReduceOnly()
    return borrowsReduceOnly && depositsReduceOnly
  }, [bank])

  return (
    <div>
      <button
        key={address}
        className={`flex w-full cursor-pointer items-center justify-between rounded-md p-2 font-normal focus:outline-none focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2`}
        onClick={() => onSubmit(address)}
      >
        <div className="flex items-center">
          <TokenLogo bank={bank} />
          <div className="ml-2.5">
            <p className="text-left text-th-fgd-2">
              {bank?.name ? formatTokenSymbol(bank.name) : symbol || 'unknown'}
              {isReduceOnly ? (
                <span className="ml-1.5 text-xxs text-th-warning">
                  {t('reduce-only')}
                </span>
              ) : null}
            </p>

            <p className="text-left text-xs text-th-fgd-4">
              {name || 'unknown'}
            </p>
          </div>
        </div>
        {type === 'input' &&
        token.amount &&
        token.amountWithBorrow &&
        token.decimals ? (
          <p className="font-mono text-sm text-th-fgd-2">
            {useMargin ? (
              <FormatNumericValue
                value={token.amountWithBorrow}
                decimals={token.decimals}
              />
            ) : (
              <FormatNumericValue
                value={token.amount}
                decimals={token.decimals}
              />
            )}
          </p>
        ) : null}
      </button>
    </div>
  )
}

interface TokenInfoWithAmounts extends Token {
  amount?: Decimal
  amountWithBorrow?: Decimal
}

const SwapFormTokenList = ({
  onClose,
  onTokenSelect,
  type,
  useMargin,
}: {
  onClose: () => void
  onTokenSelect: (x: string) => void
  type: 'input' | 'output' | undefined
  useMargin: boolean
}) => {
  const { t } = useTranslation(['common', 'search', 'swap'])
  const [search, setSearch] = useState('')
  const { mangoTokens } = useJupiterMints()
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)
  const { group } = useMangoGroup()
  const { mangoAccount } = useMangoAccount()
  const focusRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onEscape(e: KeyboardEvent) {
      if (e.keyCode === 27) {
        onClose()
      }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onClose])

  const tokenInfos: TokenInfoWithAmounts[] = useMemo(() => {
    if (
      mangoTokens?.length &&
      group &&
      mangoAccount &&
      outputBank &&
      inputBank &&
      type === 'input'
    ) {
      const filteredSortedTokens = mangoTokens
        .map((token) => {
          const max = getTokenInMax(
            mangoAccount,
            new PublicKey(token.address),
            outputBank.mint,
            group,
            useMargin,
          )
          return { ...token, ...max }
        })
        .filter((token) => (token.symbol === outputBank?.name ? false : true))
        .sort((a, b) =>
          useMargin
            ? Number(b.amountWithBorrow) - Number(a.amountWithBorrow)
            : Number(b.amount) - Number(a.amount),
        )

      return filteredSortedTokens
    } else if (mangoTokens?.length) {
      const filteredTokens = mangoTokens
        .map((token) => ({
          ...token,
          amount: new Decimal(0),
          amountWithBorrow: new Decimal(0),
        }))
        .filter((token) => (token.symbol === inputBank?.name ? false : true))
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
      return filteredTokens
    } else {
      return []
    }
  }, [mangoTokens, inputBank, outputBank, mangoAccount, group, useMargin, type])

  const handleUpdateSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const sortedTokens = search ? startSearch(tokenInfos, search) : tokenInfos

  useEffect(() => {
    if (focusRef?.current) {
      focusRef.current.focus()
    }
  }, [focusRef])

  return (
    <>
      <p className="mb-3">
        {type === 'input'
          ? t('swap:you-sell')
          : type === 'output'
          ? t('swap:you-buy')
          : ''}
      </p>
      <IconButton
        className="absolute right-2 top-2 text-th-fgd-3 hover:text-th-fgd-2"
        onClick={onClose}
        hideBg
      >
        <XMarkIcon className="h-6 w-6" />
      </IconButton>
      <div className="relative mb-4">
        <Input
          className="pl-10"
          type="text"
          placeholder="Search by token or paste address"
          autoFocus
          value={search}
          onChange={handleUpdateSearch}
          ref={focusRef}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5" />
      </div>
      <div className="flex justify-between rounded bg-th-bkg-2 p-2">
        <p className="text-xs text-th-fgd-4">{t('token')}</p>
        {type === 'input' ? (
          <p className="text-xs text-th-fgd-4">{t('max')}</p>
        ) : null}
      </div>
      <div className="thin-scroll h-[calc(100%-128px)] overflow-auto py-2">
        {sortedTokens?.length ? (
          sortedTokens.map((token) => (
            <TokenItem
              key={token.address}
              token={token}
              onSubmit={onTokenSelect}
              useMargin={useMargin}
              type={type}
            />
          ))
        ) : (
          <div className="mt-2 rounded-md border border-th-bkg-3 p-3">
            <p className="text-center">{t('search:no-results')}</p>
          </div>
        )}
      </div>
    </>
  )
}

export default memo(SwapFormTokenList)
