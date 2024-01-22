/**
 * @jest-environment node
 */

import { Connection } from '@solana/web3.js'
import { getClient, getGroupForClient } from './utils'
import { Group, MangoClient } from '@blockworks-foundation/mango-v4'
import { getFormattedBankValues } from 'utils/governance/listingTools'
import { MANGO_MAINNET_GROUP } from 'utils/constants'

describe('Bank formatting function', () => {
  let client: MangoClient
  let group: Group

  // Asynchronous setup before all tests
  beforeAll(async () => {
    const connection = new Connection(
      'https://mango.rpcpool.com/946ef7337da3f5b8d3e4a34e7f88',
    )
    client = await getClient(connection)
    group = await getGroupForClient(client, MANGO_MAINNET_GROUP)
  })

  it('Format all banks without errors', async () => {
    Array.from(group.banksMapByMint)
      .map(([_mintAddress, banks]) => banks)
      .map((b) => b[0])
      .forEach((x) => {
        const formatted = getFormattedBankValues(group, x)
        expect(formatted.name === x.name)
      })
  })
})
