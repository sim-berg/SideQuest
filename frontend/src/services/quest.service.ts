import type { Quest } from '../types/quest';
import { mockQuests } from '../data/mock-quests';

const API_BASE = import.meta.env.VITE_API_URL as string | undefined;
const USE_MOCK = !API_BASE;

export async function fetchQuests(): Promise<Quest[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return mockQuests;
  }

  const res = await fetch(`${API_BASE}/quests`);
  if (!res.ok) throw new Error(`Failed to fetch quests: ${res.status}`);
  return res.json();
}

export async function fetchQuestById(id: string): Promise<Quest> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 100));
    const quest = mockQuests.find((q) => q.id === id);
    if (!quest) throw new Error(`Quest ${id} not found`);
    return quest;
  }

  const res = await fetch(`${API_BASE}/quests/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch quest: ${res.status}`);
  return res.json();
}

export async function createQuest(
  quest: Omit<Quest, 'id' | 'createdAt'>,
): Promise<Quest> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return {
      ...quest,
      id: `mock-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
  }

  const res = await fetch(`${API_BASE}/quests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(quest),
  });
  if (!res.ok) throw new Error(`Failed to create quest: ${res.status}`);
  return res.json();
}
