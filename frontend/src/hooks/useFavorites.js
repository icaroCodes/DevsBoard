import { useState } from 'react';

const FAV_KEY = 'db.projects.favorites';

function loadFavs() {
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch { return new Set(); }
}
function saveFavs(set) {
  localStorage.setItem(FAV_KEY, JSON.stringify([...set]));
}

export function useFavorites() {
  const [favs, setFavs] = useState(loadFavs);
  const toggle = (id) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveFavs(next);
      return next;
    });
  };
  return { favs, isFav: (id) => favs.has(id), toggle };
}
