import { startTransition, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useSession } from "../../context/SessionContext";
import { Button, buttonClassName } from "../ui/Button";
import { Icon } from "../ui/Icon";

const navItems = [
  { to: "/browse", label: "Gallery" },
  { to: "/category/keyboards", label: "Keyboards" },
  { to: "/category/accessories", label: "Accessories" },
  { to: "/category/custom-parts", label: "Custom Parts" },
  { to: "/orders", label: "Orders" },
];

export function TopNav() {
  const navigate = useNavigate();
  const { openDrawer, itemCount } = useCart();
  const { user, logout } = useSession();
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    startTransition(() => {
      navigate(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/browse");
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-transparent">
      <nav className="glass-nav">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link to="/" className="font-['Manrope'] text-2xl font-extrabold tracking-[-0.06em]">
            TACTILE
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  [
                    "text-sm font-medium transition-colors",
                    isActive ? "text-[var(--color-on-surface)]" : "text-[var(--color-muted)]",
                  ].join(" ")
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <form
              onSubmit={handleSearch}
              className="input-shell hidden items-center gap-2 px-3 md:flex"
              role="search"
            >
              <Icon name="search" className="h-4 w-4 text-[var(--color-muted)]" />
              <input
                aria-label="Search products"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the gallery"
                className="w-40 bg-transparent py-2 outline-none"
              />
            </form>
            <button
              type="button"
              aria-label="Open cart"
              onClick={openDrawer}
              className="relative rounded-full p-2 text-[var(--color-primary)] transition hover:bg-[var(--color-surface-low)]"
            >
              <Icon name="cart" className="h-5 w-5" />
              {itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-on-surface)] px-1 text-[10px] text-white">
                  {itemCount}
                </span>
              ) : null}
            </button>
            {user ? (
              <div className="hidden items-center gap-2 md:flex">
                <Link to="/profile" className={buttonClassName("secondary")}>
                  <Icon name="user" className="h-4 w-4" />
                  {user.name}
                </Link>
                <Button variant="tertiary" onClick={() => void logout()}>
                  Log out
                </Button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:flex">
                <Button variant="secondary">Account</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
