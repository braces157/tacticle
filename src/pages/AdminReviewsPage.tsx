import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import {
  approveAdminProductReview,
  getAdminReviews,
  rejectAdminProductReview,
} from "../services/adminApi";
import type { ProductReview } from "../types/domain";
import { useAdminReviewNotifications } from "../context/AdminReviewNotificationsContext";

const filters = ["Pending", "Approved", "Rejected"] as const;

export function AdminReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStatus = searchParams.get("status");
  const highlightedReviewId = searchParams.get("review");
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("Pending");
  const [reviews, setReviews] = useState<ProductReview[] | null>(null);
  const [error, setError] = useState(false);
  const [moderatingReviewId, setModeratingReviewId] = useState<string | null>(null);
  const { refreshPendingReviews } = useAdminReviewNotifications();

  async function loadReviews(status: (typeof filters)[number]) {
    const nextReviews = await getAdminReviews(status);
    setReviews(nextReviews);
  }

  useEffect(() => {
    if (requestedStatus && filters.includes(requestedStatus as (typeof filters)[number])) {
      setActiveFilter(requestedStatus as (typeof filters)[number]);
    }
  }, [requestedStatus]);

  useEffect(() => {
    setReviews(null);
    setError(false);
    loadReviews(activeFilter).catch(() => setError(true));
  }, [activeFilter]);

  function handleFilterChange(filter: (typeof filters)[number]) {
    setActiveFilter(filter);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("status", filter);
    nextParams.delete("review");
    setSearchParams(nextParams, { replace: true });
  }

  async function handleReviewAction(reviewId: string, action: "approve" | "reject") {
    setModeratingReviewId(reviewId);
    try {
      if (action === "approve") {
        await approveAdminProductReview(reviewId);
      } else {
        await rejectAdminProductReview(reviewId);
      }
      await Promise.all([loadReviews(activeFilter), refreshPendingReviews()]);
    } finally {
      setModeratingReviewId(null);
    }
  }

  if (error) {
    return <ErrorState />;
  }

  if (!reviews) {
    return <LoadingState label="Loading review queue…" />;
  }

  return (
    <div className="page-fade space-y-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
            Reviews
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Moderate customer reviews before they are published to the storefront.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {filters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => handleFilterChange(filter)}
              className={[
                "rounded-lg px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] transition",
                activeFilter === filter
                  ? "bg-[var(--color-on-surface)] text-white"
                  : "bg-[var(--color-surface-low)] text-[var(--color-muted)]",
              ].join(" ")}
            >
              {filter}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Queue status</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">{activeFilter}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Reviews shown</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">{reviews.length}</p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">Average score</p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">
            {reviews.length
              ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
              : "0.0"}
          </p>
        </div>
      </section>

      {reviews.length ? (
        <section className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className={[
                "rounded-[1.5rem] bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]",
                highlightedReviewId === review.id ? "ring-2 ring-[var(--color-primary)] ring-offset-2" : "",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Product
                  </p>
                  <Link
                    to={`/admin/products/${review.productSlug}/edit`}
                    className="mt-2 block font-['Manrope'] text-2xl font-bold tracking-[-0.03em] text-[var(--color-on-surface)] transition hover:text-[var(--color-primary)]"
                  >
                    {review.productName}
                  </Link>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    {review.authorName} · {review.createdAt}
                  </p>
                </div>
                <div className="rounded-lg bg-[var(--color-surface-low)] px-4 py-3 text-sm font-semibold text-[var(--color-primary)]">
                  {review.rating}/5
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-[var(--color-muted)]">{review.comment}</p>

              {review.adminNote ? (
                <p className="mt-4 rounded-xl bg-[var(--color-surface-low)] px-4 py-3 text-sm text-[var(--color-muted)]">
                  Admin note: {review.adminNote}
                </p>
              ) : null}

              {activeFilter === "Pending" ? (
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
                    className="button-base text-[var(--color-muted)] no-underline hover:underline disabled:no-underline"
                  >
                    Reject
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <EmptyState
          title={`No ${activeFilter.toLowerCase()} reviews`}
          body="Switch review status filters or wait for new customer reviews to arrive."
        />
      )}
    </div>
  );
}
