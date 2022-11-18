import { Dispatch, SetStateAction } from 'react'

import { RouteInfo, Token } from '../../types/jupiter'
import { formatDecimal } from '../../utils/numbers'
import Modal from '../shared/Modal'
import useJupiterMints from '../../hooks/useJupiterMints'

type RoutesModalProps = {
  onClose: () => void
  setSelectedRoute: Dispatch<SetStateAction<RouteInfo | undefined>>
  show: boolean
  routes: RouteInfo[]
  selectedRoute: RouteInfo
  inputTokenSymbol: string
  outputTokenInfo: Token
}

const RoutesModal = ({
  onClose,
  show,
  routes,
  selectedRoute,
  setSelectedRoute,
  inputTokenSymbol,
  outputTokenInfo,
}: RoutesModalProps) => {
  const { mangoTokens } = useJupiterMints()

  const handleSelectRoute = (route: RouteInfo) => {
    setSelectedRoute(route)
    onClose()
  }

  return (
    <Modal isOpen={show} onClose={() => onClose()}>
      <div className="mb-4 text-center text-lg font-bold text-th-fgd-1">
        {routes?.length} routes found
      </div>
      <div className="thin-scroll max-h-96 overflow-y-auto overflow-x-hidden">
        {routes?.map((route, index) => {
          const selected = selectedRoute.outAmount === route.outAmount
          return (
            <div
              key={index}
              className={`default-transition mb-2 rounded border bg-th-bkg-3 hover:bg-th-bkg-4 ${
                selected
                  ? 'border-th-primary text-th-primary hover:border-th-primary'
                  : 'border-transparent text-th-fgd-1'
              }`}
            >
              <button
                className="w-full p-4"
                onClick={() => handleSelectRoute(route)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col text-left">
                    <div className="overflow-ellipsis whitespace-nowrap font-bold">
                      {route.marketInfos.map((info, index) => {
                        let includeSeparator = false
                        if (
                          route.marketInfos.length > 1 &&
                          index !== route.marketInfos.length - 1
                        ) {
                          includeSeparator = true
                        }
                        return (
                          <span key={index}>{`${info.label} ${
                            includeSeparator ? 'x ' : ''
                          }`}</span>
                        )
                      })}
                    </div>
                    <div className="text-xs text-th-fgd-4">
                      {inputTokenSymbol} →{' '}
                      {route.marketInfos.map((r, index) => {
                        const showArrow =
                          index !== route.marketInfos.length - 1 ? true : false
                        return (
                          <span key={index}>
                            <span>
                              {
                                mangoTokens.find(
                                  (item) =>
                                    item?.address === r?.outputMint?.toString()
                                )?.symbol
                              }
                            </span>
                            {showArrow ? ' → ' : ''}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="text-lg">
                    {formatDecimal(
                      route.outAmount / 10 ** (outputTokenInfo?.decimals || 1),
                      6
                    )}
                  </div>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

export default RoutesModal
