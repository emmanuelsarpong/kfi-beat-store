import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface FavoriteBeatMeta {
  id: string;
  title: string;
  coverImage?: string;
  genre?: string;
  bpm?: number;
}

interface FavoritesContextValue {
  favorites: FavoriteBeatMeta[];
  ready: boolean;
  isFavorite: (id: string) => boolean;
  add: (beat: FavoriteBeatMeta) => void;
  remove: (id: string) => void;
  toggle: (beat: FavoriteBeatMeta) => void;
}

const STORAGE_KEY = "kfi:favorites:v1";

function readStorage(): FavoriteBeatMeta[] {
  try {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
}

function writeStorage(items: FavoriteBeatMeta[]) {
  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    /* ignore quota errors */
  }
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(
  undefined
);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [favorites, setFavorites] = useState<FavoriteBeatMeta[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorites(readStorage());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeStorage(favorites);
  }, [favorites, ready]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((f) => f.id === id),
    [favorites]
  );
  const add = useCallback((beat: FavoriteBeatMeta) => {
    setFavorites((prev) =>
      prev.some((p) => p.id === beat.id) ? prev : [...prev, beat]
    );
  }, []);
  const remove = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((p) => p.id !== id));
  }, []);
  const toggle = useCallback((beat: FavoriteBeatMeta) => {
    setFavorites((prev) =>
      prev.some((p) => p.id === beat.id)
        ? prev.filter((p) => p.id !== beat.id)
        : [...prev, beat]
    );
  }, []);

  const value: FavoritesContextValue = {
    favorites,
    ready,
    isFavorite,
    add,
    remove,
    toggle,
  };
  return React.createElement(FavoritesContext.Provider, { value }, children);
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    return {
      favorites: [],
      ready: false,
      isFavorite: () => false,
      add: () => {},
      remove: () => {},
      toggle: () => {},
    } as FavoritesContextValue;
  }
  return ctx;
};
// (No default export) Explicit named exports only
