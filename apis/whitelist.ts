import { WHITE_LIST_API } from 'utils/constants'

export type WhiteListedResp = {
  found: boolean
}

export const fetchIsWhiteListed = async (wallet: string) => {
  const data = await fetch(`${WHITE_LIST_API}isWhiteListed?wallet=${wallet}`)
  const body = await data.json()
  if (body.error) {
    throw { error: body.error, status: data.status }
  }
  return body.found
}
