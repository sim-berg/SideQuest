import { api } from './api';
import type {
  CollectResult,
  CraftResult,
  CraftingRecipeView,
  Inventory,
  TreasureSpawn,
} from '../types/treasure';

/** Active treasure chests near a position (also pings the spawn worker). */
export function fetchNearbyTreasures(
  lat: number,
  lng: number,
): Promise<TreasureSpawn[]> {
  return api.get<TreasureSpawn[]>(`/treasures/nearby?lat=${lat}&lng=${lng}`);
}

export function collectTreasure(
  id: string,
  lat: number,
  lng: number,
): Promise<CollectResult> {
  return api.post<CollectResult>(`/treasures/${id}/collect`, { lat, lng });
}

export function fetchInventory(): Promise<Inventory> {
  return api.get<Inventory>('/treasures/inventory');
}

export function fetchRecipes(): Promise<CraftingRecipeView[]> {
  return api.get<CraftingRecipeView[]>('/treasures/recipes');
}

export function craftItems(itemIds: string[]): Promise<CraftResult> {
  return api.post<CraftResult>('/treasures/craft', { itemIds });
}
