import Image from 'next/image'
import mangoStore from '../store/state'

type TokenSelectProps = {
  token: string
  onChange: (x?: any) => void
}

const TokenSelect = ({ token, onChange }: TokenSelectProps) => {
  const group = mangoStore((s) => s.group)
  if (!group) return null
  return (
    <div className="flex items-center">
      <div className="flex min-w-[24px] items-center">
        <Image
          alt=""
          width="30"
          height="30"
          src={`/icons/${token.toLowerCase()}.svg`}
        />
      </div>
      <label htmlFor="tokenIn" className="sr-only">
        Token
      </label>
      <select
        id="tokenIn"
        name="tokenIn"
        autoComplete="token"
        className="text-mango-200 h-full rounded-md border-transparent bg-transparent pr-10 text-lg font-bold focus:ring-0"
        onChange={onChange}
        value={token}
      >
        {Array.from(group.banksMap.keys()).map((symbol) => {
          return <option key={symbol}>{symbol}</option>
        })}
      </select>
    </div>
  )
}

export default TokenSelect
