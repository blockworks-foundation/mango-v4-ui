import { RouteInfo } from '@jup-ag/core'

export type TokenInfo = {
  decimals: number
  symbol: string
}

export type Routes = {
  routesInfos: RouteInfo[]
  cached: boolean
}
