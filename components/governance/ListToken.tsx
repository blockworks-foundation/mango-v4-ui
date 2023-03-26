import Input from '@components/forms/Input'
import Label from '@components/forms/Label'
import Button from '@components/shared/Button'
import { ChangeEvent, useEffect, useState } from 'react'
import { CLUSTER } from '@store/mangoStore'
import { Token } from 'types/jupiter'

const ListToken = () => {
  const [tokenList, setTokenList] = useState<Token[]>([])
  const [currentTokenInfo, setCurrentTokenInfo] = useState<
    Token | null | undefined
  >(null)
  const [form, setForm] = useState({
    mint: '',
  })
  const findToken = async () => {
    let currentTokenList: Token[] = tokenList
    setCurrentTokenInfo(null)
    if (!tokenList.length) {
      const url =
        CLUSTER === 'devnet'
          ? 'https://api.jup.ag/api/tokens/devnet'
          : 'https://token.jup.ag/strict'
      const response = await fetch(url)
      const data: Token[] = await response.json()
      currentTokenList = data
      setTokenList(data)
    }
    const tokenInfo = currentTokenList.find((x) => x.address === form.mint)
    setCurrentTokenInfo(tokenInfo)
  }
  useEffect(() => {
    setTokenList([])
  }, [CLUSTER])

  return (
    <div>
      <div>
        <h3>New Listing</h3>
        <div>
          <Label text={'Token mint'} />
          <Input
            type="text"
            name="mint"
            id="mint"
            value={form.mint}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setForm({ ...form, mint: e.target.value })
            }
          />
          <Button onClick={findToken}>Find token</Button>
        </div>
      </div>
      <div>
        <h3>Token details</h3>
        <div>
          name: <img src={currentTokenInfo?.logoURI} className="h-5 w-5"></img>{' '}
          {currentTokenInfo?.name}
          symbol: {currentTokenInfo?.symbol}
          mint: {currentTokenInfo?.address}
        </div>
      </div>
    </div>
  )
}

export default ListToken
