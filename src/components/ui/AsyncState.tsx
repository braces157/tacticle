import { Link } from "react-router-dom";
import { Button } from "./Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="surface-mat rounded-xl px-6 py-12 text-center text-sm text-[var(--color-muted)]">
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  actionLabel,
  actionHref,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="surface-mat rounded-xl px-6 py-12 text-center">
      <h2 className="font-['Manrope'] text-2xl font-bold tracking-[-0.03em]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
        {body}
      </p>
      {actionHref && actionLabel ? (
        <Link to={actionHref} className="mt-6 inline-flex">
          <Button>{actionLabel}</Button>
        </Link>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "Something drifted out of frame.",
  body = "Refresh the page or choose another route to keep exploring.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <div className="surface-mat rounded-xl px-6 py-12 text-center">
      <h2 className="font-['Manrope'] text-2xl font-bold tracking-[-0.03em]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
        {body}
      </p>
    </div>
  );
}
