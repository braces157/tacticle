import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Button, buttonClassName } from "../components/ui/Button";
import { ProductCard } from "../components/ui/ProductCard";
import { SectionHeading } from "../components/ui/SectionHeading";
import { catalogService, searchService } from "../services/storefrontApi";
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

export function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const [categories, setCategories] = useState<Category[]>([]);
  const [results, setResults] = useState<ProductSummary[] | null>(null);
  const [curated, setCurated] = useState<ProductSummary[]>([]);
  const [error, setError] = useState(false);
  const [categorySlug, setCategorySlug] = useState("all");
  const [material, setMaterial] = useState("all");
  const [sort, setSort] = useState<CatalogSort>("curated");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);

  useEffect(() => {
    let cancelled = false;

    setError(false);
    setResults(null);
    setVisibleCount(initialVisibleCount);

    Promise.all([
      catalogService.listCategories(),
      query ? searchService.searchProducts(query) : Promise.resolve<ProductSummary[]>([]),
      catalogService.listFeaturedProducts(),
    ])
      .then(([categoryData, productResults, featured]) => {
        if (cancelled) {
          return;
        }

        setCategories(categoryData);
        setResults(productResults);
        setCurated(featured);
        const bounds = getCatalogPriceBounds(productResults);
        setCategorySlug("all");
        setMaterial("all");
        setSort("curated");
        setMinPrice(bounds.min);
        setMaxPrice(bounds.max);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [query]);

  if (error) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><ErrorState /></div>;
  }

  if (results === null) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><LoadingState label="Scanning the exhibition…" /></div>;
  }

  const bounds = getCatalogPriceBounds(results);
  const categoryOptions = buildCatalogCategoryOptions(results, categories);
  const materialOptions = buildCatalogMaterialOptions(results);
  const filteredProducts = sortCatalogProducts(
    filterCatalogProducts(results, {
      categorySlug,
      material,
      minPrice,
      maxPrice,
    }),
    sort,
  );
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  function resetFilters() {
    setCategorySlug("all");
    setMaterial("all");
    setSort("curated");
    setMinPrice(bounds.min);
    setMaxPrice(bounds.max);
    setVisibleCount(initialVisibleCount);
  }

  return (
    <section className="page-fade mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-10 lg:grid-cols-[0.82fr_0.18fr] lg:items-end">
        <SectionHeading
          kicker="Search"
          title={query ? `Results for “${query}”` : "Search the gallery"}
          description="Refine the returned pieces by collection, material, and price without leaving the result set."
        />
        <div className="surface-card rounded-[1.5rem] p-5 text-sm text-[var(--color-muted)]">
          <p>Returned pieces</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em] text-[var(--color-on-surface)]">
            {results.length}
          </p>
        </div>
      </div>

      {results.length ? (
        <div className="mt-12 grid gap-10 lg:grid-cols-[0.28fr_0.72fr]">
          <aside className="space-y-6">
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
                  All
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
                    {option.label}
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
                Clear all filters
              </Button>
            </div>
          </aside>

          <div>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-muted)]">
              <p>{visibleProducts.length} of {filteredProducts.length} visible after refinement</p>
              <p>{query ? `Query: ${query}` : "Use the top search field to narrow the gallery"}</p>
            </div>

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
                title="No pieces match the current filters"
                body="Reset the category, material, or price range to bring the broader result set back into view."
                actionLabel="Clear all filters"
                actionHref={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 lg:grid-cols-[0.68fr_0.32fr]">
          <div className="surface-mat rounded-[1.75rem] p-8">
            <h2 className="font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
              No results found
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
              Try a broader material term, collection name, or browse the curated alternatives below.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/browse" className={buttonClassName()}>
                Browse full gallery
              </Link>
              <Link to="/search?q=tactile" className={buttonClassName("secondary")}>
                Try a broader search
              </Link>
            </div>
          </div>

          <div className="surface-card rounded-[1.75rem] p-8">
            <p className="eyebrow">Suggested next terms</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["tactile", "aluminum", "desk mat", "switch pack"].map((term) => (
                <Link key={term} to={`/search?q=${encodeURIComponent(term)}`}>
                  <span className="inline-flex rounded-full bg-[var(--color-surface-low)] px-4 py-2 text-sm text-[var(--color-on-surface)]">
                    {term}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {!results.length && curated.length ? (
        <section className="mt-16">
          <SectionHeading
            kicker="Curated alternatives"
            title="Pieces worth opening instead"
            description="A smaller editorial fallback so the no-results route still moves the user somewhere intentional."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {curated.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
