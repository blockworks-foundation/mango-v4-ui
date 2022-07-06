import { RouteInfo } from '@jup-ag/core'
import mangoStore from '../../store/state'

type SelectedRouteProps = {
  routes: RouteInfo[]
  selectedRoute: RouteInfo
  inputTokenSymbol: string
}

const SelectedRoute = ({
  routes,
  selectedRoute,
  inputTokenSymbol,
}: SelectedRouteProps) => {
  const tokens = mangoStore((s) => s.jupiterTokens)

  return (
    <div className="relative rounded-md border border-th-bkg-4 px-3 pb-4 pt-4 hover:cursor-pointer hover:border-th-fgd-4">
      {selectedRoute === routes[0] ? (
        <div className="absolute -top-2 rounded-sm bg-th-primary px-1 text-xs font-bold text-th-bkg-1">
          Best Swap
        </div>
      ) : null}
      <div className="flex items-center justify-between">
        <div>
          <span className="overflow-ellipsis whitespace-nowrap text-sm font-bold text-th-fgd-1">
            {selectedRoute?.marketInfos.map((info, index) => {
              let includeSeparator = false
              if (
                selectedRoute?.marketInfos.length > 1 &&
                index !== selectedRoute?.marketInfos.length - 1
              ) {
                includeSeparator = true
              }
              return (
                <span key={index}>{`${info.amm.label} ${
                  includeSeparator ? 'x ' : ''
                }`}</span>
              )
            })}
          </span>
          <div className="mr-2 mt-0.5 text-xs font-normal text-th-fgd-3">
            {inputTokenSymbol} →{' '}
            {selectedRoute?.marketInfos.map((r, index) => {
              const showArrow =
                index !== selectedRoute?.marketInfos.length - 1 ? true : false
              return (
                <span key={index}>
                  <span>
                    {
                      tokens.find(
                        (item) => item?.address === r?.outputMint?.toString()
                      )?.symbol
                    }
                  </span>
                  {showArrow ? ' → ' : ''}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SelectedRoute
