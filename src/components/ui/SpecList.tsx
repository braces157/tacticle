import type { SpecItem } from "../../types/domain";

export function SpecList({ items }: { items: SpecItem[] }) {
  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <div
          key={item.label}
          className={[
            "grid gap-2 rounded-md px-4 py-4 md:grid-cols-[1fr_auto]",
            index % 2 === 0 ? "surface-mat" : "surface-card",
          ].join(" ")}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            {item.label}
          </span>
          <span className="text-sm text-[var(--color-on-surface)]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
