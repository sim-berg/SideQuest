/** The app currency (experimental off-chain Taler, blockchain-ready ledger). */
export interface Wallet {
  balance: number;
  symbol: string;
  name: string;
  emoji: string;
}

export interface CoinTransaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  /** Signed from my wallet's point of view (+ received, − spent). */
  delta: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  createdAt: string;
}
