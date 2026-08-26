import { api } from './api';
import type { Wallet, CoinTransaction } from '../types/coin';

export async function fetchMyWallet(): Promise<Wallet> {
  return api.get<Wallet>('/coins/me');
}

export async function fetchMyCoinHistory(): Promise<CoinTransaction[]> {
  return api.get<CoinTransaction[]>('/coins/me/history');
}
