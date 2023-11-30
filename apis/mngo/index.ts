import { Group } from '@blockworks-foundation/mango-v4'
import { MangoTokenStatsItem, TokenStatsItem } from 'types'
import { MANGO_DATA_API_URL } from 'utils/constants'

export const fetchTokenStatsData = async (group: Group) => {
  const response = await fetch(
    `${MANGO_DATA_API_URL}/token-historical-stats?mango-group=${group?.publicKey.toString()}`,
  )
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  return response.json()
}

export const processTokenStatsData = (
  data: TokenStatsItem[] | unknown,
  group: Group,
) => {
  const mangoStatsMap: Record<string, MangoTokenStatsItem> = {}
  if (!Array.isArray(data)) return []
  data.forEach((c) => {
    const bank = group.banksMapByTokenIndex.get(c.token_index)?.[0]
    if (!bank) return

    const date: string = c.date_hour
    const uiPrice = bank.uiPrice

    if (!mangoStatsMap[date]) {
      mangoStatsMap[date] = {
        date,
        depositValue: 0,
        borrowValue: 0,
        feesCollected: 0,
      }
    }

    mangoStatsMap[date].depositValue += Math.floor(c.total_deposits * c.price)
    mangoStatsMap[date].borrowValue += Math.floor(c.total_borrows * c.price)
    mangoStatsMap[date].feesCollected += c.collected_fees * uiPrice
  })

  // add most recent value
  for (const banks of group.banksMapByTokenIndex.values()) {
    const bank = banks[0]
    const now = new Date().toISOString()

    let tokenStatsItem: TokenStatsItem = {
      borrow_apr: 0,
      borrow_rate: bank.getBorrowRateUi(),
      collected_fees: 0,
      date_hour: now,
      deposit_apr: 0,
      deposit_rate: bank.getDepositRateUi(),
      mango_group: bank.group.toBase58(),
      price: bank.uiPrice,
      symbol: bank.name,
      token_index: bank.tokenIndex,
      total_borrows: bank.uiBorrows(),
      total_deposits: bank.uiDeposits(),
    }
    data.push(tokenStatsItem)
  }

  const mangoStats: MangoTokenStatsItem[] = Object.values(mangoStatsMap)
  mangoStats.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  return [data, mangoStats]
}
