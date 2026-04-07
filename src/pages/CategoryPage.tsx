import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { ProductCard } from "../components/ui/ProductCard";
import { SectionHeading } from "../components/ui/SectionHeading";
import { catalogService } from "../services/storefrontApi";
import type { Category, ProductSummary } from "../types/domain";
import { formatCurrency } from "../utils/currency";
import { shouldContainProductImage } from "../utils/productMedia";

const defaultPriceFloor = 0;
const defaultPriceCeiling = 1000;
const categoryPageSize = 18;
const keyboardPageSize = 8;
const allBrandsLabel = "All Brands";
const allFormFactorsLabel = "All Keyboards";
const noisyKeyboardTags = new Set([
  "Keyboard",
  "Imported",
  "Switch",
  "Color",
  "Expanded Catalog",
  "Studio Edition",
  "Edition",
  "Weight Color",
  "Bottom Material",
  "Flex Cut PCB",
  "Print Method",
  "Size",
  "Plate Material",
  "Physical Layout",
]);
const keyboardFormFactors = [
  { label: "60%", patterns: [/(^|[^0-9])60%(?=$|[^0-9])/i] },
  { label: "65%", patterns: [/(^|[^0-9])65%(?=$|[^0-9])/i] },
  { label: "75%", patterns: [/(^|[^0-9])75%(?=$|[^0-9])/i] },
  { label: "TKL", patterns: [/\bTKL\b/i, /\btenkeyless\b/i] },
  { label: "96%", patterns: [/(^|[^0-9])96%(?=$|[^0-9])/i] },
  { label: "98%", patterns: [/(^|[^0-9])98%(?=$|[^0-9])/i] },
  { label: "Alice", patterns: [/\bAlice\b/i] },
  { label: "Split", patterns: [/\bSplit\b/i] },
  { label: "Full Size", patterns: [/\bfull[- ]size\b/i, /\b104-key\b/i] },
];

function getProductSearchText(product: ProductSummary) {
  return [product.name, product.subtitle, product.material, ...product.tags].join(" ");
}

function getKeyboardBrand(product: ProductSummary) {
  const brandTag = product.tags.find(
    (tag) => !noisyKeyboardTags.has(tag) && !/%|TKL/i.test(tag),
  );

  if (brandTag) {
    return brandTag;
  }

  const [firstWord] = product.name.split(" ");
  return firstWord || "Other";
}

function getKeyboardBrands(items: ProductSummary[]) {
  const counts = new Map<string, number>();

  for (const product of items) {
    const brand = getKeyboardBrand(product);
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }

  return [allBrandsLabel, ...[...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([brand]) => brand)];
}

function matchesKeyboardBrand(product: ProductSummary, brand: string) {
  return brand === allBrandsLabel || getKeyboardBrand(product) === brand;
}

function matchesKeyboardFormFactor(product: ProductSummary, label: string) {
  if (label === allFormFactorsLabel) {
    return true;
  }

  const descriptor = getProductSearchText(product);
  const formFactor = keyboardFormFactors.find((item) => item.label === label);
  return formFactor ? formFactor.patterns.some((pattern) => pattern.test(descriptor)) : false;
}

function getKeyboardFormFactorLabels(items: ProductSummary[]) {
  return [
    allFormFactorsLabel,
    ...keyboardFormFactors
      .filter((item) => items.some((product) => matchesKeyboardFormFactor(product, item.label)))
      .map((item) => item.label),
  ];
}

function getKeyboardPriceBounds(items: ProductSummary[]) {
  if (!items.length) {
    return {
      floor: defaultPriceFloor,
      ceiling: defaultPriceCeiling,
    };
  }

  const prices = items.map((product) => product.price);
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);

  return {
    floor: Math.max(defaultPriceFloor, Math.floor(minimum / 10) * 10),
    ceiling: Math.max(defaultPriceFloor + 10, Math.ceil(maximum / 10) * 10),
  };
}

function getVisiblePageNumbers(totalPages: number, currentPage: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  if (currentPage <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (currentPage >= totalPages - 2) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
    pages.add(totalPages - 3);
  }

  return [...pages]
    .filter((pageNumber) => pageNumber >= 1 && pageNumber <= totalPages)
    .sort((left, right) => left - right);
}

export function CategoryPage() {
  const { slug = "" } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [error, setError] = useState(false);
  const [brandFilter, setBrandFilter] = useState(allBrandsLabel);
  const [formFactorFilter, setFormFactorFilter] = useState(allFormFactorsLabel);
  const [minPrice, setMinPrice] = useState(defaultPriceFloor);
  const [maxPrice, setMaxPrice] = useState(defaultPriceCeiling);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setError(false);
    setCategory(null);
    setProducts([]);
    setCurrentPage(1);

    Promise.all([
      catalogService.getCategory(slug),
      catalogService.listProductsByCategory(slug),
    ])
      .then(([categoryData, productData]) => {
        setCategory(categoryData);
        setProducts(productData);
      })
      .catch(() => setError(true));
  }, [slug]);

  const isKeyboardGallery = slug === "keyboards";
  const { floor: keyboardPriceFloor, ceiling: keyboardPriceCeiling } = getKeyboardPriceBounds(products);
  const keyboardBrands = isKeyboardGallery ? getKeyboardBrands(products) : [];
  const keyboardFormFactorLabels = isKeyboardGallery ? getKeyboardFormFactorLabels(products) : [];

  useEffect(() => {
    if (!isKeyboardGallery) {
      return;
    }

    setBrandFilter(allBrandsLabel);
    setFormFactorFilter(allFormFactorsLabel);
    setMinPrice(keyboardPriceFloor);
    setMaxPrice(keyboardPriceCeiling);
  }, [isKeyboardGallery, keyboardPriceCeiling, keyboardPriceFloor, slug, products]);

  useEffect(() => {
    if (!isKeyboardGallery) {
      return;
    }

    setCurrentPage(1);
  }, [brandFilter, formFactorFilter, isKeyboardGallery, maxPrice, minPrice]);

  if (error) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><ErrorState /></div>;
  }

  if (!category) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><LoadingState label="Preparing this room of the gallery…" /></div>;
  }

  const filteredProducts = isKeyboardGallery
    ? products.filter(
        (product) =>
          matchesKeyboardBrand(product, brandFilter) &&
          matchesKeyboardFormFactor(product, formFactorFilter) &&
          product.price >= Math.min(minPrice, maxPrice) &&
          product.price <= Math.max(minPrice, maxPrice),
      )
    : products;
  const pageSize = isKeyboardGallery ? keyboardPageSize : categoryPageSize;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );
  const visiblePageNumbers = getVisiblePageNumbers(totalPages, safeCurrentPage);
  const activeMinPrice = Math.min(minPrice, maxPrice);
  const activeMaxPrice = Math.max(minPrice, maxPrice);
  const formFactorCounts = keyboardFormFactorLabels.map((label) => ({
    label,
    count:
      label === allFormFactorsLabel
        ? products.length
        : products.filter((product) => matchesKeyboardFormFactor(product, label)).length,
    active: formFactorFilter === label,
  }));
  const brandCounts = keyboardBrands.map((label) => ({
    label,
    count:
      label === allBrandsLabel
        ? products.length
        : products.filter((product) => matchesKeyboardBrand(product, label)).length,
    active: brandFilter === label,
  }));

  function handleMinPriceChange(value: number) {
    const nextValue = Math.min(keyboardPriceCeiling, Math.max(keyboardPriceFloor, value));
    setMinPrice(Math.min(nextValue, maxPrice));
  }

  function handleMaxPriceChange(value: number) {
    const nextValue = Math.min(keyboardPriceCeiling, Math.max(keyboardPriceFloor, value));
    setMaxPrice(Math.max(nextValue, minPrice));
  }

  return (
    <div className="page-fade">
      {isKeyboardGallery ? (
        <section className="mx-auto max-w-7xl px-6 py-16">
          <header className="mb-16">
            <p className="eyebrow">{category.kicker}</p>
            <h1 className="mt-4 font-['Manrope'] text-6xl font-extrabold tracking-[-0.06em] text-[var(--color-on-surface)]">
              THE GALLERY.
            </h1>
            <h2 className="mt-6 max-w-2xl font-['Manrope'] text-3xl font-bold tracking-[-0.04em] text-[var(--color-on-surface)] md:text-4xl">
              {category.headline}
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-[var(--color-primary)]/90">
              {category.description}
            </p>
          </header>

          <div className="flex flex-col gap-14 md:flex-row">
            <aside className="w-full shrink-0 md:w-64 md:space-y-10">
              <section>
                <h3 className="mb-6 font-['Manrope'] text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-on-surface)]">
                  Form Factor
                </h3>
                <ul className="space-y-3 pr-5 text-sm text-[var(--color-primary)]">
                  {formFactorCounts.map((item) => (
                    <li
                      key={item.label}
                      className="grid grid-cols-[minmax(0,1fr)_3ch] items-center gap-3"
                    >
                      <button
                        type="button"
                        onClick={() => setFormFactorFilter(item.label)}
                        aria-pressed={item.active}
                        className={[
                          "col-span-2 grid w-full grid-cols-subgrid items-center text-left transition",
                          item.active ? "font-semibold text-[var(--color-on-surface)]" : "hover:text-[var(--color-on-surface)]",
                        ].join(" ")}
                      >
                        <span>{item.label}</span>
                        <span className={["text-right tabular-nums", item.active ? "" : "opacity-50"].join(" ")}>
                          {item.count}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="mb-6 font-['Manrope'] text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-on-surface)]">
                  Brand
                </h3>
                <div className="max-h-72 space-y-3 overflow-y-auto pr-5 [scrollbar-gutter:stable] text-sm text-[var(--color-primary)]">
                  {brandCounts.map((item) => {
                    const { label } = item;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setBrandFilter(label)}
                        aria-pressed={item.active}
                        className="grid w-full grid-cols-[minmax(0,1fr)_3ch] items-center gap-3 text-left transition hover:text-[var(--color-on-surface)]"
                      >
                        <span className={item.active ? "font-semibold text-[var(--color-on-surface)]" : ""}>
                          {label}
                        </span>
                        <span className={["text-right tabular-nums", item.active ? "" : "opacity-50"].join(" ")}>
                          {item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <h3 className="mb-6 font-['Manrope'] text-xs font-bold uppercase tracking-[0.24em] text-[var(--color-on-surface)]">
                  Price Range
                </h3>
                <div className="space-y-5 px-2">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="space-y-2">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Min
                      </span>
                      <input
                        type="number"
                        min={keyboardPriceFloor}
                        max={keyboardPriceCeiling}
                        step={5}
                        value={minPrice}
                        onChange={(event) =>
                          handleMinPriceChange(Number(event.target.value) || keyboardPriceFloor)
                        }
                        className="input-shell w-full bg-transparent px-4 py-3 text-sm outline-none"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        Max
                      </span>
                      <input
                        type="number"
                        min={keyboardPriceFloor}
                        max={keyboardPriceCeiling}
                        step={5}
                        value={maxPrice}
                        onChange={(event) =>
                          handleMaxPriceChange(Number(event.target.value) || keyboardPriceCeiling)
                        }
                        className="input-shell w-full bg-transparent px-4 py-3 text-sm outline-none"
                      />
                    </label>
                  </div>
                  <div className="space-y-3">
                    <label className="block">
                      <span className="sr-only">Minimum price slider</span>
                      <input
                        type="range"
                        min={keyboardPriceFloor}
                        max={keyboardPriceCeiling}
                        step={5}
                        value={minPrice}
                        onChange={(event) => handleMinPriceChange(Number(event.target.value))}
                        className="w-full accent-[var(--color-primary)]"
                      />
                    </label>
                    <label className="block">
                      <span className="sr-only">Maximum price slider</span>
                      <input
                        type="range"
                        min={keyboardPriceFloor}
                        max={keyboardPriceCeiling}
                        step={5}
                        value={maxPrice}
                        onChange={(event) => handleMaxPriceChange(Number(event.target.value))}
                        className="w-full accent-[var(--color-primary)]"
                      />
                    </label>
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-primary)]/70">
                    <span>${activeMinPrice}</span>
                    <span>${activeMaxPrice}</span>
                  </div>
                </div>
              </section>

              <button
                type="button"
                onClick={() => {
                  setFormFactorFilter(allFormFactorsLabel);
                  setBrandFilter(allBrandsLabel);
                  setMinPrice(keyboardPriceFloor);
                  setMaxPrice(keyboardPriceCeiling);
                }}
                className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]"
              >
                Reset Filters
              </button>
            </aside>

            <section className="min-w-0 flex-1">
              <div className="mb-8 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
                <span>Showing {filteredProducts.length} of {products.length} pieces</span>
                <span>{formFactorFilter} / {brandFilter} / ${activeMinPrice}-${activeMaxPrice}</span>
              </div>
              {filteredProducts.length ? (
                <>
                  <div className="grid grid-cols-1 gap-x-10 gap-y-16 md:grid-cols-2">
                    {paginatedProducts.map((product, index) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.slug}`}
                        className={[
                          "group block transition duration-500",
                          index === 1 ? "md:mt-24" : "",
                          index >= 3 && index % 2 === 1 ? "md:mt-20" : "",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "overflow-hidden bg-[var(--color-card)]",
                            index < 2 ? "aspect-[4/5]" : "aspect-square",
                          ].join(" ")}
                        >
                          <img
                            src={product.image.src}
                            alt={product.image.alt}
                            className={[
                              "h-full w-full grayscale transition duration-700 group-hover:grayscale-0",
                              shouldContainProductImage(product.tags)
                                ? "object-contain p-5 group-hover:scale-[1.02]"
                                : "object-cover group-hover:scale-[1.04]",
                            ].join(" ")}
                          />
                        </div>
                        <div className="mt-6 space-y-1">
                          <p className="font-['Manrope'] text-xs uppercase tracking-[0.24em] text-[var(--color-primary)]/70">
                            {product.tags[0] ?? category.name}
                          </p>
                          <h3 className="font-['Manrope'] text-2xl font-bold tracking-[-0.03em] transition-colors group-hover:text-[var(--color-primary)]">
                            {product.name.toUpperCase()}
                          </h3>
                          <p className="font-medium text-[var(--color-primary)]">
                            {formatCurrency(product.price)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {totalPages > 1 ? (
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={safeCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {visiblePageNumbers.map((pageNumber, index) => (
                          <div key={pageNumber} className="contents">
                            {index > 0 && visiblePageNumbers[index - 1] !== pageNumber - 1 ? (
                              <span className="px-1 text-sm text-[var(--color-muted)]">...</span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(pageNumber)}
                              aria-current={safeCurrentPage === pageNumber ? "page" : undefined}
                              className={[
                                "inline-flex h-11 w-11 items-center justify-center rounded-full p-0 text-sm font-semibold transition",
                                safeCurrentPage === pageNumber
                                  ? "bg-[var(--color-on-surface)] text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                                  : "bg-[var(--color-card)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)]",
                              ].join(" ")}
                            >
                              {pageNumber}
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={safeCurrentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  title="No keyboards match these filters."
                  body="Adjust the brand, form factor, or price range to bring more pieces back into view."
                  actionLabel="Reset filters"
                  actionHref="/category/keyboards"
                />
              )}
            </section>
          </div>
        </section>
      ) : (
        <>
          <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="eyebrow">{category.kicker}</p>
              <h1 className="display-title mt-4">{category.headline}</h1>
              <p className="mt-6 max-w-lg text-base leading-8 text-[var(--color-muted)]">
                {category.description}
              </p>
              <p className="mt-6 max-w-lg text-sm leading-7 text-[var(--color-muted)]">
                {category.story}
              </p>
              <div className="mt-8 flex gap-4">
                <Link to="/search?q=tactile">
                  <Button variant="secondary">Search related pieces</Button>
                </Link>
              </div>
            </div>
            <div className="poster-frame min-h-[360px] rounded-[2rem] lg:min-h-[560px]">
              <img
                src={category.heroImage.src}
                alt={category.heroImage.alt}
                className="h-full w-full object-cover"
              />
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-8">
            <SectionHeading
              kicker={`${category.name} / Selection`}
              title={`Current ${category.name.toLowerCase()} pieces`}
              description="Built responsively from the handoff screens, with shared cards and toned surface layering rather than rigid borders."
            />
            <div className="mt-12">
              {filteredProducts.length ? (
                <>
                  <div className="mb-8 flex flex-col gap-3 text-sm text-[var(--color-muted)] md:flex-row md:items-center md:justify-between">
                    <p>
                      Showing {paginatedProducts.length} of {filteredProducts.length} {category.name.toLowerCase()} pieces
                    </p>
                    <p>
                      Page {safeCurrentPage} of {totalPages}
                    </p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {paginatedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                  {totalPages > 1 ? (
                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={safeCurrentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {visiblePageNumbers.map((pageNumber, index) => (
                          <div key={pageNumber} className="contents">
                            {index > 0 && visiblePageNumbers[index - 1] !== pageNumber - 1 ? (
                              <span className="px-1 text-sm text-[var(--color-muted)]">...</span>
                            ) : null}
                            <button
                              type="button"
                              onClick={() => setCurrentPage(pageNumber)}
                              aria-current={safeCurrentPage === pageNumber ? "page" : undefined}
                              className={[
                                "inline-flex h-11 w-11 items-center justify-center rounded-full p-0 text-sm font-semibold transition",
                                safeCurrentPage === pageNumber
                                  ? "bg-[var(--color-on-surface)] text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
                                  : "bg-[var(--color-card)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-low)]",
                              ].join(" ")}
                            >
                              {pageNumber}
                            </button>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={safeCurrentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState
                  title="Nothing is on display yet."
                  body="This category is ready for product data but currently has no active pieces."
                  actionLabel="Return home"
                  actionHref="/"
                />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
