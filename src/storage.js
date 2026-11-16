import { categories, exercises } from './exercises.js';

export const storageKeys = {
  plan: 'fotballbanken-plan-v1',
  favorites: 'fotballbanken-favorites-v1',
  filters: 'fotballbanken-filters-v1',
};

export const defaultFilters = { age: 'Alle aldre', category: 'Alle øvelser', favoritesOnly: false };

export function normalizeIds(value) {
  return Array.isArray(value)
    ? [...new Set(value)].filter(id => exercises.some(exercise => exercise.id === id))
    : [];
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
