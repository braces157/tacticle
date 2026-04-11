import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAdminReviewNotifications } from "../../context/AdminReviewNotificationsContext";
import { Icon } from "../ui/Icon";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "dashboard" as const, end: true },
  { to: "/admin/orders", label: "Orders", icon: "cart" as const },
  { to: "/admin/reviews", label: "Reviews", icon: "reviews" as const },
  { to: "/admin/customers", label: "Customers", icon: "users" as const },
  { to: "/admin/inventory", label: "Inventory", icon: "inventory" as const },
  { to: "/admin/promos", label: "Promos", icon: "ticket" as const },
  { to: "/admin/products/new", label: "New Product", icon: "plus" as const },
];

export function AdminTopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { pendingReviews, pendingCount, loading } = useAdminReviewNotifications();
  const inventoryQuery = searchParams.get("query") ?? "";

  useEffect(() => {
    if (location.pathname.startsWith("/admin/inventory")) {
      setSearchValue(inventoryQuery);
      return;
    }

    setSearchValue("");
  }, [inventoryQuery, location.pathname]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextParams = new URLSearchParams();
    const trimmedQuery = searchValue.trim();
    if (trimmedQuery) {
      nextParams.set("query", trimmedQuery);
    }

    navigate({
      pathname: "/admin/inventory",
      search: nextParams.toString() ? `?${nextParams.toString()}` : "",
    });
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-col border-b border-[rgba(173,179,180,0.12)] bg-[rgba(249,249,249,0.82)] backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-6 px-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden rounded-full p-2 text-[var(--color-primary)] hover:bg-[var(--color-surface-low)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Icon name={mobileMenuOpen ? "close" : "menu"} className="h-5 w-5" />
          </button>
          <form
            className="input-shell hidden max-w-md items-center gap-2 px-3 lg:flex"
            role="search"
            onSubmit={handleSearchSubmit}
          >
            <Icon name="search" className="h-4 w-4 text-[var(--color-muted)]" />
            <input
              aria-label="Search admin inventory"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search inventory..."
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </form>
        </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen((current) => !current)}
            className="relative rounded-full p-2 text-[var(--color-primary)] hover:bg-[var(--color-surface-low)]"
          >
            <Icon name="bell" className="h-5 w-5" />
            {pendingCount ? (
              <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-error)]" />
            ) : null}
          </button>
          {notificationsOpen ? (
            <div className="absolute right-0 top-12 z-40 w-[22rem] rounded-[1rem] border border-[rgba(173,179,180,0.18)] bg-white p-4 shadow-[0_20px_50px_rgba(45,52,53,0.08)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Review notifications
                  </p>
                  <p className="mt-2 font-['Manrope'] text-lg font-bold">
                    {loading ? "Loading…" : `${pendingCount} pending`}
                  </p>
                </div>
                <Link
                  to="/admin/reviews"
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]"
                >
                  Open queue
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {pendingReviews.length ? pendingReviews.slice(0, 4).map((review) => (
                  <Link
                    key={review.id}
                    to={`/admin/reviews?status=Pending&review=${encodeURIComponent(review.id)}`}
                    onClick={() => setNotificationsOpen(false)}
                    className="block rounded-xl bg-[var(--color-surface-low)] px-4 py-3 transition hover:bg-[var(--color-surface-high)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-on-surface)]">{review.productName}</p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">{review.authorName}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                        {review.rating}/5
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-6 text-[var(--color-muted)]">
                      {review.comment}
                    </p>
                  </Link>
                )) : (
                  <div className="rounded-xl bg-[var(--color-surface-low)] px-4 py-6 text-sm text-[var(--color-muted)]">
                    No pending reviews right now.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Settings"
            onClick={() => setSettingsOpen((current) => !current)}
            className="rounded-full p-2 text-[var(--color-primary)] hover:bg-[var(--color-surface-low)]"
          >
            <Icon name="settings" className="h-5 w-5" />
          </button>
          {settingsOpen ? (
            <div className="absolute right-0 top-12 z-40 w-[18rem] rounded-[1rem] border border-[rgba(173,179,180,0.18)] bg-white p-4 shadow-[0_20px_50px_rgba(45,52,53,0.08)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Workspace shortcuts
              </p>
              <div className="mt-4 space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center justify-between rounded-xl bg-[var(--color-surface-low)] px-4 py-3 text-sm font-semibold text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-high)]"
                >
                  <span>Account settings</span>
                  <Icon name="users" className="h-4 w-4 text-[var(--color-muted)]" />
                </Link>
                <Link
                  to="/change-password"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center justify-between rounded-xl bg-[var(--color-surface-low)] px-4 py-3 text-sm font-semibold text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-high)]"
                >
                  <span>Change password</span>
                  <Icon name="settings" className="h-4 w-4 text-[var(--color-muted)]" />
                </Link>
                <Link
                  to="/admin/products/new"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center justify-between rounded-xl bg-[var(--color-surface-low)] px-4 py-3 text-sm font-semibold text-[var(--color-on-surface)] transition hover:bg-[var(--color-surface-high)]"
                >
                  <span>Create product</span>
                  <Icon name="plus" className="h-4 w-4 text-[var(--color-muted)]" />
                </Link>
              </div>
            </div>
          ) : null}
        </div>
        <Link
          to="/"
          className="hidden rounded-sm border border-[var(--color-outline)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)] transition hover:bg-[var(--color-surface-low)] lg:inline-flex"
        >
          View Store
        </Link>
      </div>
      </div>
      {mobileMenuOpen ? (
        <div className="lg:hidden border-t border-[var(--color-outline)] px-6 py-4">
          <form
            className="input-shell flex w-full items-center gap-2 px-3 mb-6"
            role="search"
            onSubmit={(e) => {
              handleSearchSubmit(e);
              setMobileMenuOpen(false);
            }}
          >
            <Icon name="search" className="h-4 w-4 text-[var(--color-muted)]" />
            <input
              aria-label="Search admin inventory"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder="Search inventory..."
              className="w-full bg-transparent py-2 text-sm outline-none"
            />
          </form>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[var(--color-surface-low)] text-[var(--color-on-surface)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-surface-low)] hover:text-[var(--color-on-surface)]",
                  ].join(" ")
                }
              >
                <Icon name={item.icon} className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
