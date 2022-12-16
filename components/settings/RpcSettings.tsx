import ButtonGroup from '@components/forms/ButtonGroup'
import Input from '@components/forms/Input'
import Button from '@components/shared/Button'
import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useEffect, useState } from 'react'
import { RPC_PROVIDER_KEY } from 'utils/constants'

const RPC_URLS = [
  {
    label: 'Triton',
    value: 'https://mango.rpcpool.com/0f9acc0d45173b51bf7d7e09c1e5',
  },
  {
    label: 'Syndica',
    value:
      'https://solana-api.syndica.io/access-token/4ywEBJNxuwPLXXU9UlMK67fAMZBt1GLdwuXyXSYnoYPn5aXajT8my0R5klXhYRkk/rpc',
  },
  { label: 'Custom', value: '' },
]

const RpcSettings = () => {
  const { t } = useTranslation('settings')
  const actions = mangoStore((s) => s.actions)
  const [customUrl, setCustomUrl] = useState('')
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [rpcEndpointProvider, setRpcEndpointProvider] = useLocalStorageState(
    RPC_PROVIDER_KEY,
    RPC_URLS[0]
  )
  const rpcEndpoint = RPC_URLS.find(
    (node) => node.label === rpcEndpointProvider.label
  )

  const handleSetEndpointProvider = (provider: string) => {
    const endpointProvider = RPC_URLS.find((node) => node.label === provider)
    setRpcEndpointProvider(endpointProvider)
    if (provider !== 'Custom') {
      setShowCustomForm(false)
      actions.updateConnection(endpointProvider!.value)
    }
  }

  useEffect(() => {
    if (rpcEndpointProvider.label === 'Custom') {
      setShowCustomForm(true)
      setCustomUrl(rpcEndpointProvider.value)
    }
  }, [rpcEndpointProvider])

  const handleSaveCustomEndpoint = () => {
    if (!customUrl) return
    const provider = { label: 'Custom', value: customUrl }
    setRpcEndpointProvider(provider)
    actions.updateConnection(customUrl)
  }

  return (
    <>
      <h2 className="mb-4 text-base">{t('rpc')}</h2>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('rpc-provider')}</p>
        <div className="w-full min-w-[240px] md:w-[340px] md:pl-4">
          <ButtonGroup
            activeValue={rpcEndpoint!.label}
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
    </>
  )
}

export default RpcSettings
