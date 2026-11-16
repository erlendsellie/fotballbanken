import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultFilters, normalizeFilters, normalizeIds, normalizeTrainings, readStored, storageKeys } from '../src/storage.js';
import { exercises, filterExercises } from '../src/exercises.js';

test('keeps the original training plan storage key during migration', () => {
  assert.equal(storageKeys.plan, 'fotballbanken-plan-v1');
});

test('normalizes plan and favorites without duplicates or removed exercises', () => {
  assert.deepEqual(normalizeIds(['haien', 'haien', 'removed', null, 1, 'porter']), ['haien', 'porter']);
  for (const value of [null, {}, 'haien', 2]) assert.deepEqual(normalizeIds(value), []);
});

test('loads saved favorites', () => {
  const storage = { getItem: () => '["porter","haien"]' };
  assert.deepEqual(readStored(storage, storageKeys.favorites, [], normalizeIds), ['porter', 'haien']);
});

test('handles missing, corrupt, and blocked localStorage', () => {
  for (const storage of [
    { getItem: () => null },
    { getItem: () => '{bad json' },
    { getItem: () => { throw new Error('blocked'); } },
  ]) assert.deepEqual(readStored(storage, storageKeys.plan, [], normalizeIds), []);
});

test('only restores supported filter values', () => {
  assert.deepEqual(normalizeFilters({ age: '8', category: 'Ballmestring', favoritesOnly: true }), { age: '8', category: 'Ballmestring', favoritesOnly: true });
  assert.deepEqual(normalizeFilters({ age: '99', category: 'gone', favoritesOnly: 'true' }), defaultFilters);
  assert.deepEqual(normalizeFilters(null), defaultFilters);
});

test('search is case insensitive and filters combine with favorites', () => {
  assert.deepEqual(filterExercises(exercises, 'HAIEN', 'Alle aldre', 'Alle øvelser').map(e => e.id), ['haien']);
  const favoriteIds = ['haien', 'porter'];
  assert.deepEqual(filterExercises(exercises, '', '8', 'Ballmestring').filter(e => favoriteIds.includes(e.id)).map(e => e.id), ['porter']);
  assert.equal(filterExercises(exercises, 'no such exercise', 'Alle aldre', 'Alle øvelser').length, 0);
});

test('exercise data has valid unique IDs and positive durations', () => {
  assert.equal(new Set(exercises.map(e => e.id)).size, exercises.length);
  assert.ok(exercises.every(e => e.minutes > 0 && e.steps.length > 0 && e.age[0] <= e.age[1]));
});

test('saves multiple named training sessions with their own ordered exercises and progress', () => {
  const input = [
    { id: 'a', name: '  Mandagstrening  ', exerciseIds: ['porter', 'haien', 'porter', 'missing'], completedIds: ['haien', 'missing'], createdAt: '2026-11-16T16:00:00.000Z' },
    { id: 'b', name: 'Torsdag', exerciseIds: ['smaaspill'], completedIds: ['smaaspill', 'smaaspill'] },
  ];
  assert.deepEqual(normalizeTrainings(input), [
    { id: 'a', name: 'Mandagstrening', exerciseIds: ['porter', 'haien'], completedIds: ['haien'], createdAt: '2026-11-16T16:00:00.000Z' },
    { id: 'b', name: 'Torsdag', exerciseIds: ['smaaspill'], completedIds: ['smaaspill'], createdAt: null },
  ]);
});

test('ignores invalid or duplicated training sessions, without touching the working plan', () => {
  const input = [
    null,
    { id: 'empty', name: 'Ingen øvelser', exerciseIds: ['missing'] },
    { id: 'ok', name: 'Trygg', exerciseIds: ['haien'] },
    { id: 'ok', name: 'Duplikat', exerciseIds: ['porter'] },
    { id: 'no-name', name: ' ', exerciseIds: ['porter'] },
  ];
  assert.deepEqual(normalizeTrainings(input).map(t => t.id), ['ok']);
  assert.deepEqual(normalizeTrainings({}), []);
  assert.deepEqual(readStored({ getItem: () => JSON.stringify(input) }, storageKeys.trainings, [], normalizeTrainings).map(t => t.id), ['ok']);
  assert.equal(storageKeys.plan, 'fotballbanken-plan-v1');
});
