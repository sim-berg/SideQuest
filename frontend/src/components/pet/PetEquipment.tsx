import { useEffect, useState } from 'react';
import type { Pet } from '../../types/pet';
import type { Inventory } from '../../types/treasure';
import { fetchInventory } from '../../services/treasure.service';
import { equipItem, unequipItem } from '../../services/pet.service';
import { usePetStore } from '../../stores/usePetStore';
import { useToastStore } from '../../stores/useToastStore';

const MAX_SLOTS = 3;

/**
 * Equipment row of a pet: up to three treasure items from the inventory.
 * Tap an equipped item to take it off, "+" opens the inventory picker.
 */
export default function PetEquipment({ pet }: { pet: Pet }) {
  const upsertPet = usePetStore((s) => s.upsertPet);
  const showToast = useToastStore((s) => s.showToast);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchInventory().then(setInventory).catch(() => {});
  }, [pet.equipment.length]);

  const itemMeta = (itemId: string) =>
    inventory?.items.find((e) => e.itemId === itemId)?.item;

  const available =
    inventory?.items.filter((e) => !pet.equipment.includes(e.itemId)) ?? [];

  const handleEquip = async (itemId: string) => {
    setBusy(true);
    try {
      upsertPet(await equipItem(pet.id, itemId));
      setPickerOpen(false);
    } catch (e: any) {
      showToast(e?.message || 'Ausrüsten fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const handleUnequip = async (itemId: string) => {
    setBusy(true);
    try {
      upsertPet(await unequipItem(pet.id, itemId));
    } catch (e: any) {
      showToast(e?.message || 'Ablegen fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Ausrüstung
      </p>
      <div className="flex items-center gap-2">
        {pet.equipment.map((itemId) => {
          const item = itemMeta(itemId);
          return (
            <button
              key={itemId}
              onClick={() => void handleUnequip(itemId)}
              disabled={busy}
              title={`${item?.name ?? itemId} ablegen`}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl shadow-inner transition-all hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              {item?.emoji ?? '❓'}
            </button>
          );
        })}
        {pet.equipment.length < MAX_SLOTS && (
          <button
            onClick={() => setPickerOpen(!pickerOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-dashed border-slate-300 text-slate-400 transition-all hover:border-slate-400 dark:border-slate-600"
            title="Item ausrüsten"
          >
            +
          </button>
        )}
        {pet.equipment.length === 0 && !pickerOpen && (
          <span className="text-xs text-slate-400">
            Schätze aus deinem Beutel anlegen
          </span>
        )}
      </div>

      {pickerOpen && (
        <div className="mt-2 flex flex-wrap gap-2 rounded-xl bg-slate-50 p-2 dark:bg-slate-800/50">
          {available.length === 0 ? (
            <span className="px-1 py-0.5 text-xs text-slate-400">
              Keine freien Items — finde Schätze auf der Karte!
            </span>
          ) : (
            available.map((entry) => (
              <button
                key={entry.itemId}
                onClick={() => void handleEquip(entry.itemId)}
                disabled={busy}
                className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:shadow dark:bg-slate-700 dark:text-slate-200"
              >
                <span className="text-base">{entry.item.emoji}</span>
                {entry.item.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
