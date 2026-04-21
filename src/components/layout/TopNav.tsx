import { startTransition, useState, type FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useSession } from "../../context/SessionContext";
import { useWishlist } from "../../context/WishlistContext";
import { Button, buttonClassName } from "../ui/Button";
import { Icon } from "../ui/Icon";

const navItems = [
  { to: "/browse", label: "Gallery" },
  { to: "/category/keyboards", label: "Keyboards" },
  { to: "/category/accessories", label: "Accessories" },
  { to: "/category/custom-parts", label: "Custom Parts" },
  { to: "/wishlist", label: "Wishlist" },
  { to: "/orders", label: "Orders" },
];

export function TopNav() {
  const navigate = useNavigate();
  const { openDrawer, itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, logout } = useSession();
  const [query, setQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    startTransition(() => {
      navigate(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : "/browse");
    });
    setIsMenuOpen(false);
  }

  const navDisplayName = user?.name.trim().split(/\s+/)[0] ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-transparent">
      <nav className="glass-nav">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <Link to="/" className="font-['Manrope'] text-2xl font-extrabold tracking-[-0.06em]">
            TACTILE
          </Link>

          <div className="hidden items-center gap-8 lg:flex">
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
              className="input-shell hidden items-center gap-2 px-3 lg:flex"
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
              aria-label="Open wishlist"
              onClick={() => navigate("/wishlist")}
              className="relative rounded-full p-2 text-[var(--color-primary)] transition hover:bg-[var(--color-surface-low)]"
            >
              <Icon name="heart" className="h-5 w-5" />
              {wishlistCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-on-surface)] px-1 text-[10px] text-white">
                  {wishlistCount}
                </span>
              ) : null}
            </button>
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
              <div className="hidden items-center gap-2 lg:flex">
                <Link to="/profile" className={buttonClassName("secondary")}>
                  <Icon name="user" className="h-4 w-4" />
                  {navDisplayName}
                </Link>
                <Button variant="tertiary" onClick={() => void logout()}>
                  Log out
                </Button>
              </div>
            ) : (
              <Link to="/login" className="hidden lg:flex">
                <Button variant="secondary">Account</Button>
              </Link>
            )}
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden relative rounded-full p-2 text-[var(--color-primary)] transition hover:bg-[var(--color-surface-low)]"
            >
              <Icon name={isMenuOpen ? "close" : "menu"} className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden border-t border-[var(--color-outline)] bg-[var(--color-surface)] px-6 py-4 shadow-lg absolute w-full max-h-[calc(100vh-80px)] overflow-y-auto">
            <form onSubmit={handleSearch} className="input-shell flex items-center gap-2 px-3 mb-6" role="search">
              <Icon name="search" className="h-4 w-4 text-[var(--color-muted)]" />
              <input
                aria-label="Search products"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the gallery"
                className="w-full bg-transparent py-2 outline-none"
              />
            </form>
            <div className="flex flex-col gap-4 text-sm font-medium">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) =>
                    isActive ? "text-[var(--color-on-surface)]" : "text-[var(--color-muted)]"
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
            <div className="mt-6 border-t border-[var(--color-outline)] pt-6">
              {user ? (
                <div className="flex flex-col gap-4">
                  <Link to="/profile" className="flex items-center gap-2 font-medium" onClick={() => setIsMenuOpen(false)}>
                    <Icon name="user" className="h-4 w-4" />
                    {user.name}
                  </Link>
                  <button
                    className="text-left font-medium text-[var(--color-primary)]"
                    onClick={() => {
                      void logout();
                      setIsMenuOpen(false);
                    }}
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <Link to="/login" className="font-medium" onClick={() => setIsMenuOpen(false)}>
                  Sign In / Create Account
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
