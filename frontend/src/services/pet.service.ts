import { api } from './api';
import type { Pet, PetChatMessage, PetTrade } from '../types/pet';

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

/** Lazily generated portrait for the pet's current evolution stage. */
export async function fetchPetImage(id: string): Promise<string | null> {
  const res = await api.get<{ imageUrl: string | null }>(`/pets/${id}/image`);
  return res.imageUrl;
}

/** Replace the cached portrait with a freshly generated one. */
export async function regeneratePetImage(id: string): Promise<string | null> {
  const res = await api.post<{ imageUrl: string | null }>(
    `/pets/${id}/image/regenerate`,
  );
  return res.imageUrl;
}

// --- Equipment -------------------------------------------------------------

export async function equipItem(petId: string, itemId: string): Promise<Pet> {
  return api.post<Pet>(`/pets/${petId}/equip`, { itemId });
}

export async function unequipItem(
  petId: string,
  itemId: string,
): Promise<Pet> {
  return api.post<Pet>(`/pets/${petId}/unequip`, { itemId });
}

// --- Trading ---------------------------------------------------------------

/** My open trade offers, incoming and outgoing. */
export async function fetchMyTrades(): Promise<PetTrade[]> {
  return api.get<PetTrade[]>('/pets/trades');
}

export async function createTrade(
  petId: string,
  toUsername: string,
  price: number,
): Promise<PetTrade> {
  return api.post<PetTrade>('/pets/trades', { petId, toUsername, price });
}

export async function acceptTrade(
  id: string,
): Promise<{ trade: PetTrade; pet: Pet }> {
  return api.post<{ trade: PetTrade; pet: Pet }>(`/pets/trades/${id}/accept`);
}

export async function declineTrade(id: string): Promise<PetTrade> {
  return api.post<PetTrade>(`/pets/trades/${id}/decline`);
}

export async function cancelTrade(id: string): Promise<PetTrade> {
  return api.post<PetTrade>(`/pets/trades/${id}/cancel`);
}
