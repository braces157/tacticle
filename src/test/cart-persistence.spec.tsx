import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "../context/CartContext";
import type { ProductDetail } from "../types/domain";

const product: ProductDetail = {
  id: "prod-core-65",
  slug: "tactile-core-65",
  categorySlug: "keyboards",
  name: "Tactile Core-65",
  subtitle: "A quiet 65% frame balanced for marbly acoustics.",
  price: 100,
  image: {
    src: "https://example.com/core-65.jpg",
    alt: "Tactile Core-65",
  },
  tags: ["Wireless", "Gallery Favorite"],
  material: "CNC aluminum",
  gallery: [
    { src: "https://example.com/core-65.jpg", alt: "Tactile Core-65" },
  ],
  description: "A softly weighted 65% layout with gasket isolation.",
  story: "The Core-65 exists for people who want restraint rather than spectacle.",
  specs: [
    { label: "Mounting", value: "Gasket mount" },
  ],
  highlights: ["Seven-layer acoustic stack"],
  options: [
    {
      id: "switches",
      group: "Switch Variant",
      values: [
        { id: "obsidian-tactile", label: "Obsidian Tactile", priceDelta: 0 },
        { id: "cream-linear", label: "Cream Linear", priceDelta: 0 },
      ],
    },
    {
      id: "plate",
      group: "Plate Material",
      values: [
        { id: "fr4", label: "FR4", priceDelta: 0 },
        { id: "brass", label: "Brass", priceDelta: 0 },
      ],
    },
  ],
};

function CartProbe() {
  const { items, itemCount, subtotal, addItem } = useCart();

  return (
    <div>
      <div data-testid="item-count">{itemCount}</div>
      <div data-testid="cart-length">{items.length}</div>
      <div data-testid="subtotal">{subtotal}</div>
      <button
        type="button"
        onClick={() =>
          addItem({
            product,
            selectedOptions: {
              "Plate Material": "Brass",
              "Switch Variant": "Obsidian Tactile",
            },
          })
        }
      >
        Add first item
      </button>
      <button
        type="button"
        onClick={() =>
          addItem({
            product,
            selectedOptions: {
              "Switch Variant": "Obsidian Tactile",
              "Plate Material": "Brass",
            },
          })
        }
      >
        Add same item with reordered options
      </button>
    </div>
  );
}

test("restores a persisted cart instead of wiping it on mount", async () => {
  const persistedCart = [
    {
      id: "tactile-core-65:[['Plate Material','Brass'],['Switch Variant','Obsidian Tactile']]",
      productSlug: "tactile-core-65",
      productName: "Tactile Core-65",
      image: { src: "https://example.com/core-65.jpg", alt: "Tactile Core-65" },
      price: 100,
      quantity: 1,
      selectedOptions: {
        "Plate Material": "Brass",
        "Switch Variant": "Obsidian Tactile",
      },
    },
  ];

  window.localStorage.setItem("tactile.cart", JSON.stringify(persistedCart));

  render(
    <CartProvider>
      <CartProbe />
    </CartProvider>,
  );

  expect(await screen.findByTestId("item-count")).toHaveTextContent("1");
  expect(screen.getByTestId("cart-length")).toHaveTextContent("1");
  expect(screen.getByTestId("subtotal")).toHaveTextContent("100");

  await waitFor(() => {
    expect(JSON.parse(window.localStorage.getItem("tactile.cart") ?? "[]")).toEqual(persistedCart);
  });
});

test("treats the same selected options as one cart line even when the object key order changes", async () => {
  const user = userEvent.setup();

  render(
    <CartProvider>
      <CartProbe />
    </CartProvider>,
  );

  await user.click(screen.getByRole("button", { name: /add first item/i }));
  await user.click(screen.getByRole("button", { name: /add same item with reordered options/i }));

  expect(screen.getByTestId("cart-length")).toHaveTextContent("1");
  expect(screen.getByTestId("item-count")).toHaveTextContent("2");
  expect(screen.getByTestId("subtotal")).toHaveTextContent("200");
});
