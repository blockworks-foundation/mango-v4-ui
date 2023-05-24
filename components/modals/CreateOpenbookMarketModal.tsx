import mangoStore, { CLUSTER } from '@store/mangoStore'
import { ModalProps } from '../../types/modal'
import Modal from '../shared/Modal'
import { OPENBOOK_PROGRAM_ID } from '@blockworks-foundation/mango-v4'
import useMangoGroup from 'hooks/useMangoGroup'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { calculateTradingParameters } from 'utils/governance/listingTools'
import Label from '@components/forms/Label'
import Input from '@components/forms/Input'
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'
import { useTranslation } from 'next-i18next'
import Button from '@components/shared/Button'
import { makeCreateOpenBookMarketInstructionSimple } from 'utils/governance/market/createOpenBookMarket'
import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, Transaction } from '@solana/web3.js'
import { MARKET_STATE_LAYOUT_V2 } from '@project-serum/serum'

type CreateObMarketForm = {
  programId: string
  baseMint: string
  quoteMint: string
  minimumOrderSize: string
  minimumPriceTickSize: string
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
  quoteSymbol: string
  baseSymbol: string
}

const CreateOpenbookMarketModal = ({
  isOpen,
  onClose,
  quoteSymbol,
  baseSymbol,
}: ModalProps & CreateOpenbookMarketModalProps) => {
  const { t } = useTranslation(['governance'])
  const connection = mangoStore((s) => s.connection)
  const wallet = useWallet()
  const { group } = useMangoGroup()

  const [form, setForm] = useState({ ...defaultFormValues })
  const [formErrors, setFormErrors] = useState<FormErrors>({})
  const [creating, setCreating] = useState(false)
  const [solNeededToCreateMarket, setSolNeededToCreateMarket] = useState(0)

  const baseBank = group?.banksMapByName.get(baseSymbol)?.length
    ? group.banksMapByName.get(baseSymbol)![0]
    : null
  const quoteBank = group?.banksMapByName.get(quoteSymbol)?.length
    ? group.banksMapByName.get(quoteSymbol)![0]
    : null

  const tradingParams = useMemo(() => {
    if (baseBank && quoteBank) {
      return calculateTradingParameters(
        baseBank.uiPrice,
        quoteBank.uiPrice,
        baseBank.mintDecimals,
        quoteBank.mintDecimals
      )
    }
    return {
      minOrder: 0,
      priceTick: 0,
      baseLotSize: 0,
    }
  }, [baseBank, quoteBank])
  console.log(tradingParams)

  const handleSetAdvForm = (propertyName: string, value: string | number) => {
    setFormErrors({})
    setForm({ ...form, [propertyName]: value })
  }

  const handleCreate = async () => {
    if (!wallet || !wallet.signAllTransactions) {
      return
    }
    setCreating(true)
    const ixObj = await makeCreateOpenBookMarketInstructionSimple({
      connection,
      wallet: wallet.publicKey!,
      baseInfo: {
        mint: baseBank!.mint,
        decimals: baseBank!.mintDecimals,
      },
      quoteInfo: {
        mint: quoteBank!.mint,
        decimals: quoteBank!.mintDecimals,
      },
      lotSize: Number(form.minimumOrderSize),
      tickSize: Number(form.minimumPriceTickSize),
      dexProgramId: new PublicKey(form.programId),
    })

    const txChunks = ixObj.innerTransactions
    const transactions: Transaction[] = []
    const latestBlockhash = await connection.getLatestBlockhash('finalized')
    for (const chunk of txChunks) {
      const tx = new Transaction()
      tx.add(...chunk.instructions)
      tx.lastValidBlockHeight = latestBlockhash.lastValidBlockHeight
      tx.recentBlockhash = latestBlockhash.blockhash
      tx.feePayer = wallet.publicKey!
      tx.sign(...chunk.signers)
      transactions.push(tx)
    }
    const signedTransactions = await wallet.signAllTransactions(transactions)
    console.log(signedTransactions)
    for (const tx of signedTransactions) {
      const rawTransaction = tx.serialize()
      const address = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
      })
      const sig = await connection.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature: address,
      })
      console.log(sig)
    }
    setCreating(false)
  }

  useEffect(() => {
    setForm({
      programId: OPENBOOK_PROGRAM_ID[CLUSTER].toBase58(),
      baseMint: baseBank?.mint.toBase58() || '',
      quoteMint: quoteBank?.mint.toBase58() || '',
      minimumOrderSize: tradingParams.minOrder.toString(),
      minimumPriceTickSize: tradingParams.priceTick.toString(),
    })
  }, [
    baseBank?.mint,
    quoteBank?.mint,
    tradingParams.minOrder,
    tradingParams.priceTick,
  ])

  useEffect(() => {
    const getMinLamportsToCreateMarket = async () => {
      const accountsSpace = 398714 + MARKET_STATE_LAYOUT_V2.span
      const minLamports = await connection.getMinimumBalanceForRentExemption(
        accountsSpace
      )
      setSolNeededToCreateMarket(
        Math.round((minLamports / LAMPORTS_PER_SOL + Number.EPSILON) * 100) /
          100
      )
    }
    getMinLamportsToCreateMarket()
  }, [connection])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <p>Creating market will cost at least {solNeededToCreateMarket} sol</p>
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
        {formErrors.minimumOrderSize && (
          <div className="mt-1.5 flex items-center space-x-1">
            <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
            <p className="mb-0 text-xs text-th-down">
              {formErrors.minimumOrderSize}
            </p>
          </div>
        )}
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
          <div className="mt-1.5 flex items-center space-x-1">
            <ExclamationCircleIcon className="h-4 w-4 text-th-down" />
            <p className="mb-0 text-xs text-th-down">
              {formErrors.minimumPriceTickSize}
            </p>
          </div>
        )}
      </div>
      <div>
        <Button
          className="float-right mt-6 flex w-36 items-center justify-center"
          onClick={handleCreate}
          disabled={creating}
          size="large"
        >
          Create
        </Button>
      </div>
    </Modal>
  )
}

export default CreateOpenbookMarketModal
