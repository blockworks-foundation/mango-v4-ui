import ButtonGroup from '@components/forms/ButtonGroup'
import Input from '@components/forms/Input'
import Button from '@components/shared/Button'
//import mangoStore from '@store/mangoStore'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { DATA_PROVIDER_KEY } from 'utils/constants'

export const DATA_PROVIDERS = [
  {
    label: 'mngo.cloud',
    value: 'api.mngo.cloud',
  },
  {
    label: 'RPC',
    value: 'rpc',
  },
  { label: 'Custom', value: '' },
]

const DataSettings = () => {
  const { t } = useTranslation('settings')
  //const actions = mangoStore.getState().actions
  const [customUrl, setCustomUrl] = useState('')
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [dataEndpointProvider, setDataEndpointProvider] = useLocalStorageState(
    DATA_PROVIDER_KEY,
    DATA_PROVIDERS[0].value
  )

  const dataEndpoint = useMemo(() => {
    return (
      DATA_PROVIDERS.find((node) => node.value === dataEndpointProvider) || {
        label: 'Custom',
        value: dataEndpointProvider,
      }
    )
  }, [dataEndpointProvider])

  const handleSetEndpointProvider = (provider: string) => {
    const endpointProvider = DATA_PROVIDERS.find(
      (node) => node.label === provider
    ) || { label: 'Custom', value: dataEndpointProvider }
    setDataEndpointProvider(endpointProvider.value)
    if (provider !== 'Custom') {
      setShowCustomForm(false)
      //actions.updateConnection(endpointProvider.value)
    }
  }

  useEffect(() => {
    if (dataEndpoint.label === 'Custom') {
      setShowCustomForm(true)
      setCustomUrl(dataEndpoint.value)
    }
  }, [dataEndpoint])

  const handleSaveCustomEndpoint = () => {
    if (!customUrl) return
    setDataEndpointProvider(customUrl)
    //actions.updateConnection(customUrl)
  }

  return (
    <>
      <h2 className="mb-4 text-base">{t('settings:data')}</h2>
      <div className="flex flex-col border-t border-th-bkg-3 py-4 md:flex-row md:items-center md:justify-between md:px-4">
        <p className="mb-2 md:mb-0">{t('settings:data-provider')}</p>
        <div className="w-full min-w-[300px] md:w-auto md:pl-4">
          <ButtonGroup
            activeValue={dataEndpoint.label}
            onChange={(v) => handleSetEndpointProvider(v)}
            values={DATA_PROVIDERS.map((val) => val.label)}
          />
          {showCustomForm ? (
            <div className="mt-2">
              <div className="flex space-x-2">
                <Input
                  type="text"
                  name="url"
                  id="url"
                  className="!h-10"
                  placeholder={t('settings:data-url')}
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

export default DataSettings
