import { PublicKey } from '@solana/web3.js'

export const MANGO_REALM_PK = new PublicKey(
  'DPiH3H3c7t47BMxqTxLsuPQpEC6Kne8GA9VXbxpnZxFE',
)

export const MANGO_SECURITY_REALM_PK = new PublicKey(
  'AQbsV8b3Yv3UHUmd62hw9vFmNTHgBTdiLfaWzwmVfXB2',
)
export const MANGO_SECURITY_COUNCIL_MINT = new PublicKey(
  'HCZ4rgExnFkACvdbtnuMKFRn5ZELuQYyLKWyPuwRaCGS',
)

export const MANGO_SECURITY_COUNCIL_WALLET = new PublicKey(
  'B89yKk4eaQqxSFnDQStTpmCqSdxofqk2RaaacCPVxuvD',
)
export const MANGO_GOVERNANCE_PROGRAM = new PublicKey(
  'GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J',
)

export const VOTER_INFO_EVENT_NAME = 'VoterInfo'
export const DEPOSIT_EVENT_NAME = 'DepositEntryInfo'
// The wallet can be any existing account for the simulation
// Note: when running a local validator ensure the account is copied from devnet: --clone ENmcpFCpxN1CqyUjuog9yyUVfdXBKF3LVCwLr7grJZpk -ud
export const SIMULATION_WALLET = 'ENmcpFCpxN1CqyUjuog9yyUVfdXBKF3LVCwLr7grJZpk'

export const MANGO_MINT = new PublicKey(
  'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
)

export const MANGO_DAO_WALLET_GOVERNANCE = new PublicKey(
  '7zGXUAeUkY9pEGfApsY26amibvqsf2dmty1cbtxHdfaQ',
)
export const MANGO_DAO_SECURITY_WALLET_GOVERNANCE = new PublicKey(
  'GChgcmMjyPH7B3sHY6ZoHGxXJhW2u5TkwQLxeDoU5JeF',
)

export const MANGO_DAO_FAST_LISTING_GOVERNANCE = new PublicKey(
  '7D6tGmaMyC8i73Q8X2Fec2S1Zb5rkyai6pctdMqHpHWT',
)

export const MANGO_DAO_FAST_LISTING_WALLET = new PublicKey(
  'Fmt4596j4uBvYutwQ2ZBw7RGw9EngR8yNijdqemnpiaB',
)

export const MANGO_DAO_WALLET = new PublicKey(
  '5tgfd6XgwiXB9otEnzFpXK11m7Q7yZUaAJzWK4oT5UGF',
)

export const MANGO_MINT_DECIMALS = 6

export const MAINNET_PYTH_PROGRAM = new PublicKey(
  'FsJ3A3u2vn5cTVofAjvy6y5kwABJAqYWpe4975bi2epH',
)
export const DEVNET_PYTH_PROGRAM = new PublicKey(
  'gSbePebfvPy7tRqimPoVecS2UsBvYv46ynrzWocc92s',
)

export const GOVERNANCE_DELEGATE_KEY = '-selected-delegate'
