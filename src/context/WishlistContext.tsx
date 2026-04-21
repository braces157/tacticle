import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { readJson, writeJson } from "../services/browserStorage";
import { useSession } from "./SessionContext";
import type { ProductDetail, ProductSummary, WishlistItem } from "../types/domain";

type WishlistContextValue = {
  items: WishlistItem[];
  itemCount: number;
  isSaved(slug: string): boolean;
  toggleItem(product: ProductSummary | ProductDetail): boolean;
  removeItem(slug: string): void;
  clearWishlist(): void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function wishlistKey(userId: string | null | undefined) {
  return userId ? `tactile.wishlist.${userId}` : "tactile.wishlist.guest";
}

function toWishlistItem(product: ProductSummary | ProductDetail): WishlistItem {
  return {
    id: product.id,
    slug: product.slug,
    categorySlug: product.categorySlug,
    name: product.name,
    subtitle: product.subtitle,
    price: product.price,
    image: { ...product.image },
    tags: [...product.tags],
    material: product.material,
    savedAt: new Date().toISOString(),
  };
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const storageKey = wishlistKey(user?.id);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  useEffect(() => {
    setItems(readJson<WishlistItem[]>(storageKey, []));
    setLoadedKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (loadedKey !== storageKey) {
      return;
    }
    writeJson(storageKey, items);
  }, [items, loadedKey, storageKey]);

  function isSaved(slug: string) {
    return items.some((item) => item.slug === slug);
  }

  function toggleItem(product: ProductSummary | ProductDetail) {
    const exists = items.some((item) => item.slug === product.slug);
    setItems((current) =>
      exists
        ? current.filter((item) => item.slug !== product.slug)
        : [toWishlistItem(product), ...current.filter((item) => item.slug !== product.slug)],
    );
    return !exists;
  }

  function removeItem(slug: string) {
    setItems((current) => current.filter((item) => item.slug !== slug));
  }

  function clearWishlist() {
    setItems([]);
  }

  return (
    <WishlistContext.Provider
      value={{
        items,
        itemCount: items.length,
        isSaved,
        toggleItem,
        removeItem,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }

  return context;
}
