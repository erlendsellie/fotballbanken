import { categories, exercises } from './exercises.js';

export const storageKeys = {
  plan: 'fotballbanken-plan-v1',
  favorites: 'fotballbanken-favorites-v1',
  filters: 'fotballbanken-filters-v1',
  trainings: 'fotballbanken-trainings-v1',
};

export const defaultFilters = { age: 'Alle aldre', category: 'Alle øvelser', favoritesOnly: false };

export function normalizeIds(value) {
  return Array.isArray(value)
    ? [...new Set(value)].filter(id => exercises.some(exercise => exercise.id === id))
    : [];
}

// Saved sessions are snapshots of a plan, independent from the working plan.
export function normalizeTrainings(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap(item => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.trim() || seen.has(item.id)) return [];
    if (typeof item.name !== 'string' || !item.name.trim()) return [];
    const exerciseIds = normalizeIds(item.exerciseIds);
    if (!exerciseIds.length) return [];
    seen.add(item.id);
    return [{
      id: item.id,
      name: item.name.trim().slice(0, 80),
      exerciseIds,
      completedIds: normalizeIds(item.completedIds).filter(id => exerciseIds.includes(id)),
      createdAt: typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)) ? item.createdAt : null,
    }];
  });
}

export function normalizeFilters(value) {
  return {
    age: ['Alle aldre', '6', '8', '10'].includes(value?.age) ? value.age : defaultFilters.age,
    category: categories.includes(value?.category) ? value.category : defaultFilters.category,
    favoritesOnly: value?.favoritesOnly === true,
  };
}

export function readStored(storage, key, fallback, normalize) {
  try {
    const value = storage.getItem(key);
    return value === null ? fallback : normalize(JSON.parse(value));
  } catch {
    return fallback;
  }
}
