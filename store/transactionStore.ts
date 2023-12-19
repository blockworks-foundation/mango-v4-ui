import create from 'zustand'

type TransactionType = 'deposit'

interface Transaction {
  data: unknown
  status: 'pending' | 'confirmed' | 'failed'
  confirmationCallback: () => void
  type: TransactionType // Expanded status options
}

interface TransactionState {
  transactions: Map<string, Transaction>
  addTransaction: (
    transactionId: string,
    data: unknown,
    confirmationCallback: () => void,
    type: TransactionType,
  ) => void
  updateTransactionStatus: (
    transactionId: string,
    status: Transaction['status'],
  ) => void
  removeTransaction: (transactionId: string) => void
}

const transactionStore = create<TransactionState>((set) => ({
  transactions: new Map<string, Transaction>(),

  addTransaction: (transactionId, data, confirmationCallback, type) => {
    set((state) => {
      const newTransactions = new Map(state.transactions)
      newTransactions.set(transactionId, {
        data,
        status: 'pending',
        confirmationCallback,
        type,
      })
      return { transactions: newTransactions }
    })
  },
  updateTransactionStatus: (transactionId, status) => {
    set((state) => {
      const newTransactions = new Map(state.transactions)
      const transaction = newTransactions.get(transactionId)
      if (transaction) {
        newTransactions.set(transactionId, { ...transaction, status })
      }
      return { transactions: newTransactions }
    })
  },
  removeTransaction: (transactionId) => {
    set((state) => {
      const newTransactions = new Map(state.transactions)
      newTransactions.delete(transactionId)
      return { transactions: newTransactions }
    })
  },
}))

export default transactionStore
