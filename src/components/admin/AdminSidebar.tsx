import { NavLink } from "react-router-dom";
import { useAdminReviewNotifications } from "../../context/AdminReviewNotificationsContext";
import { useSession } from "../../context/SessionContext";
import { Icon } from "../ui/Icon";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: "dashboard" as const, end: true },
  { to: "/admin/orders", label: "Orders", icon: "cart" as const },
  { to: "/admin/reviews", label: "Reviews", icon: "reviews" as const },
  { to: "/admin/customers", label: "Customers", icon: "users" as const },
  { to: "/admin/inventory", label: "Inventory", icon: "inventory" as const },
  { to: "/admin/products/new", label: "New Product", icon: "plus" as const },
];

export function AdminSidebar() {
  const { user } = useSession();
  const { pendingCount } = useAdminReviewNotifications();
  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AU";

  return (
    <aside className="hidden w-64 shrink-0 flex-col bg-[var(--color-surface)] px-4 py-8 md:flex">
      <div className="mb-10 px-4">
        <h1 className="font-['Manrope'] text-lg font-bold tracking-[-0.05em] text-[var(--color-on-surface)]">
          Tactile Admin
        </h1>
        <p className="mt-1 text-xs text-[var(--color-muted)]">Management Suite</p>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-r-2 border-[var(--color-primary)] bg-[var(--color-surface-low)] text-[var(--color-on-surface)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-low)] hover:text-[var(--color-on-surface)]",
              ].join(" ")
            }
          >
            <Icon name={item.icon} className="h-5 w-5" />
            <span>{item.label}</span>
            {item.to === "/admin/reviews" && pendingCount ? (
              <span className="ml-auto rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex items-center gap-3 rounded-lg bg-[var(--color-surface-low)] px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-highest)] text-xs font-bold">
          {initials}
        </div>
        <div>
          <p className="text-xs font-semibold text-[var(--color-on-surface)]">
            {user?.name ?? "Admin User"}
          </p>
          <p className="text-[10px] text-[var(--color-muted)]">System Manager</p>
        </div>
      </div>
    </aside>
  );
}
