import { api } from './api';
import type { QuestChain, ChainStepResult } from '../types/chain';

export async function fetchCurrentChain(): Promise<QuestChain | null> {
  return api.get<QuestChain | null>('/pets/chains/current');
}

/** Ask the pet for a new journey around the given position (null = cooldown). */
export async function requestChainOffer(
  lat: number,
  lng: number,
): Promise<QuestChain | null> {
  return api.post<QuestChain | null>('/pets/chains/offer', { lat, lng });
}

export async function acceptChain(id: string): Promise<QuestChain> {
  return api.post<QuestChain>(`/pets/chains/${id}/accept`);
}

export async function dismissChain(id: string): Promise<void> {
  await api.post(`/pets/chains/${id}/dismiss`);
}

export async function completeChainStep(
  id: string,
  index: number,
  lat: number,
  lng: number,
): Promise<ChainStepResult> {
  return api.post<ChainStepResult>(`/pets/chains/${id}/steps/${index}/complete`, {
    lat,
    lng,
  });
}
