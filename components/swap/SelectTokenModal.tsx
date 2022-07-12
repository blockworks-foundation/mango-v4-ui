import {
  memo,
  useMemo,
  useState,
  PureComponent,
  useEffect,
  ChangeEvent,
} from 'react'
import { SearchIcon } from '@heroicons/react/outline'
import Image from 'next/image'
import { FixedSizeList } from 'react-window'

import Modal from '../shared/Modal'
import { Token } from '../../types/jupiter'
import mangoStore from '../../store/state'

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

type ItemRendererProps = {
  data: any
  index: number
  style: any
}

class ItemRenderer extends PureComponent<ItemRendererProps> {
  render() {
    // Access the items array using the "data" prop:
    const tokenInfo: Token = this.props.data.items[this.props.index]

    return (
      <div style={this.props.style}>
        <button
          key={tokenInfo?.address}
          className="flex w-full cursor-pointer items-center justify-between rounded-none py-4 px-2 font-normal focus:bg-th-bkg-3 focus:outline-none md:hover:bg-th-bkg-4"
          onClick={() => this.props.data.onSubmit(tokenInfo.symbol)}
        >
          <div className="flex items-center">
            <picture>
              <source srcSet={tokenInfo?.logoURI} type="image/webp" />
              <img
                src={tokenInfo?.logoURI}
                width="24"
                height="24"
                alt={tokenInfo?.symbol}
              />
            </picture>
            <div className="ml-4">
              <div className="text-left text-th-fgd-2">
                {tokenInfo?.symbol || 'unknown'}
              </div>
              <div className="text-left text-th-fgd-4">
                {tokenInfo?.name || 'unknown'}
              </div>
            </div>
          </div>
        </button>
      </div>
    )
  }
}

const popularTokenSymbols = ['USDC', 'SOL', 'USDT', 'MNGO', 'BTC', 'ETH']

const SelectTokenModal = ({
  isOpen,
  onClose,
  onTokenSelect,
}: {
  isOpen: boolean
  onClose: (x?: any) => void
  onTokenSelect: (x: string) => void
}) => {
  const [search, setSearch] = useState('')
  const tokens = mangoStore.getState().jupiterTokens
  const walletTokens = mangoStore((s) => s.wallet.tokens)

  const popularTokens = useMemo(() => {
    return walletTokens?.length
      ? tokens.filter((token) => {
          const walletMints = walletTokens.map((tok) => tok.mint.toString())
          return !token?.name || !token?.symbol
            ? false
            : popularTokenSymbols.includes(token.symbol) &&
                walletMints.includes(token.address)
        })
      : tokens.filter((token) => {
          return !token?.name || !token?.symbol
            ? false
            : popularTokenSymbols.includes(token.symbol)
        })
  }, [walletTokens, tokens])

  useEffect(() => {
    function onEscape(e: any) {
      if (e.keyCode === 27) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [onClose])

  const tokenInfos = useMemo(() => {
    if (tokens?.length) {
      const filteredTokens = tokens.filter((token) => {
        return !token?.name || !token?.symbol ? false : true
      })
      if (walletTokens?.length) {
        const walletMints = walletTokens.map((tok) => tok.mint.toString())
        return filteredTokens.sort(
          (a, b) =>
            walletMints.indexOf(b.address) - walletMints.indexOf(a.address)
        )
      } else {
        return filteredTokens
      }
    } else {
      return []
    }
  }, [tokens, walletTokens])

  const handleUpdateSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const sortedTokens = search ? startSearch(tokenInfos, search) : tokenInfos

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col pb-2 md:h-2/3">
        <div className="flex items-center text-lg text-th-fgd-4">
          <SearchIcon className="h-8 w-8" />
          <input
            type="text"
            className="ml-4 flex-1 bg-transparent focus:outline-none"
            placeholder="Search by token or paste address"
            autoFocus
            value={search}
            onChange={handleUpdateSearch}
          />
        </div>
        {popularTokens.length && onTokenSelect ? (
          <div className="mt-8 flex flex-wrap">
            {popularTokens.map((token) => (
              <button
                className="mx-1 mb-2 flex items-center rounded-md border border-th-bkg-4 py-1 px-3 hover:border-th-fgd-3 focus:border-th-fgd-2"
                onClick={() => onTokenSelect(token.symbol)}
                key={token.address}
              >
                <Image
                  alt=""
                  width="16"
                  height="16"
                  src={`/icons/${token.symbol.toLowerCase()}.svg`}
                />
                <span className="ml-1.5 text-th-fgd-1">{token.symbol}</span>
              </button>
            ))}
          </div>
        ) : null}
        <div className="-ml-6 mt-2 w-[600px] border-t border-th-bkg-4"></div>
        <FixedSizeList
          width="100%"
          height={403}
          itemData={{ items: sortedTokens, onSubmit: onTokenSelect }}
          itemCount={sortedTokens.length}
          itemSize={72}
          className="thin-scroll"
        >
          {ItemRenderer}
        </FixedSizeList>
      </div>
    </Modal>
  )
}

export default memo(SelectTokenModal)
