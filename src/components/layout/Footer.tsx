import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-24 bg-[var(--color-surface-low)]">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-3">
        <div>
          <p className="eyebrow mb-4">Tactile Gallery</p>
          <h2 className="font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
            Objects for the work you return to every day.
          </h2>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Browse
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-[var(--color-muted)]">
            <Link to="/category/keyboards">Keyboards</Link>
            <Link to="/category/accessories">Accessories</Link>
            <Link to="/category/custom-parts">Custom Parts</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Account
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-[var(--color-muted)]">
            <Link to="/profile">Profile</Link>
            <Link to="/orders">Orders</Link>
            <Link to="/change-password">Change password</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
