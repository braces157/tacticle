import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { AdminProductForm } from "../components/admin/AdminProductForm";
import { useAdminReviewNotifications } from "../context/AdminReviewNotificationsContext";
import {
  approveAdminProductReview,
  getAdminProductRecord,
  getAdminProductReviews,
  getDraftProductFromExisting,
  rejectAdminProductReview,
  updateAdminProduct,
} from "../services/adminApi";
import type { AdminDraftProduct, AdminProductRecord, ProductReview } from "../types/domain";

export function AdminEditProductPage() {
  const { slug = "" } = useParams();
  const { refreshPendingReviews } = useAdminReviewNotifications();
  const [product, setProduct] = useState<AdminProductRecord | null>(null);
  const [draft, setDraft] = useState<AdminDraftProduct | null>(null);
  const [pendingReviews, setPendingReviews] = useState<ProductReview[]>([]);
  const [moderatingReviewId, setModeratingReviewId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
    setLoaded(false);
    Promise.all([
      getAdminProductRecord(slug),
      getDraftProductFromExisting(slug),
      getAdminProductReviews(slug, "Pending"),
    ])
      .then(([nextProduct, nextDraft, nextPendingReviews]) => {
        setProduct(nextProduct);
        setDraft(nextDraft);
        setPendingReviews(nextPendingReviews);
        setLoaded(true);
      })
      .catch(() => setError(true));
  }, [slug]);

  async function handleReviewAction(reviewId: string, action: "approve" | "reject") {
    setModeratingReviewId(reviewId);
    try {
      if (action === "approve") {
        await approveAdminProductReview(reviewId);
      } else {
        await rejectAdminProductReview(reviewId);
      }
      setPendingReviews((current) => current.filter((review) => review.id !== reviewId));
      await refreshPendingReviews();
    } finally {
      setModeratingReviewId(null);
    }
  }

  if (error) {
    return <ErrorState />;
  }

  if (!loaded) {
    return <LoadingState label="Loading product editor…" />;
  }

  if (!product || !draft) {
    return (
      <EmptyState
        title="Product not found"
        body="This edit route does not match an available product in the SQL catalog."
        actionLabel="Return to inventory"
        actionHref="/admin/inventory"
      />
    );
  }

  return (
    <div className="page-fade space-y-8">
      <nav className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
        <Link to="/admin/inventory">Inventory</Link>
        <span>/</span>
        <span className="text-[var(--color-primary)]">Edit Product</span>
      </nav>

      <header>
        <h1 className="font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
          Edit Product: {product.name}
        </h1>
        <p className="mt-2 text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
          Product ID: {product.id}
        </p>
      </header>

      <AdminProductForm
        mode="edit"
        initialValues={draft}
        previewProduct={product}
        onSubmit={async (values) => {
          const updated = await updateAdminProduct(slug, values);
          if (!updated) {
            throw new Error("Unable to save product changes.");
          }
          setProduct(updated);
          setDraft({
            name: updated.name,
            category: updated.categorySlug === "custom-parts" ? "Custom Parts" : updated.categorySlug === "accessories" ? "Accessories" : "Keyboards",
            sku: updated.sku,
            price: updated.price.toFixed(2),
            stock: String(updated.stock),
            description: updated.description,
            metadata: updated.specs.map((spec) => `${spec.label}: ${spec.value}`).join("\n"),
            status: updated.visibility,
            images: updated.gallery.map((image, index) => ({
              id: `image-${index + 1}`,
              src: image.src,
              alt: image.alt,
            })),
            options: updated.options.map((option) => ({
              id: option.id,
              group: option.group,
              values: option.values.map((value) => ({
                id: value.id,
                label: value.label,
                priceDelta: value.priceDelta ? String(value.priceDelta) : "",
              })),
            })),
          });
          return "Product updates saved to the backend.";
        }}
      />

      <section className="rounded-[1.5rem] bg-[var(--color-surface-low)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Review Moderation
            </p>
            <h2 className="mt-3 font-['Manrope'] text-2xl font-extrabold tracking-[-0.04em]">
              Pending customer reviews
            </h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-muted)]">
              Reviews from the storefront stay hidden until an admin approves them.
            </p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">Awaiting review</p>
            <p className="mt-2 font-['Manrope'] text-2xl font-bold">{pendingReviews.length}</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {pendingReviews.length ? pendingReviews.map((review) => (
            <article key={review.id} className="rounded-[1.25rem] bg-white px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-on-surface)]">{review.authorName}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                    Submitted {review.createdAt}
                  </p>
                </div>
                <div className="flex gap-1 text-base text-[var(--color-primary)]" aria-label={`${review.rating} stars`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <span key={index} aria-hidden="true" className={index < review.rating ? "" : "opacity-20"}>★</span>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">{review.comment}</p>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleReviewAction(review.id, "approve")}
                  disabled={moderatingReviewId === review.id}
                  className="button-base button-primary"
                >
                  {moderatingReviewId === review.id ? "Saving…" : "Approve"}
                </button>
                <button
                  type="button"
                  onClick={() => handleReviewAction(review.id, "reject")}
                  disabled={moderatingReviewId === review.id}
                  className="button-base button-tertiary"
                >
                  Reject
                </button>
              </div>
            </article>
          )) : (
            <EmptyState
              title="No pending reviews"
              body="New storefront reviews will appear here before they become public."
            />
          )}
        </div>
      </section>
    </div>
  );
}
