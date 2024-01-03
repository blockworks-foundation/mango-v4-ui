import { Dispatch, SetStateAction } from 'react'

import { JupiterV6RouteInfo, Token } from '../../types/jupiter'
import Modal from '../shared/Modal'
import useJupiterMints from '../../hooks/useJupiterMints'
import FormatNumericValue from '@components/shared/FormatNumericValue'

type RoutesModalProps = {
  onClose: () => void
  setSelectedRoute: Dispatch<
    SetStateAction<JupiterV6RouteInfo | undefined | null>
  >
  show: boolean
  routes: JupiterV6RouteInfo[]
  selectedRoute: JupiterV6RouteInfo
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
  const { jupiterTokens } = useJupiterMints()

  const handleSelectRoute = (route: JupiterV6RouteInfo) => {
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
              className={`mb-2 rounded border bg-th-bkg-3 hover:bg-th-bkg-4 ${
                selected
                  ? 'border-th-active text-th-active hover:border-th-active'
                  : 'border-transparent text-th-fgd-1'
              }`}
            >
              <button
                className="w-full p-4"
                onClick={() => handleSelectRoute(route)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col text-left">
                    <div className="overflow-ellipsis font-bold">
                      {route.routePlan?.map((info, index) => {
                        let includeSeparator = false
                        if (
                          route.routePlan &&
                          route.routePlan.length > 1 &&
                          index !== route.routePlan.length - 1
                        ) {
                          includeSeparator = true
                        }
                        return (
                          <span key={index}>{`${info.swapInfo.label} ${
                            includeSeparator ? 'x ' : ''
                          }`}</span>
                        )
                      })}
                    </div>
                    <div className="text-xs text-th-fgd-4">
                      {inputTokenSymbol} →{' '}
                      {route.routePlan?.map((r, index) => {
                        const showArrow =
                          route.routePlan &&
                          index !== route.routePlan.length - 1
                            ? true
                            : false
                        return (
                          <span key={index}>
                            <span>
                              {
                                jupiterTokens.find(
                                  (item) =>
                                    item?.address ===
                                    r?.swapInfo.outputMint?.toString(),
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
                    <FormatNumericValue
                      value={
                        route.outAmount / 10 ** (outputTokenInfo?.decimals || 1)
                      }
                      decimals={outputTokenInfo?.decimals || 6}
                    />
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
