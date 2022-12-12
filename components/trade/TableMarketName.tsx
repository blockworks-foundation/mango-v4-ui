import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import useSelectedMarket from 'hooks/useSelectedMarket'
import Link from 'next/link'
import MarketLogos from './MarketLogos'

const TableMarketName = ({ market }: { market: PerpMarket | Serum3Market }) => {
  const { selectedMarket } = useSelectedMarket()
  return selectedMarket?.name === market.name ? (
    <div className="flex items-center">
      <MarketLogos market={market!} />
      {market.name}
    </div>
  ) : (
    <Link href={`/trade?name=${market.name}`}>
      <div className="default-transition flex items-center underline md:hover:text-th-fgd-3 md:hover:no-underline">
        <MarketLogos market={market!} />
        {market.name}
      </div>
    </Link>
  )
}

export default TableMarketName
