import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem, CartLicenseType } from "@/lib/cartItem";
import {
  beatToCartItem,
  normalizeStoredCartItem,
  updateCartItemLicense,
} from "@/lib/cartItem";
import type { BeatData } from "@/data/beats";

const STORAGE_KEY = "kfi:cart:v1";

interface CartContextValue {
  items: CartItem[];
  ready: boolean;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  openDrawer: () => void;
  hydrateCart: () => void;
  normalizeCartItems: () => void;
  addItemWithLicense: (beat: BeatData, licenseType: CartLicenseType) => void;
  removeItem: (beatId: string) => void;
  clearCart: () => void;
  updateItemLicense: (beatId: string, licenseType: CartLicenseType) => void;
  isInCart: (beatId: string) => boolean;
  getItem: (beatId: string) => CartItem | null;
  getCartCount: () => number;
  getSubtotal: () => number;
}

function readStorage(): CartItem[] {
  try {
    const raw =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => normalizeStoredCartItem(item))
      .filter((item): item is CartItem => Boolean(item));
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]) {
  try {
    if (typeof window !== "undefined") {
      if (items.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  } catch {
    /* ignore */
  }
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hydrateCart = useCallback(() => {
    setItems(readStorage());
    setReady(true);
  }, []);

  const normalizeCartItems = useCallback(() => {
    setItems((prev) =>
      prev
        .map((item) => normalizeStoredCartItem(item))
        .filter((item): item is CartItem => Boolean(item))
    );
  }, []);

  useEffect(() => {
    hydrateCart();
  }, [hydrateCart]);

  useEffect(() => {
    if (ready) writeStorage(items);
  }, [items, ready]);

  const openDrawer = useCallback(() => setDrawerOpen(true), []);

  const addItemWithLicense = useCallback((beat: BeatData, licenseType: CartLicenseType) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.beatId === beat.id);
      if (!existing) return [...prev, beatToCartItem(beat, licenseType)];
      if (existing.selectedLicense === licenseType) return prev;
      return prev.map((item) =>
        item.beatId === beat.id
          ? beatToCartItem(beat, licenseType, { addedAt: existing.addedAt })
          : item
      );
    });
  }, []);

  const removeItem = useCallback((beatId: string) => {
    setItems((prev) => prev.filter((p) => p.beatId !== beatId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const updateItemLicense = useCallback(
    (beatId: string, licenseType: CartLicenseType) => {
      setItems((prev) =>
        prev.map((item) =>
          item.beatId === beatId ? updateCartItemLicense(item, licenseType) : item
        )
      );
    },
    []
  );

  const isInCart = useCallback(
    (beatId: string) => items.some((p) => p.beatId === beatId),
    [items]
  );

  const getItem = useCallback(
    (beatId: string) => items.find((p) => p.beatId === beatId) ?? null,
    [items]
  );

  const getCartCount = useCallback(() => items.length, [items]);

  const getSubtotal = useCallback(
    () => items.reduce((sum, i) => sum + i.unitPrice, 0),
    [items]
  );

  const value = useMemo(
    (): CartContextValue => ({
      items,
      ready,
      drawerOpen,
      setDrawerOpen,
      openDrawer,
      hydrateCart,
      normalizeCartItems,
      addItemWithLicense,
      removeItem,
      clearCart,
      updateItemLicense,
      isInCart,
      getItem,
      getCartCount,
      getSubtotal,
    }),
    [
      items,
      ready,
      drawerOpen,
      openDrawer,
      hydrateCart,
      normalizeCartItems,
      addItemWithLicense,
      removeItem,
      clearCart,
      updateItemLicense,
      isInCart,
      getItem,
      getCartCount,
      getSubtotal,
    ]
  );

  return React.createElement(CartContext.Provider, { value }, children);
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      ready: false,
      drawerOpen: false,
      setDrawerOpen: () => {},
      openDrawer: () => {},
      hydrateCart: () => {},
      normalizeCartItems: () => {},
      addItemWithLicense: () => {},
      removeItem: () => {},
      clearCart: () => {},
      updateItemLicense: () => {},
      isInCart: () => false,
      getItem: () => null,
      getCartCount: () => 0,
      getSubtotal: () => 0,
    } as CartContextValue;
  }
  return ctx;
}
