import { EmptyState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { ProductCard } from "../components/ui/ProductCard";
import { SectionHeading } from "../components/ui/SectionHeading";
import { useCart } from "../context/CartContext";
import { useSession } from "../context/SessionContext";
import { useWishlist } from "../context/WishlistContext";

export function WishlistPage() {
  const { user } = useSession();
  const { addItem } = useCart();
  const { items, clearWishlist } = useWishlist();

  return (
    <section className="page-fade mx-auto max-w-7xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          kicker="Wishlist"
          title="Saved pieces"
          description={
            user
              ? "A personal shortlist of products worth revisiting before you commit to a build."
              : "Saved products stay in this browser until you sign in or clear them."
          }
        />
        {items.length ? (
          <Button variant="tertiary" onClick={clearWishlist}>
            Clear wishlist
          </Button>
        ) : null}
      </div>

      <div className="mt-12">
        {items.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ProductCard
                key={item.slug}
                product={item}
                onQuickAdd={() =>
                  addItem({
                    product: {
                      ...item,
                      gallery: [item.image],
                      description: item.subtitle,
                      story: item.subtitle,
                      specs: [],
                      highlights: [],
                      options: [],
                    },
                    selectedOptions: {},
                    quantity: 1,
                  })
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No saved products yet"
            body="Save products from the gallery or a product page to build a shortlist."
            actionLabel="Browse the gallery"
            actionHref="/browse"
          />
        )}
      </div>
    </section>
  );
}
