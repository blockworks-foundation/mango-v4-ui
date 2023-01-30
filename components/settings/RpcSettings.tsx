import ButtonGroup from '@components/forms/ButtonGroup'
import Input from '@components/forms/Input'
import Button from '@components/shared/Button'
import { useWallet } from '@solana/wallet-adapter-react'
import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { PRIORITY_FEE_KEY, RPC_PROVIDER_KEY } from 'utils/constants'

const RPC_URLS = [
  {
    label: 'Triton',
    value: 'https://mango.rpcpool.com/0f9acc0d45173b51bf7d7e09c1e5',
  },
  // {
  //   label: 'Genesys Go',
  //   value: 'https://mango.genesysgo.net',
  // },
  { label: 'Custom', value: '' },
]

export const PRIORITY_FEES = [
  { label: 'None', value: 0 },
  { label: 'Low', value: 50000 },
  { label: 'High', value: 100000 },
]

const RpcSettings = () => {
  const { t } = useTranslation('settings')
  const actions = mangoStore.getState().actions
  const { wallet } = useWallet()
  const [customUrl, setCustomUrl] = useState('')
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [rpcEndpointProvider, setRpcEndpointProvider] = useLocalStorageState(
    RPC_PROVIDER_KEY,
    RPC_URLS[0].value
  )
  const [storedPriorityFee, setStoredPriorityFee] = useLocalStorageState(
    PRIORITY_FEE_KEY,
    PRIORITY_FEES[2].value
  )

  const rpcEndpoint = useMemo(() => {
    return (
      RPC_URLS.find((node) => node.value === rpcEndpointProvider) || {
        label: 'Custom',
        value: rpcEndpointProvider,
      }
    )
  }, [rpcEndpointProvider])

  const priorityFee = useMemo(() => {
    return (
      PRIORITY_FEES.find((node) => node.value === storedPriorityFee) ||
      PRIORITY_FEES[2]
    )
  }, [storedPriorityFee])

  const handleSetEndpointProvider = (provider: string) => {
    const endpointProvider = RPC_URLS.find(
      (node) => node.label === provider
    ) || { label: 'Custom', value: rpcEndpointProvider }
    setRpcEndpointProvider(endpointProvider.value)
    if (provider !== 'Custom') {
      setShowCustomForm(false)
      actions.updateConnection(endpointProvider.value)
    }
  }

  const handlePriorityFee = useCallback(
    (label: string) => {
      const fee = PRIORITY_FEES.find((fee) => fee.label === label)
      setStoredPriorityFee(fee?.value)
      if (wallet) {
        actions.connectMangoClientWithWallet(wallet)
      }
    },
    [setStoredPriorityFee, actions, wallet]
  )

  useEffect(() => {
    if (rpcEndpoint.label === 'Custom') {
      setShowCustomForm(true)
      setCustomUrl(rpcEndpoint.value)
    }
  }, [rpcEndpoint])

  const handleSaveCustomEndpoint = () => {
    if (!customUrl) return
    setRpcEndpointProvider(customUrl)
    actions.updateConnection(customUrl)
  }

  return (
    <>
      <h2 className="mb-4 text-base">{t('rpc')}</h2>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('rpc-provider')}</p>
        <div className="w-full min-w-[160px] md:w-auto md:pl-4">
          <ButtonGroup
            activeValue={rpcEndpoint.label}
            onChange={(v) => handleSetEndpointProvider(v)}
            values={RPC_URLS.map((val) => val.label)}
          />
          {showCustomForm ? (
            <div className="mt-2">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  name="url"
                  id="url"
                  className="!h-10"
                  placeholder={t('rpc-url')}
                  value={customUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setCustomUrl(e.target.value)
                  }
                />
                <Button
                  className="h-12"
                  disabled={!customUrl}
                  onClick={handleSaveCustomEndpoint}
                >
                  {t('save')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">Priority Fee</p>
        <div className="w-full min-w-[160px] md:w-auto md:pl-4">
          <ButtonGroup
            activeValue={priorityFee.label}
            onChange={(v) => handlePriorityFee(v)}
            values={PRIORITY_FEES.map((val) => val.label)}
          />
          {/* {showCustomForm ? (
            <div className="mt-2">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  name="url"
                  id="url"
                  className="!h-10"
                  placeholder={t('rpc-url')}
                  value={customUrl}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setCustomUrl(e.target.value)
                  }
                />
                <Button
                  className="h-12"
                  disabled={!customUrl}
                  onClick={handleSaveCustomEndpoint}
                >
                  {t('save')}
                </Button>
              </div>
            </div>
          ) : null} */}
        </div>
      </div>
    </>
  )
}

export default RpcSettings
