import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Icon } from "../components/ui/Icon";
import {
  getAdminMetrics,
  getAdminSalesSeries,
  getLowStockAlerts,
} from "../services/adminApi";
import type { AdminDashboardMetric, LowStockAlert, SalesPoint } from "../types/domain";

function alertPriority(status: string) {
  return status === "Out of Stock" ? 0 : 1;
}

export function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetric[] | null>(null);
  const [salesSeries, setSalesSeries] = useState<SalesPoint[] | null>(null);
  const [alerts, setAlerts] = useState<LowStockAlert[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    Promise.all([
      getAdminMetrics(),
      getAdminSalesSeries(),
      getLowStockAlerts(),
    ])
      .then(([nextMetrics, nextSalesSeries, nextAlerts]) => {
        setMetrics(nextMetrics);
        setSalesSeries(nextSalesSeries);
        setAlerts(nextAlerts);
      })
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <ErrorState />;
  }

  if (!metrics || !salesSeries || !alerts) {
    return <LoadingState label="Loading dashboard metrics…" />;
  }

  const salesPeak = Math.max(...salesSeries.map((point) => point.value), 0);
  const outOfStockCount = alerts.filter((alert) => alert.status === "Out of Stock").length;
  const lowStockCount = alerts.filter((alert) => alert.status === "Low Stock").length;
  const visibleAlerts = [...alerts]
    .sort((left, right) => {
      const priorityGap = alertPriority(left.status) - alertPriority(right.status);
      if (priorityGap !== 0) {
        return priorityGap;
      }
      return left.stock - right.stock;
    })
    .slice(0, 3);

  return (
    <div className="page-fade space-y-10">
      <section>
        <h1 className="font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
          Tactile Gallery
        </h1>
        <p className="mt-2 text-sm uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Dashboard Overview &amp; Key Performance Indicators
        </p>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="rounded-lg bg-[var(--color-surface-low)] p-2 text-[var(--color-primary)]">
                <Icon
                  name={
                    metric.label === "Total Revenue"
                      ? "chart"
                      : metric.label === "Orders"
                        ? "cart"
                        : metric.label === "Active Inventory"
                          ? "inventory"
                          : "dashboard"
                  }
                  className="h-5 w-5"
                />
              </div>
              <span
                className={[
                  "text-[10px] font-bold uppercase tracking-[0.2em]",
                  metric.tone === "warning"
                    ? "text-[var(--color-error)]"
                    : "text-[var(--color-primary)]",
                ].join(" ")}
              >
                {metric.delta}
              </span>
            </div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {metric.label}
            </p>
            <p className="mt-2 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">
              {metric.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-xl bg-[var(--color-surface-low)] p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="font-['Manrope'] text-xl font-bold tracking-[-0.03em]">
                Sales Trends
              </h2>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Monthly performance visualization
              </p>
            </div>
            <div className="rounded-md bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em]">
              Last 6 Months
            </div>
          </div>
          {salesPeak > 0 ? (
            <div className="grid h-[320px] grid-cols-6 items-end gap-1 sm:gap-2 md:gap-4">
              {salesSeries.map((point, index) => {
                const barHeight = Math.max(14, Math.round((point.value / salesPeak) * 220));

                return (
                  <div key={point.month} className="flex h-full flex-col items-center justify-end gap-3">
                    <span className="text-xs font-semibold text-[var(--color-primary)]">
                      ${point.value}
                    </span>
                    <div className="flex h-[220px] w-full items-end">
                      <div
                        className={[
                          "w-full rounded-t-[1rem] shadow-[0_16px_30px_rgba(45,52,53,0.08)] transition",
                          index === salesSeries.length - 1
                            ? "bg-[var(--color-primary)]"
                            : "bg-[var(--color-primary)]/45",
                        ].join(" ")}
                        style={{ height: `${barHeight}px` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold tracking-[0.18em] text-[var(--color-muted)]">
                      {point.month}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[320px] items-center justify-center rounded-xl border border-dashed border-[var(--color-primary)]/20 bg-white/70 px-6 text-center text-sm text-[var(--color-muted)]">
              No sales recorded in the last 6 months.
            </div>
          )}
        </div>

        <div>
          <div className="rounded-xl bg-[var(--color-surface-highest)] p-8">
            <div className="mb-6 flex items-center gap-3">
              <Icon name="inventory" className="h-5 w-5 text-[var(--color-error)]" />
              <h2 className="text-sm font-bold uppercase tracking-[0.2em]">
                Inventory Attention
              </h2>
            </div>
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              {alerts.length
                ? `${alerts.length} products need stock attention across the catalog.`
                : "All active products are currently stocked."}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-white px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  Out of stock
                </p>
                <p className="mt-2 font-['Manrope'] text-3xl font-bold tracking-[-0.04em] text-[var(--color-error)]">
                  {outOfStockCount}
                </p>
              </div>
              <div className="rounded-xl bg-white px-4 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  Low stock
                </p>
                <p className="mt-2 font-['Manrope'] text-3xl font-bold tracking-[-0.04em] text-[var(--color-primary)]">
                  {lowStockCount}
                </p>
              </div>
            </div>
            {visibleAlerts.length ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                    Most constrained items
                  </p>
                  {alerts.length > visibleAlerts.length ? (
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                      Showing {visibleAlerts.length} of {alerts.length}
                    </span>
                  ) : null}
                </div>
                {visibleAlerts.map((alert) => (
                  <div
                    key={alert.name}
                    className="flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-on-surface)]">{alert.name}</p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        {alert.status}
                      </p>
                    </div>
                    <span
                      className={[
                        "inline-flex items-center whitespace-nowrap rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                        alert.status === "Out of Stock"
                          ? "bg-[rgba(159,64,61,0.12)] text-[var(--color-error)]"
                          : "bg-[var(--color-surface-low)] text-[var(--color-primary)]",
                      ].join(" ")}
                    >
                      {alert.stock} left
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-6">
              <Link
                to="/admin/inventory?stockStatus=Low%20Stock"
                className="inline-flex text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]"
              >
                Open inventory filters
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
