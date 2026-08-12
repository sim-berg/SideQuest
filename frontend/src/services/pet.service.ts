import { api } from './api';
import type { Pet, PetChatMessage } from '../types/pet';

/** The user's menagerie; the backend creates the starter egg on first call. */
export async function fetchMyPets(): Promise<Pet[]> {
  return api.get<Pet[]>('/pets/me');
}

export async function activatePet(id: string): Promise<Pet> {
  return api.post<Pet>(`/pets/${id}/activate`);
}

export async function renamePet(id: string, name: string): Promise<Pet> {
  return api.post<Pet>(`/pets/${id}/name`, { name });
}

/** Chat history with the active companion, oldest first. */
export async function fetchPetChat(): Promise<PetChatMessage[]> {
  return api.get<PetChatMessage[]>('/pets/chat');
}

export async function sendPetChat(
  message: string,
): Promise<{ reply: PetChatMessage }> {
  return api.post<{ reply: PetChatMessage }>('/pets/chat', { message });
}
