import type { Category, ProductSummary } from "../types/domain";

export type CatalogSort = "curated" | "price-asc" | "price-desc" | "name-asc";

export type CatalogFilters = {
  categorySlug: string;
  material: string;
  minPrice: number;
  maxPrice: number;
  sort: CatalogSort;
};

export function getCatalogPriceBounds(products: ProductSummary[]) {
  if (!products.length) {
    return { min: 0, max: 1000 };
  }

  const prices = products.map((product) => product.price);
  return {
    min: Math.max(0, Math.floor(Math.min(...prices) / 10) * 10),
    max: Math.max(10, Math.ceil(Math.max(...prices) / 10) * 10),
  };
}

export function buildCatalogCategoryOptions(
  products: ProductSummary[],
  categories: Category[],
) {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.categorySlug, (counts.get(product.categorySlug) ?? 0) + 1);
  }

  return categories
    .filter((category) => counts.has(category.slug))
    .map((category) => ({
      value: category.slug,
      label: category.name,
      count: counts.get(category.slug) ?? 0,
    }));
}

export function buildCatalogMaterialOptions(products: ProductSummary[]) {
  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.material, (counts.get(product.material) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([label, count]) => ({ value: label, label, count }));
}

export function filterCatalogProducts(
  products: ProductSummary[],
  filters: Omit<CatalogFilters, "sort">,
) {
  const floor = Math.min(filters.minPrice, filters.maxPrice);
  const ceiling = Math.max(filters.minPrice, filters.maxPrice);

  return products.filter((product) => {
    if (filters.categorySlug !== "all" && product.categorySlug !== filters.categorySlug) {
      return false;
    }
    if (filters.material !== "all" && product.material !== filters.material) {
      return false;
    }
    return product.price >= floor && product.price <= ceiling;
  });
}

export function sortCatalogProducts(products: ProductSummary[], sort: CatalogSort) {
  const nextProducts = [...products];

  switch (sort) {
    case "price-asc":
      nextProducts.sort((left, right) => left.price - right.price || left.name.localeCompare(right.name));
      break;
    case "price-desc":
      nextProducts.sort((left, right) => right.price - left.price || left.name.localeCompare(right.name));
      break;
    case "name-asc":
      nextProducts.sort((left, right) => left.name.localeCompare(right.name));
      break;
    default:
      break;
  }

  return nextProducts;
}
