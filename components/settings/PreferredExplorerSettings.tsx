import { CheckCircleIcon } from '@heroicons/react/20/solid'
import useLocalStorageState from 'hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { PREFERRED_EXPLORER_KEY } from 'utils/constants'

export const EXPLORERS = [
  { name: 'solana-explorer', url: 'https://explorer.solana.com/tx/' },
  { name: 'solscan', url: 'https://solscan.io/tx/' },
  { name: 'solana-beach', url: 'https://solanabeach.io/transaction/' },
  { name: 'solanafm', url: 'https://solana.fm/tx/' },
]

const PreferredExplorerSettings = () => {
  const { t } = useTranslation('settings')
  const [preferredExplorer, setPreferredExplorer] = useLocalStorageState(
    PREFERRED_EXPLORER_KEY,
    EXPLORERS[0],
  )
  return (
    <div className="pt-6">
      <h3 className="mb-4 text-base text-th-fgd-1">
        {t('settings:preferred-explorer')}
      </h3>
      <div className="space-y-2">
        {EXPLORERS.map((ex) => (
          <button
            className="flex w-full items-center justify-between rounded-md border border-th-bkg-4 p-4 hover:border-th-fgd-4"
            onClick={() => setPreferredExplorer(ex)}
            key={ex.name}
          >
            <div className="flex items-center space-x-2">
              <Image
                alt=""
                width="24"
                height="24"
                src={`/explorer-logos/${ex.name}.png`}
              />
              <p>{t(`settings:${ex.name}`)}</p>
            </div>
            {preferredExplorer.url === ex.url ? (
              <CheckCircleIcon className="h-5 w-5 text-th-success" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  )
}

export default PreferredExplorerSettings
