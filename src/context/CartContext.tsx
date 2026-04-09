import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { cartService } from "../services/storefrontApi";
import type { CartItem, ImageAsset, ProductDetail } from "../types/domain";

type AddToCartInput = {
  product: ProductDetail;
  selectedOptions: Record<string, string>;
  quantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  isDrawerOpen: boolean;
  itemCount: number;
  subtotal: number;
  addItem(input: AddToCartInput): void;
  updateQuantity(itemId: string, quantity: number): void;
  removeItem(itemId: string): void;
  clearCart(): void;
  openDrawer(): void;
  closeDrawer(): void;
};

const CartContext = createContext<CartContextValue | null>(null);

function createCartId(productSlug: string, selectedOptions: Record<string, string>) {
  const normalizedOptions = Object.entries(selectedOptions).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );

  return `${productSlug}:${JSON.stringify(normalizedOptions)}`;
}

function copyImage(image: ImageAsset): ImageAsset {
  return { src: image.src, alt: image.alt };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => cartService.loadCart());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    cartService.saveCart(items);
  }, [items]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addItem({ product, selectedOptions, quantity = 1 }: AddToCartInput) {
    const selectedPrice =
      product.price +
      product.options.reduce((sum, option) => {
        const label = selectedOptions[option.group];
        const value = option.values.find((entry) => entry.label === label);
        return sum + (value?.priceDelta ?? 0);
      }, 0);

    const itemId = createCartId(product.slug, selectedOptions);

    setItems((current) => {
      const existing = current.find((item) => item.id === itemId);
      if (existing) {
        return current.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [
        ...current,
        {
          id: itemId,
          productSlug: product.slug,
          productName: product.name,
          image: copyImage(product.image),
          price: selectedPrice,
          quantity,
          selectedOptions: { ...selectedOptions },
        },
      ];
    });

    setIsDrawerOpen(true);
  }

  function updateQuantity(itemId: string, quantity: number) {
    setItems((current) =>
      current
        .map((item) => (item.id === itemId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  }

  function removeItem(itemId: string) {
    setItems((current) => current.filter((item) => item.id !== itemId));
  }

  function clearCart() {
    setItems([]);
    cartService.clearCart();
  }

  return (
    <CartContext.Provider
      value={{
        items,
        isDrawerOpen,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
