import { useEffect, useState } from 'react';
import { readStored } from './storage.js';

export function useStoredState(key, fallback, normalize) {
  const [value, setValue] = useState(() => {
    try { return readStored(window.localStorage, key, fallback, normalize); }
    catch { return fallback; }
  });
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      setError(false);
    } catch {
      setError(true);
    }
  }, [key, value]);

  useEffect(() => {
    function sync(event) {
      if (event.storageArea !== window.localStorage || (event.key !== key && event.key !== null)) return;
      setValue(readStored(event.storageArea, key, fallback, normalize));
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [key, fallback, normalize]);

  return [value, setValue, error];
}

export function useSystemDarkMode() {
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setDark(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return dark;
}
