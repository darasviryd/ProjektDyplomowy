import { api } from './api';
import { storage, STORAGE_KEYS } from './storage';

function toTime(x) {
  if (!x) return 0;
  const n = Number(x);
  if (!Number.isNaN(n)) return n;
  const t = new Date(x).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function mergeByUpdatedAt(localArr, remoteArr) {
  const merged = [...localArr];

  (remoteArr || []).forEach(remote => {
    const local = localArr.find(x => x.id === remote.id);
    const r = toTime(remote.updatedAt);
    const l = toTime(local?.updatedAt);

    if (!local || r > l) {
      const idx = merged.findIndex(x => x.id === remote.id);
      if (idx >= 0) merged[idx] = { ...local, ...remote };
      else merged.push(remote);
    }
  });

  return merged;
}

export const syncService = async () => {
  try {
    const localLists = await storage.get(STORAGE_KEYS.LISTS);
    const localItems = await storage.get(STORAGE_KEYS.ITEMS);

    const response = await api.sync({ lists: localLists, items: localItems });

    // Handle both { lists, items } and legacy array-of-lists response
    const remoteLists = Array.isArray(response) ? response : (response?.lists || []);
    const remoteItems = Array.isArray(response) ? [] : (response?.items || []);

    const mergedLists = mergeByUpdatedAt(localLists, remoteLists);
    const mergedItems = mergeByUpdatedAt(localItems, remoteItems);

    await storage.set(STORAGE_KEYS.LISTS, mergedLists);
    await storage.set(STORAGE_KEYS.ITEMS, mergedItems);

    return true;
  } catch {
    return false;
  }
};
