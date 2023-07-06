import { PerpMarket, Serum3Market } from '@blockworks-foundation/mango-v4'
import useSelectedMarket from 'hooks/useSelectedMarket'
import Link from 'next/link'
import { useRouter } from 'next/router'
import MarketLogos from './MarketLogos'
import { useTranslation } from 'next-i18next'

const TableMarketName = ({
  market,
  side,
}: {
  market: PerpMarket | Serum3Market
  side?: string
}) => {
  const { selectedMarket } = useSelectedMarket()
  const { asPath } = useRouter()

  return selectedMarket?.name === market.name && asPath.includes('/trade') ? (
    <NameAndSide market={market} side={side} />
  ) : (
    <Link href={`/trade?name=${market.name}`}>
      <NameAndSide market={market} side={side} />
    </Link>
  )
}

export default TableMarketName

const NameAndSide = ({
  market,
  side,
}: {
  market: PerpMarket | Serum3Market
  side?: string
}) => {
  const { t } = useTranslation('common')
  const textColor =
    side === 'buy' || side === 'long'
      ? 'text-th-up'
      : side === 'sell' || side === 'short'
      ? 'text-th-down'
      : 'text-th-fgd-2'
  return (
    <div className="flex items-center">
      <MarketLogos market={market} size="large" />
      <div>
        <span className="whitespace-nowrap">{market.name}</span>
        {side ? (
          <div className="mt-0.5 flex items-center">
            <p
              className={`mr-1 font-body text-xs uppercase no-underline ${textColor}`}
            >
              {t(side)}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}
