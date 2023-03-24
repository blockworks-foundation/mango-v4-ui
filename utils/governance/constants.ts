import { PublicKey } from '@solana/web3.js'

export const MANGO_REALM_PK = new PublicKey(
  'DPiH3H3c7t47BMxqTxLsuPQpEC6Kne8GA9VXbxpnZxFE'
)
export const MANGO_GOVERNANCE_PROGRAM = new PublicKey(
  'GqTPL6qRf5aUuqscLh8Rg2HTxPUXfhhAXDptTLhp1t2J'
)

export const VOTER_INFO_EVENT_NAME = 'VoterInfo'
export const DEPOSIT_EVENT_NAME = 'DepositEntryInfo'
// The wallet can be any existing account for the simulation
// Note: when running a local validator ensure the account is copied from devnet: --clone ENmcpFCpxN1CqyUjuog9yyUVfdXBKF3LVCwLr7grJZpk -ud
export const SIMULATION_WALLET = 'ENmcpFCpxN1CqyUjuog9yyUVfdXBKF3LVCwLr7grJZpk'

export const MANGO_MINT = new PublicKey(
  'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'
)
