import { api } from './api';

export interface ActivityData {
  date: string;
  count: number;
}

export async function fetchActivity(): Promise<ActivityData[]> {
  return api.get<ActivityData[]>('/users/me/activity');
}
