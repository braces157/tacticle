import { Link } from "react-router-dom";
import type { ProductSummary } from "../../types/domain";
import { formatCurrency } from "../../utils/currency";
import { shouldContainProductImage } from "../../utils/productMedia";
import { Button } from "./Button";

export function ProductCard({
  product,
  onQuickAdd,
}: {
  product: ProductSummary;
  onQuickAdd?: (slug: string) => void;
}) {
  const useContainedImage = shouldContainProductImage(product.tags);

  return (
    <article className="surface-card ambient-shadow flex h-full flex-col justify-between p-4">
      <Link to={`/product/${product.slug}`} className="group block">
        <div className="aspect-[4/3] overflow-hidden bg-[var(--color-surface-low)]">
          <img
            src={product.image.src}
            alt={product.image.alt}
            className={[
              "h-full w-full transition duration-700",
              useContainedImage
                ? "object-contain p-4 group-hover:scale-[1.02]"
                : "object-cover group-hover:scale-[1.03]",
            ].join(" ")}
          />
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
            {product.material}
          </p>
          <h3 className="font-['Manrope'] text-2xl font-extrabold tracking-[-0.03em]">
            {product.name}
          </h3>
          <p className="text-sm leading-6 text-[var(--color-muted)]">
            {product.subtitle}
          </p>
        </div>
      </Link>
      <div className="mt-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--color-muted)]">
            From
          </p>
          <p className="font-['Manrope'] text-xl font-bold">{formatCurrency(product.price)}</p>
        </div>
        {onQuickAdd ? (
          <Button variant="secondary" onClick={() => onQuickAdd(product.slug)}>
            Quick add
          </Button>
        ) : null}
      </div>
    </article>
  );
}
