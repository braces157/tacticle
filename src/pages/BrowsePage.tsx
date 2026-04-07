import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { ProductCard } from "../components/ui/ProductCard";
import { SectionHeading } from "../components/ui/SectionHeading";
import { catalogService } from "../services/storefrontApi";
import type { CatalogSort } from "../utils/catalogDiscovery";
import {
  buildCatalogCategoryOptions,
  buildCatalogMaterialOptions,
  filterCatalogProducts,
  getCatalogPriceBounds,
  sortCatalogProducts,
} from "../utils/catalogDiscovery";
import type { Category, ProductSummary } from "../types/domain";
import { formatCurrency } from "../utils/currency";

const initialVisibleCount = 6;

export function BrowsePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<ProductSummary[] | null>(null);
  const [error, setError] = useState(false);
  const [categorySlug, setCategorySlug] = useState("all");
  const [material, setMaterial] = useState("all");
  const [sort, setSort] = useState<CatalogSort>("curated");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  useEffect(() => {
    (async () => {
      try {
        const categoryData = await catalogService.listCategories();
        const listings = await Promise.all(
          categoryData.map(async (category) => catalogService.listProductsByCategory(category.slug)),
        );
        const productData = listings.flat();
        setCategories(categoryData);
        setProducts(productData);
        const bounds = getCatalogPriceBounds(productData);
        setMinPrice(bounds.min);
        setMaxPrice(bounds.max);
      } catch {
        setError(true);
      }
    })();
  }, []);

  if (error) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><ErrorState /></div>;
  }

  if (!products) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><LoadingState label="Opening the full gallery…" /></div>;
  }

  const bounds = getCatalogPriceBounds(products);
  const categoryOptions = buildCatalogCategoryOptions(products, categories);
  const materialOptions = buildCatalogMaterialOptions(products);
  const filteredProducts = sortCatalogProducts(
    filterCatalogProducts(products, {
      categorySlug,
      material,
      minPrice,
      maxPrice,
    }),
    sort,
  );
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const activeCategory = categories.find((item) => item.slug === categorySlug);

  function resetFilters() {
    setCategorySlug("all");
    setMaterial("all");
    setSort("curated");
    setMinPrice(bounds.min);
    setMaxPrice(bounds.max);
    setVisibleCount(initialVisibleCount);
  }

  return (
    <div className="page-fade">
      <section className="relative overflow-hidden px-6 py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div className="space-y-6">
            <p className="eyebrow">The Gallery</p>
            <h1 className="display-title max-w-3xl">
              A broader browse surface for keyboards, finishing pieces, and build parts.
            </h1>
            <p className="max-w-xl text-base leading-8 text-[var(--color-muted)]">
              Move across the full catalog with category, material, and price controls rather than
              dropping into a single room too early.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-[var(--color-muted)]">
              <span className="rounded-full bg-[var(--color-surface-low)] px-4 py-2">
                {products.length} active pieces
              </span>
              <span className="rounded-full bg-[var(--color-surface-low)] px-4 py-2">
                {categoryOptions.length} live collections
              </span>
            </div>
          </div>
          <div className="surface-mat rounded-[2rem] p-6 md:p-8">
            <p className="eyebrow">Current lens</p>
            <h2 className="mt-4 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
              {activeCategory?.name ?? "All collections"}
            </h2>
            <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
              {activeCategory?.story ??
                "Use the browse controls to move between complete boards, supporting accessories, and internal architecture."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/search?q=tactile">
                <Button>Search tactile</Button>
              </Link>
              <Link to="/category/keyboards">
                <Button variant="secondary">Jump to keyboards</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-10 lg:grid-cols-[0.28fr_0.72fr]">
          <aside className="space-y-8">
            <div className="surface-mat rounded-[1.5rem] p-6">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Category
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategorySlug("all")}
                  className={[
                    "rounded-full px-4 py-2 text-sm transition",
                    categorySlug === "all"
                      ? "bg-[var(--color-on-surface)] text-white"
                      : "bg-white text-[var(--color-on-surface)]",
                  ].join(" ")}
                >
                  All collections
                </button>
                {categoryOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setCategorySlug(option.value)}
                    className={[
                      "rounded-full px-4 py-2 text-sm transition",
                      categorySlug === option.value
                        ? "bg-[var(--color-on-surface)] text-white"
                        : "bg-white text-[var(--color-on-surface)]",
                    ].join(" ")}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-card rounded-[1.5rem] p-6">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Material
              </p>
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={() => setMaterial("all")}
                  className={[
                    "rounded-xl px-4 py-3 text-left text-sm transition",
                    material === "all"
                      ? "bg-[var(--color-on-surface)] text-white"
                      : "bg-[var(--color-surface-low)] text-[var(--color-on-surface)]",
                  ].join(" ")}
                >
                  All materials
                </button>
                {materialOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMaterial(option.value)}
                    className={[
                      "rounded-xl px-4 py-3 text-left text-sm transition",
                      material === option.value
                        ? "bg-[var(--color-on-surface)] text-white"
                        : "bg-[var(--color-surface-low)] text-[var(--color-on-surface)]",
                    ].join(" ")}
                  >
                    {option.label} ({option.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-card rounded-[1.5rem] p-6">
              <div className="flex items-center justify-between gap-4">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Price range
                </p>
                <span className="text-sm text-[var(--color-muted)]">
                  {formatCurrency(Math.min(minPrice, maxPrice))} - {formatCurrency(Math.max(minPrice, maxPrice))}
                </span>
              </div>
              <div className="mt-5 space-y-4">
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  step={10}
                  value={minPrice}
                  onChange={(event) => setMinPrice(Number(event.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
                <input
                  type="range"
                  min={bounds.min}
                  max={bounds.max}
                  step={10}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="surface-card rounded-[1.5rem] p-6">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Sort
                </span>
                <select
                  value={sort}
                  onChange={(event) => setSort(event.target.value as CatalogSort)}
                  className="input-shell bg-transparent px-4 py-3 outline-none"
                >
                  <option value="curated">Curated order</option>
                  <option value="price-asc">Price: low to high</option>
                  <option value="price-desc">Price: high to low</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
              </label>
              <Button variant="tertiary" className="mt-4" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          </aside>

          <div>
            <SectionHeading
              kicker="Browse"
              title="Current curation"
              description="A broader scan of the catalog with the missing gallery-level filters and sorting applied in one place."
            />
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
              <p>Showing {visibleProducts.length} of {filteredProducts.length} pieces</p>
              <p>{sort === "curated" ? "Editorial order" : sort.replace("-", " ")}</p>
            </div>
            <div className="mt-8">
              {filteredProducts.length ? (
                <>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {visibleProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  {visibleCount < filteredProducts.length ? (
                    <div className="mt-10 flex justify-center">
                      <Button variant="secondary" onClick={() => setVisibleCount((count) => count + initialVisibleCount)}>
                        View more curation
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  title="No pieces match this lens"
                  body="Reset the material, category, or price range to reopen the broader gallery."
                  actionLabel="Reset filters"
                  actionHref="/browse"
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
