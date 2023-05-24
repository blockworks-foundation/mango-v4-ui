import { Group } from '@blockworks-foundation/mango-v4'
import { calculateTradingParameters } from './listingTools'
import { Market } from '@project-serum/serum'
import { Connection, PublicKey } from '@solana/web3.js'

//this will be moved to other repository before merge
export async function getTokenExcel(
  group: Group | undefined,
  connection: Connection,
  dexProgramPk: PublicKey
) {
  if (!group) {
    console.log('error')
    return
  }
  const rows = []
  const tokens = [...group.banksMapByName.values()].flatMap((x) => x[0])
  for (const baseToken of tokens) {
    for (const quoteToken of tokens) {
      const baseMint = baseToken.mint
      const quoteMint = quoteToken.mint

      if (!baseMint.equals(quoteMint)) {
        const calcedParams = calculateTradingParameters(
          baseToken.uiPrice,
          quoteToken.uiPrice,
          baseToken.mintDecimals,
          quoteToken.mintDecimals
        )
        const mangoMarkets = [...group.serum3ExternalMarketsMap.values()]
        const mangoParams = mangoMarkets.find(
          (x) =>
            x.quoteMintAddress.equals(quoteMint) &&
            x.baseMintAddress.equals(baseMint)
        )

        const markets = await Market.findAccountsByMints(
          connection,
          baseMint,
          quoteMint,
          dexProgramPk
        )
        const decodedMarkets = await markets
          .map(
            (x) =>
              new Market(
                Market.getLayout(dexProgramPk).decode(x.accountInfo.data),
                baseToken.mintDecimals,
                quoteToken.mintDecimals,
                {},
                dexProgramPk
              )
          )
          .sort(
            (a, b) =>
              b.decoded.baseDepositsTotal.toNumber() -
              a.decoded.baseDepositsTotal.toNumber()
          )
        const mostUsedMarket = decodedMarkets?.length ? decodedMarkets[0] : null

        try {
          const obj = {
            pair: `${baseToken.name}/${quoteToken.name}`,
            baseToken: baseToken.name,
            basePrice: baseToken.uiPrice,
            baseDecimals: baseToken.mintDecimals,
            quoteToken: quoteToken.name,
            quotePrice: quoteToken.uiPrice,
            quoteDecimals: quoteToken.mintDecimals,
            //params from tool
            baseLotExponent: calcedParams.baseLotExponent,
            minOrderSize: calcedParams.minOrder,
            minOrderValue: calcedParams.minOrderValue,
            quoteLotExponent: calcedParams.quoteLotExponent,
            priceIncrement: calcedParams.priceTick,
            priceIncrementRelative: calcedParams.priceIncrementRelative,
            //serum market
            market_baseLotExponent: mangoParams
              ? Math.log10(mangoParams.decoded.baseLotSize.toNumber())
              : mostUsedMarket
              ? Math.log10(mostUsedMarket.decoded.baseLotSize.toNumber())
              : '',
            market_minOrderSize: mangoParams
              ? mangoParams.minOrderSize
              : mostUsedMarket
              ? mostUsedMarket.minOrderSize
              : '',
            market_minOrderValue: mangoParams
              ? mangoParams.minOrderSize * baseToken.uiPrice
              : mostUsedMarket
              ? mostUsedMarket.minOrderSize * baseToken.uiPrice
              : '',
            market_quoteLotExponent: mangoParams
              ? Math.log10(mangoParams.decoded.quoteLotSize.toNumber())
              : mostUsedMarket
              ? Math.log10(mostUsedMarket.decoded.quoteLotSize.toNumber())
              : '',
            market_priceIncrement: mangoParams
              ? mangoParams.tickSize
              : mostUsedMarket
              ? mostUsedMarket.tickSize
              : '',
            market_priceIncrementRelative: mangoParams
              ? mangoParams.tickSize * baseToken.uiPrice
              : mostUsedMarket
              ? mostUsedMarket.tickSize * baseToken.uiPrice
              : '',
          }
          rows.push(obj)
        } catch (e) {
          console.log(e)
        }
      }
    }
  }
  console.log(rows)
}
