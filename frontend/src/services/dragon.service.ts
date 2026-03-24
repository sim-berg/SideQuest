import { api } from './api';
import type { Dragon } from '../types/dragon';

export async function fetchMyDragon(): Promise<Dragon | null> {
  return api.get<Dragon | null>('/dragons/me');
}

export async function chooseDragon(type: string): Promise<Dragon> {
  return api.post<Dragon>('/dragons/choose', { type });
}
