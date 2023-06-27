import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import useSelectedMarket from 'hooks/useSelectedMarket'
import Link from 'next/link'
import { useRouter } from 'next/router'
import MarketLogos from './MarketLogos'
import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/20/solid'

const TableMarketName = ({
  market,
  side,
}: {
  market: PerpMarket | Serum3Market
  side?: 'buy' | 'sell'
}) => {
  const { selectedMarket } = useSelectedMarket()
  const { asPath } = useRouter()

  return selectedMarket?.name === market.name && asPath.includes('/trade') ? (
    <div
      className={`flex items-center ${
        side === 'buy'
          ? 'text-th-up'
          : side === 'sell'
          ? 'text-th-down'
          : 'text-th-fgd-2'
      }`}
    >
      <NameAndSide market={market} side={side} />
    </div>
  ) : (
    <Link href={`/trade?name=${market.name}`}>
      <div
        className={`flex items-center underline underline-offset-2 md:underline-offset-4 md:hover:text-th-fgd-3 md:hover:no-underline ${
          side === 'buy'
            ? 'text-th-up'
            : side === 'sell'
            ? 'text-th-down'
            : 'text-th-fgd-2'
        }`}
      >
        <NameAndSide market={market} side={side} />
      </div>
    </Link>
  )
}

export default TableMarketName

const NameAndSide = ({
  market,
  side,
}: {
  market: PerpMarket | Serum3Market
  side?: 'buy' | 'sell'
}) => {
  return (
    <>
      <MarketLogos market={market} size="large" />
      <span className="mr-1 whitespace-nowrap">{market.name}</span>
      {side === 'buy' ? (
        <ArrowTrendingUpIcon className="h-5 w-5" />
      ) : side === 'sell' ? (
        <ArrowTrendingDownIcon className="h-5 w-5" />
      ) : null}
    </>
  )
}
