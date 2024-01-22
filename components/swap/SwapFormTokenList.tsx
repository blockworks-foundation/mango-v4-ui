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
import { getTokenBalance } from './TriggerSwapForm'
import { walletBalanceForToken } from '@components/DepositForm'
import TokenReduceOnlyDesc from '@components/shared/TokenReduceOnlyDesc'
import PopularSwapTokens from './PopularSwapTokens'
import { useViewport } from 'hooks/useViewport'

export type SwapFormTokenListType =
  | 'input'
  | 'output'
  | 'reduce-input'
  | 'reduce-output'
  | 'wallet-input'
  | undefined

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
  type: SwapFormTokenListType
}) => {
  const { t } = useTranslation('trade')
  const { address, symbol, name } = token

  const bank = useMemo(() => {
    const group = mangoStore.getState().group
    if (!group) return
    // if we want to let users swap from tokens not listed on Mango.

    // if (type === 'wallet-input') {
    //   const hasBank = Array.from(group.banksMapByName.values())
    //     .map((b) => b[0].mint.toString())
    //     .find((mint) => mint === address)
    //   if (hasBank) {
    //     return group.getFirstBankByMint(new PublicKey(address))
    //   }
    // }

    return group.getFirstBankByMint(new PublicKey(address))
  }, [address, type])

  // const isReduceOnly = useMemo(() => {
  //   if (!bank) return false
  //   const borrowsReduceOnly = bank.areBorrowsReduceOnly()
  //   const depositsReduceOnly = bank.areDepositsReduceOnly()
  //   return borrowsReduceOnly && depositsReduceOnly
  // }, [bank])

  return (
    <div>
      <button
        key={address}
        className={`flex w-full cursor-pointer items-center justify-between rounded-md p-2 font-normal focus:outline-none focus-visible:bg-th-bkg-3 md:hover:bg-th-bkg-2`}
        onClick={() => onSubmit(address)}
      >
        <div className="flex items-center">
          <TokenLogo bank={bank} logoUrl={!bank ? token.logoURI : ''} />
          <div className="ml-2.5">
            <p className="text-left text-th-fgd-2">
              {bank?.name ? formatTokenSymbol(bank.name) : symbol || 'unknown'}
              {type === 'reduce-input' && token.amount ? (
                <span
                  className={`ml-1 rounded px-1 text-xxs uppercase ${
                    token.amount.gt(0) ? 'text-th-up' : 'text-th-down'
                  }`}
                >
                  {t(`trade:${token.amount.gt(0) ? 'long' : 'short'}`)}
                </span>
              ) : null}
              <span className="ml-1">
                <TokenReduceOnlyDesc bank={bank} />
              </span>
            </p>

            <p className="text-left text-xs text-th-fgd-4">
              {name || 'unknown'}
            </p>
          </div>
        </div>
        {type === 'input' || type === 'reduce-input' ? (
          <p className="font-mono text-sm text-th-fgd-2">
            {useMargin ? (
              <FormatNumericValue
                value={token.amountWithBorrow || 0}
                decimals={token.decimals}
              />
            ) : (
              <FormatNumericValue
                value={token.amount || 0}
                decimals={token.decimals}
              />
            )}
          </p>
        ) : type === 'wallet-input' ? (
          <p className="font-mono text-sm text-th-fgd-2">
            <FormatNumericValue
              value={token.amount || 0}
              decimals={token.decimals}
            />
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
  walletSwap,
}: {
  onClose: () => void
  onTokenSelect: (mintAddress: string, close: () => void) => void
  type: SwapFormTokenListType
  useMargin: boolean
  walletSwap?: boolean
}) => {
  const { t } = useTranslation(['common', 'search', 'swap'])
  const [search, setSearch] = useState('')
  const { mangoTokens, jupiterTokens } = useJupiterMints()
  const inputBank = mangoStore((s) => s.swap.inputBank)
  const outputBank = mangoStore((s) => s.swap.outputBank)
  const walletTokens = mangoStore((s) => s.wallet.tokens)
  const { group } = useMangoGroup()
  const { mangoAccount, mangoAccountAddress } = useMangoAccount()
  const focusRef = useRef<HTMLInputElement>(null)
  const { isDesktop } = useViewport()

  const handleTokenSelect = (mintAddress: string) => {
    onTokenSelect(mintAddress, onClose)
  }

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
    if (!mangoTokens.length || !group || !outputBank || !inputBank) return []
    if (type === 'input') {
      const filteredSortedTokens = mangoTokens
        .map((token) => {
          const tokenPk = new PublicKey(token.address)
          const tokenBank = group.getFirstBankByMint(tokenPk)
          const max = mangoAccount
            ? getTokenInMax(mangoAccount, tokenPk, outputBank.mint, group)
            : {
                amount: new Decimal(0),
                amountWithBorrow: new Decimal(0),
                decimals: 0,
              }
          const price = tokenBank.uiPrice
          return { ...token, ...max, price }
        })
        .filter((token) => (token.symbol === outputBank.name ? false : true))
        .sort((a, b) =>
          useMargin
            ? Number(b.amountWithBorrow.mul(b.price)) -
              Number(a.amountWithBorrow.mul(a.price))
            : Number(b.amount.mul(b.price)) - Number(a.amount.mul(a.price)),
        )

      return filteredSortedTokens
    } else if (type === 'reduce-input') {
      const filteredSortedTokens = mangoTokens
        .map((token) => {
          const tokenBank = group.getFirstBankByMint(
            new PublicKey(token.address),
          )
          const uiAmount = mangoAccount
            ? mangoAccount.getTokenBalanceUi(tokenBank)
            : 0
          const uiDollarValue = uiAmount * tokenBank.uiPrice
          return {
            ...token,
            amount: new Decimal(uiAmount),
            amountWithBorrow: new Decimal(uiAmount),
            absDollarValue: Math.abs(uiDollarValue),
            decimals: inputBank.mintDecimals,
          }
        })
        .filter(
          (token) =>
            token.symbol !== outputBank.name && token.absDollarValue > 0.0001,
        )
        .sort((a, b) => b.absDollarValue - a.absDollarValue)

      return filteredSortedTokens
    } else if (type === 'wallet-input' && jupiterTokens.length) {
      // if we want to let users swap from tokens not listed on Mango. Some other changes are need to pass the mint to the swap function

      // const jupiterTokensWithAmount = []
      // for (const token of jupiterTokens) {
      //   const hasToken = walletTokens.find(
      //     (t) => t.mint.toString() === token.address,
      //   )
      //   if (hasToken) {
      //     jupiterTokensWithAmount.push({
      //       ...token,
      //       amount: new Decimal(hasToken.uiAmount),
      //     })
      //   }
      // }
      // const filteredSortedTokens = jupiterTokensWithAmount
      //   .filter((token) =>
      //     token.symbol !== outputBank.name && token.amount.gt(0) ? true : false,
      //   )
      //   .sort((a, b) => Number(b.amount) - Number(a.amount))

      const filteredSortedTokens = mangoTokens
        .map((token) => {
          const tokenBank = group.getFirstBankByMint(
            new PublicKey(token.address),
          )
          const max = walletBalanceForToken(
            walletTokens,
            tokenBank.name,
            walletSwap,
          )
          const price = tokenBank.uiPrice
          return {
            ...token,
            amount: new Decimal(max.maxAmount),
            decimals: max.maxDecimals,
            price,
          }
        })
        .filter((token) => (token.symbol === outputBank.name ? false : true))
        .sort(
          (a, b) =>
            Number(b.amount.mul(b.price)) - Number(a.amount.mul(a.price)),
        )

      return filteredSortedTokens
    } else if (mangoTokens.length) {
      const filteredTokens = mangoTokens
        .map((token) => ({
          ...token,
          amount: new Decimal(0),
          amountWithBorrow: new Decimal(0),
        }))
        .filter((token) => (token.symbol === inputBank.name ? false : true))
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
      return filteredTokens
    } else return []
  }, [
    mangoTokens,
    jupiterTokens,
    inputBank,
    outputBank,
    mangoAccount,
    group,
    useMargin,
    type,
  ])

  const handleUpdateSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const sortedTokens = search ? startSearch(tokenInfos, search) : tokenInfos

  useEffect(() => {
    if (focusRef?.current && isDesktop) {
      focusRef.current.focus()
    }
  }, [focusRef, isDesktop])

  const listTitle = useMemo(() => {
    if (!type) return ''
    if (type === 'input' || type === 'wallet-input') {
      return t('swap:you-sell')
    } else if (type === 'output') {
      return t('swap:you-buy')
    } else if (type === 'reduce-input') {
      return t('swap:reduce-position')
    } else {
      if (!mangoAccountAddress || !inputBank) return ''
      const uiPos = getTokenBalance(inputBank)
      if (uiPos > 0) {
        return t('swap:reduce-position-buy')
      } else if (uiPos < 0) {
        return t('swap:reduce-position-sell')
      }
    }
  }, [inputBank, mangoAccountAddress, type])

  return (
    <>
      <p className="mb-3">{listTitle}</p>
      <IconButton
        className="absolute right-2 top-2 text-th-fgd-3 hover:text-th-fgd-2"
        onClick={onClose}
        hideBg
      >
        <XMarkIcon className="h-6 w-6" />
      </IconButton>
      <div className="relative">
        <Input
          className="pl-10"
          type="text"
          placeholder="Search by token or paste address"
          value={search}
          onChange={handleUpdateSearch}
          ref={focusRef}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-th-fgd-3" />
      </div>
      {!type?.includes('reduce') ? (
        <div className="pt-2">
          <PopularSwapTokens setSwapToken={handleTokenSelect} type={type} />
        </div>
      ) : null}
      <div className="mt-4 flex justify-between rounded bg-th-bkg-2 p-2">
        <p className="text-xs text-th-fgd-4">{t('token')}</p>
        {!type?.includes('output') ? (
          <p className="text-xs text-th-fgd-4">{t('max')}</p>
        ) : null}
      </div>
      <div
        className={`thin-scroll ${
          !type?.includes('reduce')
            ? 'h-[calc(100%-170px)]'
            : 'h-[calc(100%-128px)]'
        } overflow-auto py-2`}
      >
        {sortedTokens?.length ? (
          sortedTokens.map((token) => (
            <TokenItem
              key={token.address}
              token={token}
              onSubmit={handleTokenSelect}
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
