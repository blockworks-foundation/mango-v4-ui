import { NEXT_PUBLIC_BIRDEYE_API_KEY } from 'apis/birdeye/helpers'
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { offset = 0 } = req.query

  // Check if the API key is defined or provide a default/fallback value
  const apiKey = NEXT_PUBLIC_BIRDEYE_API_KEY // Consider a fallback if environment variable might not be set
  const options = {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
    },
  }

  try {
    // Fetch the initial list of tokens
    const response = await fetch(
      `https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hUSD&sort_type=desc&offset=${offset}&limit=50`,
      options,
    )

    const tokenListResponse = await response.json()
    const tokenList = tokenListResponse['data']['tokens']
    const filteredTokens = []

    // Loop through each token to check additional criteria
    for (const token of tokenList) {
      const { address, v24hUSD } = token
      if (v24hUSD > 50000) {
        const now = new Date()
        const nowInSeconds = Math.floor(now.getTime() / 1000)
        const pastDate = new Date()
        pastDate.setDate(pastDate.getDate() - 4)
        pastDate.setMonth(pastDate.getMonth() - 1.5)
        const pastDateInSeconds = Math.floor(pastDate.getTime() / 1000)

        // Fetch history for the token
        const historyResponse = await fetch(
          `https://public-api.birdeye.so/defi/history_price?address=${address}&address_type=token&type=1D&time_from=${pastDateInSeconds}&time_to=${nowInSeconds}`,
          options,
        )
        const historyData = await historyResponse.json()
        if (historyData['data']['items']?.length >= 35) {
          const detailResponse = await fetch(
            `https://public-api.birdeye.so/defi/token_overview?address=${address}`,
            options,
          )
          const tokenDetails = await detailResponse.json()
          if (
            tokenDetails['data']['mc'] > 15000000 &&
            tokenDetails['data']['numberMarkets'] > 10
          ) {
            // market cap greater than 1 mil
            filteredTokens.push(tokenDetails['data'])
          }
        }
      }
    }
    // Return the filtered list of tokens
    res.status(200).json(filteredTokens)
  } catch (error) {
    console.error('Failed to fetch tokens:', error)
    res.status(500).json({ error: 'Failed to fetch tokens' })
  }
}
