import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { ProductCard } from "../components/ui/ProductCard";
import { SpecList } from "../components/ui/SpecList";
import { SectionHeading } from "../components/ui/SectionHeading";
import { useCart } from "../context/CartContext";
import { useSession } from "../context/SessionContext";
import { useWishlist } from "../context/WishlistContext";
import { catalogService } from "../services/storefrontApi";
import type { ProductDetail, ProductReview, ProductSummary, ReviewEligibility } from "../types/domain";
import { formatCurrency } from "../utils/currency";
import { shouldContainProductImage } from "../utils/productMedia";

function createInitialSelection(product: ProductDetail) {
  return product.options.reduce<Record<string, string>>((accumulator, option) => {
    accumulator[option.group] = option.values[0]?.label ?? "";
    return accumulator;
  }, {});
}

function calculateSelectedPrice(
  product: ProductDetail,
  selectedOptions: Record<string, string>,
) {
  return (
    product.price +
    product.options.reduce((sum, option) => {
      const label = selectedOptions[option.group];
      const value = option.values.find((entry) => entry.label === label);
      return sum + (value?.priceDelta ?? 0);
    }, 0)
  );
}

function isColorOption(group: string) {
  return /color/i.test(group);
}

function swatchBackground(label: string) {
  const normalized = label.trim().toLowerCase();

  if (normalized.includes("white & black")) {
    return "linear-gradient(135deg, #f5f5f5 0 50%, #111111 50% 100%)";
  }
  if (normalized.includes("mirror gold")) {
    return "linear-gradient(135deg, #f4d06f, #b8860b)";
  }
  if (normalized.includes("mirror silver")) {
    return "linear-gradient(135deg, #f5f7fa, #9aa4af)";
  }
  if (normalized.includes("mirror dusk")) {
    return "linear-gradient(135deg, #5b4b62, #b78aa8)";
  }
  if (normalized.includes("warm silver")) {
    return "linear-gradient(135deg, #d8d1c7, #a8a29a)";
  }
  if (normalized.includes("slate blue")) {
    return "linear-gradient(135deg, #64748b, #4f46e5)";
  }
  if (normalized.includes("dusty rose")) {
    return "linear-gradient(135deg, #d8a7b1, #b86a79)";
  }
  if (normalized.includes("taupe")) {
    return "linear-gradient(135deg, #a8a29e, #78716c)";
  }
  if (normalized.includes("e-white") || normalized === "white") {
    return "#f5f5f4";
  }
  if (normalized.includes("black")) {
    return "#171717";
  }
  if (normalized.includes("silver")) {
    return "#cbd5e1";
  }
  if (normalized.includes("grey") || normalized.includes("gray")) {
    return "#6b7280";
  }
  if (normalized.includes("blue")) {
    return "#2563eb";
  }
  if (normalized.includes("teal")) {
    return "#0f766e";
  }
  if (normalized.includes("purple")) {
    return "#7c3aed";
  }
  if (normalized.includes("orange")) {
    return "#ea580c";
  }
  if (normalized.includes("red")) {
    return "#dc2626";
  }
  if (normalized.includes("green")) {
    return "#16a34a";
  }
  if (normalized.includes("gold")) {
    return "#d4a017";
  }
  return "linear-gradient(135deg, #e5e7eb, #9ca3af)";
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, index) => index < rating);
}

function formatReviewDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

export function ProductPage() {
  const { slug = "" } = useParams();
  const { addItem } = useCart();
  const { user } = useSession();
  const { isSaved, toggleItem } = useWishlist();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<ProductSummary[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  useEffect(() => {
    Promise.all([
      catalogService.getProduct(slug),
      catalogService.listRelatedProducts(slug),
      catalogService.listProductReviews(slug),
    ])
      .then(([productData, relatedProducts, approvedReviews]) => {
        setProduct(productData);
        setRelated(relatedProducts);
        setReviews(approvedReviews);
        setQuantity(1);
        setReviewComment("");
        setReviewMessage("");
        setReviewError("");
        setReviewRating(5);
        setReviewEligibility(null);
        setSelectedImageIndex(0);
        if (productData) {
          setSelectedOptions(createInitialSelection(productData));
        }
      })
      .catch(() => setError(true));
  }, [slug]);

  useEffect(() => {
    if (!user) {
      setReviewEligibility({
        canSubmit: false,
        hasPurchased: false,
        alreadyReviewed: false,
        reason: "Sign in to review this product.",
      });
      return;
    }

    catalogService.getReviewEligibility(slug)
      .then(setReviewEligibility)
      .catch(() => {
        setReviewEligibility({
          canSubmit: false,
          hasPurchased: false,
          alreadyReviewed: false,
          reason: "Unable to confirm review eligibility right now.",
        });
      });
  }, [slug, user]);

  if (error) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><ErrorState /></div>;
  }

  if (!product) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><LoadingState label="Installing the product view…" /></div>;
  }

  const selectedPrice = calculateSelectedPrice(product, selectedOptions);
  const useContainedImage = shouldContainProductImage(product.tags);
  const galleryImages = product.gallery.length ? product.gallery : [product.image];
  const activeImage = galleryImages[Math.min(selectedImageIndex, galleryImages.length - 1)] ?? product.image;
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;
  const saved = isSaved(product.slug);

  async function handleReviewSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReviewError("");
    setReviewMessage("");

    if (!user) {
      setReviewError("Sign in to submit a review for admin approval.");
      return;
    }

    if (reviewEligibility && !reviewEligibility.canSubmit) {
      setReviewError(reviewEligibility.reason);
      return;
    }

    if (!reviewComment.trim()) {
      setReviewError("Write a short comment before submitting your review.");
      return;
    }

    setReviewSubmitting(true);
    try {
      await catalogService.submitProductReview(slug, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewComment("");
      setReviewRating(5);
      setReviewMessage("Your review was submitted and is waiting for admin approval.");
      setReviewEligibility({
        canSubmit: false,
        hasPurchased: true,
        alreadyReviewed: true,
        reason: "You have already reviewed this product.",
      });
    } catch (submissionError) {
      setReviewError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to submit your review right now.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <div className="page-fade mx-auto max-w-7xl px-6 py-16">
      <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <div className="grid gap-5 lg:grid-cols-[6rem_minmax(0,1fr)]">
            <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:max-h-[42rem] lg:flex-col lg:overflow-y-auto lg:pb-0">
              {galleryImages.map((image, index) => {
                const active = index === selectedImageIndex;
                return (
                  <button
                    key={`${image.src}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={[
                      "group shrink-0 overflow-hidden rounded-[1.15rem] border transition",
                      active
                        ? "border-[var(--color-on-surface)] shadow-[0_18px_36px_rgba(20,23,27,0.12)]"
                        : "border-[rgba(20,23,27,0.08)] opacity-70 hover:opacity-100",
                    ].join(" ")}
                    aria-label={`Show image ${index + 1}`}
                    aria-pressed={active}
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className={[
                        "h-24 w-24 bg-[var(--color-surface-low)] transition",
                        useContainedImage ? "object-contain p-2" : "object-cover group-hover:scale-[1.04]",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </div>

            <div className="order-1 space-y-5 lg:order-2">
              <div className="poster-frame relative overflow-hidden rounded-[2rem]">
                <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white">
                  <span className="rounded-full bg-black/35 px-3 py-1 backdrop-blur-sm">
                    Gallery View
                  </span>
                  <span className="rounded-full bg-black/35 px-3 py-1 backdrop-blur-sm">
                    {selectedImageIndex + 1} / {galleryImages.length}
                  </span>
                </div>
                <img
                  src={activeImage.src}
                  alt={activeImage.alt}
                  className={[
                    "aspect-[4/5] h-full w-full bg-[var(--color-surface-low)]",
                    useContainedImage ? "object-contain p-8" : "object-cover",
                  ].join(" ")}
                />
              </div>

              <div className="grid gap-5 md:grid-cols-[1.2fr_0.8fr]">
                <div className="surface-mat rounded-[1.5rem] p-6">
                  <p className="eyebrow">Material note</p>
                  <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
                    {product.story}
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-[var(--color-surface-low)] p-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Gallery Coverage
                  </p>
                  <p className="mt-3 font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
                    {galleryImages.length}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                    Every available product angle, close-up, and surface study is shown below.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{product.material}</p>
          <h1 className="mt-4 font-['Manrope'] text-5xl font-extrabold tracking-[-0.05em]">
            {product.name}
          </h1>
          <p className="mt-4 text-base leading-8 text-[var(--color-muted)]">
            {product.description}
          </p>
          <p className="mt-6 font-['Manrope'] text-2xl font-bold">
            {formatCurrency(selectedPrice)}
          </p>

          <div className="mt-8 space-y-6">
            {product.options.map((option) => (
              <div key={option.id}>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  {option.group}
                </p>
                <div className={isColorOption(option.group) ? "mt-3 flex flex-wrap gap-3" : "mt-3 grid gap-2 sm:grid-cols-2"}>
                  {option.values.map((value) => {
                    const active = selectedOptions[option.group] === value.label;
                    return (
                      <button
                        key={value.id}
                        type="button"
                        onClick={() =>
                          setSelectedOptions((current) => ({
                            ...current,
                            [option.group]: value.label,
                          }))
                        }
                        className={[
                          isColorOption(option.group)
                            ? [
                                "group flex min-w-[7.5rem] items-center gap-3 rounded-sm border px-3 py-2 text-left text-sm transition",
                                active
                                  ? "border-[var(--color-on-surface)] bg-[var(--color-on-surface)]/6 text-[var(--color-on-surface)]"
                                  : "border-[color:rgba(20,23,27,0.12)] bg-white text-[var(--color-on-surface)]",
                              ].join(" ")
                            : [
                                "rounded-sm px-4 py-3 text-left text-sm transition",
                                active
                                  ? "bg-[var(--color-on-surface)] text-white"
                                  : "surface-card ghost-border text-[var(--color-on-surface)]",
                              ].join(" "),
                        ].join(" ")}
                      >
                        {isColorOption(option.group) ? (
                          <>
                            <span
                              className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                              style={{ background: swatchBackground(value.label) }}
                              aria-hidden="true"
                            />
                            <span className="flex flex-col">
                              <span>{value.label}</span>
                              {value.priceDelta ? (
                                <span className="text-xs text-[var(--color-muted)]">
                                  +${value.priceDelta}
                                </span>
                              ) : null}
                            </span>
                          </>
                        ) : (
                          <>
                            {value.label}
                            {value.priceDelta ? ` (+$${value.priceDelta})` : ""}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Quantity
            </p>
            <div className="mt-3 flex w-fit items-center overflow-hidden rounded-sm border border-[color:rgba(20,23,27,0.12)] bg-white">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                className="px-4 py-3 text-lg text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-low)]"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(event) => {
                  const nextQuantity = Number(event.target.value);
                  setQuantity(Number.isFinite(nextQuantity) ? Math.min(99, Math.max(1, nextQuantity)) : 1);
                }}
                className="w-20 border-x border-[color:rgba(20,23,27,0.12)] px-3 py-3 text-center text-sm outline-none"
              />
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((current) => Math.min(99, current + 1))}
                className="px-4 py-3 text-lg text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-low)]"
              >
                +
              </button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={() => addItem({ product, selectedOptions, quantity })}>
              Add to archive
            </Button>
            <Button variant="secondary" onClick={() => toggleItem(product)}>
              {saved ? "Remove from wishlist" : "Save to wishlist"}
            </Button>
            <Link to="/cart">
              <Button variant="secondary">View cart</Button>
            </Link>
          </div>

          <div className="mt-10">
            <SectionHeading
              kicker="Specifications"
              title="Technical sheet"
              description={product.highlights.join(" / ")}
            />
            <div className="mt-6">
              <SpecList items={product.specs} />
            </div>
          </div>
        </aside>
      </div>

      <section className="mt-20">
        <SectionHeading
          kicker="Full Gallery"
          title="Every product image"
          description="A complete visual pass through the product gallery, including the detail angles shown in the admin-managed media set."
        />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {galleryImages.map((image, index) => (
            <button
              key={`${image.src}-panel-${index}`}
              type="button"
              onClick={() => setSelectedImageIndex(index)}
              className={[
                "group overflow-hidden rounded-[1.75rem] bg-[var(--color-card)] text-left transition",
                index % 3 === 0 ? "md:col-span-2" : "",
              ].join(" ")}
            >
              <img
                src={image.src}
                alt={image.alt}
                className={[
                  "w-full bg-[var(--color-surface-low)] transition duration-700",
                  index % 3 === 0 ? "aspect-[16/10]" : "aspect-[4/5]",
                  useContainedImage ? "object-contain p-8 group-hover:scale-[1.01]" : "object-cover group-hover:scale-[1.03]",
                ].join(" ")}
              />
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <p className="text-sm font-medium text-[var(--color-muted)]">
                  {image.alt}
                </p>
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]/70">
                  Image {index + 1}
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_0.28fr]">
          <div className="rounded-[1.75rem] bg-[var(--color-surface-low)] p-6 md:p-8">
            <SectionHeading
              kicker="Reviews"
              title="Verified impressions"
              description="Published reviews appear only after the admin team checks them for clarity and relevance."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-[0.3fr_0.7fr]">
              <div className="rounded-[1.25rem] bg-white px-5 py-6">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Average rating
                </p>
                <p className="mt-3 font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
                  {reviews.length ? averageRating.toFixed(1) : "0.0"}
                </p>
                <div className="mt-3 flex gap-1 text-lg text-[var(--color-primary)]">
                  {renderStars(Math.round(averageRating || 0)).map((filled, index) => (
                    <span key={index} aria-hidden="true" className={filled ? "" : "opacity-25"}>★</span>
                  ))}
                </div>
                <p className="mt-3 text-sm text-[var(--color-muted)]">
                  {reviews.length ? `${reviews.length} approved reviews` : "No approved reviews yet"}
                </p>
              </div>

              <div className="space-y-4">
                {reviews.length ? reviews.map((review) => (
                  <article key={review.id} className="rounded-[1.25rem] bg-white px-5 py-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                          {review.authorName}
                        </p>
                        <div className="mt-2 flex gap-1 text-sm text-[var(--color-primary)]">
                          {renderStars(review.rating).map((filled, index) => (
                            <span key={index} aria-hidden="true" className={filled ? "" : "opacity-20"}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{review.comment}</p>
                  </article>
                )) : (
                  <EmptyState
                    title="No reviews published yet"
                    body="Be the first to share an impression. New reviews go to the admin queue before they appear here."
                  />
                )}
              </div>
            </div>
          </div>

          <aside className="rounded-[1.75rem] bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Leave a review
            </p>
            <h2 className="mt-3 font-['Manrope'] text-2xl font-extrabold tracking-[-0.04em]">
              Send feedback to admin
            </h2>
            <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
              Choose a star rating and add a comment. Reviews stay hidden until an admin approves them.
            </p>
            {reviewEligibility ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">{reviewEligibility.reason}</p>
            ) : null}

            <form className="mt-6 space-y-5" onSubmit={handleReviewSubmit}>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Star rating
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 5 }, (_, index) => index + 1).map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      className={[
                        "rounded-sm px-3 py-2 text-sm font-semibold transition",
                        reviewRating === rating
                          ? "bg-[var(--color-on-surface)] text-white"
                          : "surface-card ghost-border text-[var(--color-primary)]",
                      ].join(" ")}
                      aria-label={`Rate ${rating} star${rating === 1 ? "" : "s"}`}
                      disabled={Boolean(reviewEligibility && !reviewEligibility.canSubmit)}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Comment
                </span>
                <span className="input-shell flex">
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    rows={6}
                    placeholder="How did the build quality, feel, or sound come across in use?"
                    className="min-h-32 w-full resize-y bg-transparent px-4 py-3 outline-none"
                    disabled={Boolean(reviewEligibility && !reviewEligibility.canSubmit)}
                  />
                </span>
              </label>

              {!user ? (
                <p className="text-sm text-[var(--color-muted)]">
                  <Link to="/login" className="font-semibold text-[var(--color-primary)]">Sign in</Link> to submit a review.
                </p>
              ) : null}

              {reviewError ? (
                <p className="text-sm text-[var(--color-error)]">{reviewError}</p>
              ) : null}
              {reviewMessage ? (
                <p className="text-sm text-[var(--color-muted)]">{reviewMessage}</p>
              ) : null}

              <Button type="submit" disabled={reviewSubmitting || Boolean(reviewEligibility && !reviewEligibility.canSubmit)}>
                {reviewSubmitting ? "Sending…" : "Submit for approval"}
              </Button>
            </form>
          </aside>
        </div>
      </section>

      <section className="mt-20">
        <SectionHeading
          kicker="Related"
          title="From the same collection"
          description="Additional pieces that keep the same material and acoustic vocabulary."
        />
        <div className="mt-12">
          {related.length ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="This piece stands alone."
              body="No directly related items are active in the same category right now."
            />
          )}
        </div>
      </section>
    </div>
  );
}
