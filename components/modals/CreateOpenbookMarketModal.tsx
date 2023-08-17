import mangoStore, { CLUSTER } from '@store/mangoStore'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { OPENBOOK_PROGRAM_ID } from '@blockworks-foundation/mango-v4'
import { ChangeEvent, useEffect, useState } from 'react'
import Label from '@components/forms/Label'
import Input from '@components/forms/Input'
import { useTranslation } from 'next-i18next'
import Button from '@components/shared/Button'
import { makeCreateOpenBookMarketInstructionSimple } from 'utils/governance/market/createOpenBookMarket'
import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js'
import { MARKET_STATE_LAYOUT_V2 } from '@project-serum/serum'
import { notify } from 'utils/notifications'
import InlineNotification from '@components/shared/InlineNotification'

type CreateObMarketForm = {
  programId: string
  baseMint: string
  quoteMint: string
  minimumOrderSize: string
  minimumPriceTickSize: string
}

type TradingParams = {
  baseLots: number
  quoteLots: number
  minOrderValue: number
  baseLotExponent: number
  quoteLotExponent: number
  minOrderSize: number
  priceIncrement: number
  priceIncrementRelative: number
}

type FormErrors = Partial<Record<keyof CreateObMarketForm, string>>

const defaultFormValues: CreateObMarketForm = {
  programId: '',
  baseMint: '',
  quoteMint: '',
  minimumOrderSize: '',
  minimumPriceTickSize: '',
}

type CreateOpenbookMarketModalProps = {
  baseMint: string
  baseDecimals: number
  quoteMint: string
  quoteDecimals: number
  tradingParams: TradingParams
}

const CreateOpenbookMarketModal = ({
  isOpen,
  onClose,
  baseMint,
  baseDecimals,
  quoteMint,
  quoteDecimals,
  tradingParams,
}: ModalProps & CreateOpenbookMarketModalProps) => {
  const { t } = useTranslation(['governance'])
  const connection = mangoStore((s) => s.connection)
  const { connect, signAllTransactions, connected, publicKey } = useWallet()

  const [form, setForm] = useState({ ...defaultFormValues })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [creating, setCreating] = useState(false)
  const [solNeededToCreateMarket, setSolNeededToCreateMarket] = useState(0)

  const handleSetAdvForm = (propertyName: string, value: string | number) => {
    setFormErrors({})
    setForm({ ...form, [propertyName]: value })
  }

  const handleCreate = async () => {
    if (!publicKey || !signAllTransactions) {
      return
    }
    let sig = ''
    setCreating(true)
    try {
      const ixObj = await makeCreateOpenBookMarketInstructionSimple({
        connection,
        wallet: publicKey,
        baseInfo: {
          mint: new PublicKey(baseMint),
          decimals: baseDecimals,
        },
        quoteInfo: {
          mint: new PublicKey(quoteMint),
          decimals: quoteDecimals,
        },
        lotSize: Number(form.minimumOrderSize),
        tickSize: Number(form.minimumPriceTickSize),
        dexProgramId: new PublicKey(form.programId),
      })

      const txChunks = ixObj.innerTransactions
      const transactions: Transaction[] = []
      const latestBlockhash = await connection.getLatestBlockhash('confirmed')
      for (const chunk of txChunks) {
        const tx = new Transaction()
        tx.add(...chunk.instructions)
        tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight
        tx.recentBlockhash = latestBlockhash.blockhash
        tx.feePayer = publicKey
        tx.sign(...chunk.signers)
        transactions.push(tx)
      }
      const signedTransactions = await signAllTransactions(transactions)

      for (const tx of signedTransactions) {
        const rawTransaction = tx.serialize()
        sig = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
        })
        await connection.confirmTransaction({
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          signature: sig,
        })
      }
      onClose()
      notify({
        title: t('market-created-successful'),
        type: 'success',
      })
    } catch (e) {
      notify({
        title: t('error-creating-market'),
        description: `${e}`,
        txid: sig,
        type: 'error',
      })
    }
    setCreating(false)
  }

  useEffect(() => {
    setForm({
      programId: OPENBOOK_PROGRAM_ID[CLUSTER].toBase58(),
      baseMint: baseMint || '',
      quoteMint: quoteMint || '',
      minimumOrderSize: tradingParams.minOrderSize.toString(),
      minimumPriceTickSize: tradingParams.priceIncrement.toString(),
    })
  }, [
    baseMint,
    quoteMint,
    tradingParams.minOrderSize,
    tradingParams.priceIncrement,
  ])

  useEffect(() => {
    const getMinLamportsToCreateMarket = async () => {
      const accountsSpace = 84522 + MARKET_STATE_LAYOUT_V2.span
      const minLamports =
        await connection.getMinimumBalanceForRentExemption(accountsSpace)
      setSolNeededToCreateMarket(
        Math.round((minLamports / LAMPORTS_PER_SOL + Number.EPSILON) * 100) /
          100,
      )
    }
    getMinLamportsToCreateMarket()
  }, [connection])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-center">
          <h2 className="mb-1">{t('create-openbook')}</h2>
          <p>
            {t('create-market-sol-cost', { cost: solNeededToCreateMarket })}
          </p>
        </div>
        <div>
          <Label text={t('open-book-market-id')} />
          <Input
            hasError={formErrors.programId !== undefined}
            type="text"
            disabled={true}
            value={form.programId.toString()}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleSetAdvForm('programId', e.target.value)
            }
          />
        </div>
        <div>
          <Label text={t('base-mint')} />
          <Input
            hasError={formErrors.baseMint !== undefined}
            type="text"
            disabled={true}
            value={form.baseMint.toString()}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleSetAdvForm('baseMint', e.target.value)
            }
          />
        </div>
        <div>
          <Label text={t('quote-mint')} />
          <Input
            disabled={true}
            hasError={formErrors.quoteMint !== undefined}
            type="text"
            value={form.quoteMint.toString()}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleSetAdvForm('quoteMint', e.target.value)
            }
          />
        </div>
        <div>
          <Label text={t('min-order')} />
          <Input
            hasError={formErrors.minimumOrderSize !== undefined}
            type="text"
            value={form.minimumOrderSize.toString()}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleSetAdvForm('minimumOrderSize', e.target.value)
            }
          />
          {formErrors.minimumOrderSize ? (
            <div className="mt-1">
              <InlineNotification
                hideBorder
                hidePadding
                type="error"
                desc={formErrors.minimumOrderSize}
              />
            </div>
          ) : null}
        </div>
        <div>
          <Label text={t('price-tick')} />
          <Input
            hasError={formErrors.minimumPriceTickSize !== undefined}
            type="text"
            value={form.minimumPriceTickSize.toString()}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleSetAdvForm('minimumPriceTickSize', e.target.value)
            }
          />
          {formErrors.minimumPriceTickSize && (
            <div className="mt-1">
              <InlineNotification
                hideBorder
                hidePadding
                type="error"
                desc={formErrors.minimumPriceTickSize}
              />
            </div>
          )}
        </div>
      </div>
      {connected ? (
        <Button
          className="mt-6 w-full"
          onClick={handleCreate}
          disabled={creating}
          size="large"
        >
          {t('create')}
        </Button>
      ) : (
        <Button className="mt-6 w-full" onClick={connect} size="large">
          {t('connect-wallet')}
        </Button>
      )}
    </Modal>
  )
}

export default CreateOpenbookMarketModal
