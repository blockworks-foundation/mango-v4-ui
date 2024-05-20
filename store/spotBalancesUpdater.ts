import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { SpotBalances } from 'types'
import mangoStore from './mangoStore'
import { OpenOrders } from '@project-serum/serum'
import { OpenOrdersAccount } from '@openbook-dex/openbook-v2'
import { BN } from '@coral-xyz/anchor'

const spotBalancesUpdater = () => {
  const mangoAccount = mangoStore.getState().mangoAccount.current
  const group = mangoStore.getState().group
  const openOrdersAccounts =
    mangoStore.getState().mangoAccount.openOrderAccounts
  const set = mangoStore.getState().set

  if (!mangoAccount || !group) return

  const balances: SpotBalances = {}

  for (const serumMarket of mangoAccount.serum3Active()) {
    const market = group.getSerum3MarketByMarketIndex(serumMarket.marketIndex)
    if (!market) continue
    const openOrdersAccForMkt = openOrdersAccounts.find((oo) =>
      oo.market.equals(market.serumMarketExternal),
    ) as OpenOrders | undefined

    let baseTokenUnsettled = 0
    let quoteTokenUnsettled = 0
    let baseTokenLockedInOrder = 0
    let quoteTokenLockedInOrder = 0
    if (openOrdersAccForMkt) {
      baseTokenUnsettled = toUiDecimals(
        openOrdersAccForMkt.baseTokenFree.toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.baseTokenIndex).mintDecimals,
      )
      quoteTokenUnsettled = toUiDecimals(
        openOrdersAccForMkt.quoteTokenFree
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .add((openOrdersAccForMkt as any)['referrerRebatesAccrued'])
          .toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.quoteTokenIndex)
          .mintDecimals,
      )
      baseTokenLockedInOrder = toUiDecimals(
        openOrdersAccForMkt.baseTokenTotal
          .sub(openOrdersAccForMkt.baseTokenFree)
          .toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.baseTokenIndex).mintDecimals,
      )
      quoteTokenLockedInOrder = toUiDecimals(
        openOrdersAccForMkt.quoteTokenTotal
          .sub(openOrdersAccForMkt.quoteTokenFree)
          .toNumber(),
        group.getFirstBankByTokenIndex(serumMarket.quoteTokenIndex)
          .mintDecimals,
      )
    }

    let quoteBalances =
      balances[
        group
          .getSerum3ExternalMarket(market.serumMarketExternal)
          .quoteMintAddress.toString()
      ]
    if (!quoteBalances) {
      quoteBalances = balances[
        group
          .getSerum3ExternalMarket(market.serumMarketExternal)
          .quoteMintAddress.toString()
      ] = { inOrders: 0, unsettled: 0 }
    }
    quoteBalances.inOrders += quoteTokenLockedInOrder || 0
    quoteBalances.unsettled += quoteTokenUnsettled

    let baseBalances =
      balances[
        group
          .getSerum3ExternalMarket(market.serumMarketExternal)
          .baseMintAddress.toString()
      ]
    if (!baseBalances) {
      baseBalances = balances[
        group
          .getSerum3ExternalMarket(market.serumMarketExternal)
          .baseMintAddress.toString()
      ] = { inOrders: 0, unsettled: 0 }
    }
    baseBalances.inOrders += baseTokenLockedInOrder
    baseBalances.unsettled += baseTokenUnsettled
  }

  for (const openbook of mangoAccount.openbookV2Active()) {
    const market = group.getOpenbookV2MarketByMarketIndex(openbook.marketIndex)
    if (!market) continue

    const openOrdersAccForMkt = openOrdersAccounts.find((oo) =>
      oo.market.equals(market.openbookMarketExternal),
    ) as OpenOrdersAccount | undefined

    if (openOrdersAccForMkt) {
      const {
        asksBaseLots,
        bidsQuoteLots,
        baseFreeNative,
        quoteFreeNative,
        lockedMakerFees,
      } = openOrdersAccForMkt.position

      const { baseLotSize, baseTokenIndex, quoteLotSize, quoteTokenIndex } =
        openbook

      const baseLockedNative = new BN(baseLotSize).imul(asksBaseLots)
      const quoteLockedNative = new BN(quoteLotSize)
        .imul(bidsQuoteLots)
        .iadd(lockedMakerFees)

      const baseBank = group.getFirstBankByTokenIndex(baseTokenIndex)
      const quoteBank = group.getFirstBankByTokenIndex(quoteTokenIndex)
      const baseMint = baseBank.mint.toString()
      const quoteMint = quoteBank.mint.toString()

      const baseBalances = (balances[baseMint] ??= {
        inOrders: 0,
        unsettled: 0,
      })
      baseBalances.inOrders += toUiDecimals(
        baseLockedNative,
        baseBank.mintDecimals,
      )
      baseBalances.unsettled += toUiDecimals(
        baseFreeNative,
        baseBank.mintDecimals,
      )

      const quoteBalances = (balances[quoteMint] ??= {
        inOrders: 0,
        unsettled: 0,
      })
      quoteBalances.inOrders += toUiDecimals(
        quoteLockedNative,
        quoteBank.mintDecimals,
      )
      quoteBalances.unsettled += toUiDecimals(
        quoteFreeNative,
        quoteBank.mintDecimals,
      )
    }
  }

  set((s) => {
    s.mangoAccount.spotBalances = balances
  })
}

export default spotBalancesUpdater
