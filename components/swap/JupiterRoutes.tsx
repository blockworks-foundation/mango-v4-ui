import React, { Dispatch, SetStateAction, useState } from 'react'
import { TransactionInstruction, PublicKey } from '@solana/web3.js'
import { toUiDecimals } from '@blockworks-foundation/mango-v4'
import { Jupiter, RouteInfo } from '@jup-ag/core'

import mangoStore from '../../store/state'
import RoutesModal from './RoutesModal'
import RouteFeeInfo from './RouteFeeInfo'
import Button, { IconButton } from '../shared/Button'
import Loading from '../shared/Loading'
import { ArrowRightIcon, XIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'
import { Token } from '../../types/jupiter'

type JupiterRoutesProps = {
  inputToken: string
  outputToken: string
  amountIn: number
  slippage: number
  submitting: boolean
  handleSwap: (x: TransactionInstruction[]) => void
  onClose: () => void
  jupiter: Jupiter | undefined
  routes: RouteInfo[] | undefined
  outputTokenInfo: Token | undefined
  selectedRoute: RouteInfo | undefined
  setSelectedRoute: Dispatch<SetStateAction<RouteInfo | undefined>>
}

const parseJupiterRoute = async (
  jupiter: Jupiter,
  selectedRoute: RouteInfo,
  userPublicKey: PublicKey
): Promise<TransactionInstruction[]> => {
  const { transactions } = await jupiter.exchange({
    routeInfo: selectedRoute,
    userPublicKey,
  })
  const { setupTransaction, swapTransaction } = transactions
  const instructions = []
  for (const ix of swapTransaction.instructions) {
    if (
      ix.programId.toBase58() === 'JUP2jxvXaqu7NQY1GmNF4m1vodw12LVXYxbFL2uJvfo'
    ) {
      instructions.push(ix)
    }
  }

  return instructions
}

const JupiterRoutes = ({
  inputToken,
  amountIn,
  handleSwap,
  submitting,
  onClose,
  jupiter,
  routes,
  outputTokenInfo,
  selectedRoute,
  setSelectedRoute,
}: JupiterRoutesProps) => {
  const { t } = useTranslation('trade')
  const [showRoutesModal, setShowRoutesModal] = useState(false)
  const mangoAccount = mangoStore((s) => s.mangoAccount.current)

  const onSwap = async () => {
    if (!jupiter || !selectedRoute) return
    const ixs = await parseJupiterRoute(
      jupiter,
      selectedRoute,
      mangoAccount!.owner
    )
    await handleSwap(ixs)
    onClose()
  }

  return routes?.length && selectedRoute && outputTokenInfo ? (
    <div className="flex h-full flex-col justify-between">
      <div>
        <IconButton
          className="absolute top-2 right-2 text-th-fgd-3"
          onClick={onClose}
          hideBg
        >
          <ArrowRightIcon className="h-5 w-5" />
        </IconButton>
        <RouteFeeInfo
          selectedRoute={selectedRoute}
          amountIn={amountIn}
          amountOut={toUiDecimals(
            selectedRoute.outAmount,
            outputTokenInfo.decimals
          )}
          inputTokenSymbol={inputToken}
          outputTokenInfo={outputTokenInfo}
          showRoutesModal={() => setShowRoutesModal(true)}
        />
        {showRoutesModal ? (
          <RoutesModal
            show={showRoutesModal}
            onClose={() => setShowRoutesModal(false)}
            setSelectedRoute={setSelectedRoute}
            selectedRoute={selectedRoute}
            routes={routes}
            inputTokenSymbol={inputToken}
            outputTokenInfo={outputTokenInfo}
          />
        ) : null}
      </div>
      <div className="flex items-center justify-center pb-6">
        <Button
          onClick={onSwap}
          className="flex w-full items-center justify-center text-base"
          size="large"
        >
          {true ? (
            <Loading className="mr-2 h-5 w-5" />
          ) : (
            t('trade:confirm-trade')
          )}
        </Button>
      </div>
    </div>
  ) : null
}

export default React.memo(JupiterRoutes)
