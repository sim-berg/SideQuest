/**
 * The app currency. For now an experimental off-chain coin ("Taler") whose
 * ledger lives in MongoDB. The design keeps a later migration to an own
 * blockchain cheap: every balance change is an append-only CoinTransaction
 * created through exactly three primitives (mint / transfer / burn) in
 * CoinService — swapping the persistence of those three for chain calls is
 * the whole migration.
 */
export const COIN = {
  symbol: 'TLR',
  name: 'Taler',
  emoji: '🪙',
} as const;

/** One-time grant when a wallet is first created. */
export const STARTER_GRANT = 100;

/**
 * Well-known ledger accounts. Regular accounts are user ids; escrow accounts
 * park coins that are promised but not yet paid out (event quest pools).
 */
export const SYSTEM_ACCOUNT = 'system';
export const escrowAccount = (questId: string): string => `escrow:${questId}`;

/** Coin drop per daily side quest difficulty. */
export const DAILY_COIN_REWARD: Record<string, number> = {
  easy: 5,
  medium: 10,
  hard: 20,
};
