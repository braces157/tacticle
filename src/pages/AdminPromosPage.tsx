import { useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import {
  createAdminPromoCode,
  getAdminPromoCodes,
  updateAdminPromoCode,
} from "../services/adminApi";
import type { AdminPromoCode, AdminPromoDraft, PromoDiscountType } from "../types/domain";

const emptyDraft: AdminPromoDraft = {
  code: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "10",
  minimumSubtotal: "0",
  usageLimit: "",
  active: true,
  startsAt: "",
  endsAt: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function toDateInput(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (input: number) => input.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function normalizeDateTime(value: string) {
  if (!value) return "";
  return value.length === 16 ? `${value}:00` : value;
}

function formatPromoDateTime(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function draftFromPromo(promo: AdminPromoCode): AdminPromoDraft {
  return {
    code: promo.code,
    description: promo.description,
    discountType: promo.discountType,
    discountValue: promo.discountValue.toFixed(2).replace(/\.00$/, ""),
    minimumSubtotal: promo.minimumSubtotal.toFixed(2).replace(/\.00$/, ""),
    usageLimit: promo.usageLimit === null ? "" : String(promo.usageLimit),
    active: promo.active,
    startsAt: toDateInput(promo.startsAt),
    endsAt: toDateInput(promo.endsAt),
  };
}

function normalizeDraft(draft: AdminPromoDraft): AdminPromoDraft {
  return {
    ...draft,
    code: draft.code.trim().toUpperCase(),
    description: draft.description.trim(),
    discountValue: draft.discountValue.trim(),
    minimumSubtotal: draft.minimumSubtotal.trim(),
    usageLimit: draft.usageLimit.trim(),
    startsAt: normalizeDateTime(draft.startsAt.trim()),
    endsAt: normalizeDateTime(draft.endsAt.trim()),
  };
}

type PromoActiveSwitchProps = {
  checked: boolean;
  onChange(nextValue: boolean): void;
  disabled?: boolean;
  label: string;
};

function PromoActiveSwitch({ checked, onChange, disabled = false, label }: PromoActiveSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-200",
        checked
          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/20"
          : "border-[rgba(35,40,41,0.18)] bg-[var(--color-surface-low)]",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
      ].join(" ")}
    >
      <span className="sr-only">{label}</span>
      <span
        className={[
          "absolute left-1 h-5 w-5 rounded-full bg-white shadow-[0_6px_16px_rgba(15,20,21,0.18)] transition-transform duration-200",
          checked ? "translate-x-5 bg-[var(--color-primary)]" : "",
        ].join(" ")}
      />
    </button>
  );
}

export function AdminPromosPage() {
  const [promos, setPromos] = useState<AdminPromoCode[] | null>(null);
  const [createDraft, setCreateDraft] = useState<AdminPromoDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AdminPromoDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminPromoCodes()
      .then((data) => {
        setPromos(data);
        setError(null);
      })
      .catch(() => setError("Unable to load promo codes."));
  }, []);

  const sortedPromos = useMemo(() => promos ?? [], [promos]);

  async function refresh() {
    const data = await getAdminPromoCodes();
    setPromos(data);
  }

  async function handleCreate() {
    setSaving(true);
    setError(null);
    try {
      await createAdminPromoCode(normalizeDraft(createDraft));
      setCreateDraft(emptyDraft);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create promo.");
    } finally {
      setSaving(false);
    }
  }

  function startEditing(promo: AdminPromoCode) {
    setEditingId(promo.id);
    setEditDraft(draftFromPromo(promo));
  }

  function cancelEditing() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function handleUpdate() {
    if (!editingId || !editDraft) return;
    setSaving(true);
    setError(null);
    try {
      await updateAdminPromoCode(editingId, normalizeDraft(editDraft));
      await refresh();
      cancelEditing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update promo.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !promos) {
    return <ErrorState />;
  }

  if (!promos) {
    return <LoadingState label="Loading promo codes…" />;
  }

  return (
    <div className="page-fade space-y-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
            Promo Codes
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Create time-boxed promotions and track redemptions across orders.
          </p>
        </div>
      </section>

      <section className="rounded-[1.25rem] bg-[var(--color-surface-low)] p-6">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr_0.7fr_0.7fr_0.6fr_0.6fr]">
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Code
            </span>
            <span className="input-shell flex">
              <input
                value={createDraft.code}
                onChange={(event) => setCreateDraft((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="WELCOME10"
                className="w-full bg-transparent px-4 py-3 uppercase outline-none"
              />
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Description
            </span>
            <span className="input-shell flex">
              <input
                value={createDraft.description}
                onChange={(event) =>
                  setCreateDraft((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="10% off first atelier order"
                className="w-full bg-transparent px-4 py-3 outline-none"
              />
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Type
            </span>
            <span className="input-shell flex">
              <select
                value={createDraft.discountType}
                onChange={(event) =>
                  setCreateDraft((prev) => ({
                    ...prev,
                    discountType: event.target.value as PromoDiscountType,
                  }))
                }
                className="w-full bg-transparent px-4 py-3 outline-none"
              >
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed</option>
              </select>
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Discount
            </span>
            <span className="input-shell flex">
              <input
                value={createDraft.discountValue}
                onChange={(event) =>
                  setCreateDraft((prev) => ({ ...prev, discountValue: event.target.value }))
                }
                placeholder="10"
                className="w-full bg-transparent px-4 py-3 outline-none"
              />
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Min. Subtotal
            </span>
            <span className="input-shell flex">
              <input
                value={createDraft.minimumSubtotal}
                onChange={(event) =>
                  setCreateDraft((prev) => ({ ...prev, minimumSubtotal: event.target.value }))
                }
                placeholder="150"
                className="w-full bg-transparent px-4 py-3 outline-none"
              />
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Usage Limit
            </span>
            <span className="input-shell flex">
              <input
                value={createDraft.usageLimit}
                onChange={(event) =>
                  setCreateDraft((prev) => ({ ...prev, usageLimit: event.target.value }))
                }
                placeholder="Optional"
                className="w-full bg-transparent px-4 py-3 outline-none"
              />
            </span>
          </label>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[0.7fr_0.7fr_0.4fr_auto]">
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Starts At
            </span>
            <span className="input-shell flex">
              <input
                type="datetime-local"
                value={createDraft.startsAt}
                onChange={(event) =>
                  setCreateDraft((prev) => ({ ...prev, startsAt: event.target.value }))
                }
                className="w-full bg-transparent px-4 py-3 outline-none"
              />
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Ends At
            </span>
            <span className="input-shell flex">
              <input
                type="datetime-local"
                value={createDraft.endsAt}
                onChange={(event) =>
                  setCreateDraft((prev) => ({ ...prev, endsAt: event.target.value }))
                }
                className="w-full bg-transparent px-4 py-3 outline-none"
              />
            </span>
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Active
            </span>
            <span className="input-shell flex items-center justify-between gap-4 px-4 py-3">
              <span className="text-xs font-semibold text-[var(--color-muted)]">
                {createDraft.active ? "Enabled" : "Disabled"}
              </span>
              <PromoActiveSwitch
                checked={createDraft.active}
                onChange={(active) => setCreateDraft((prev) => ({ ...prev, active }))}
                label="Set new promo active status"
              />
            </span>
          </label>
          <div className="flex items-end justify-end">
            <Button onClick={handleCreate} disabled={saving}>
              <Icon name="plus" className="h-4 w-4" />
              Create Promo
            </Button>
          </div>
        </div>
        {error ? (
          <p className="mt-4 text-sm text-[var(--color-error)]">{error}</p>
        ) : null}
      </section>

      {sortedPromos.length ? (
        <section className="overflow-hidden rounded-xl bg-white shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-[var(--color-surface-low)]">
                  {[
                    "Code",
                    "Type",
                    "Discount",
                    "Min",
                    "Usage",
                    "Active",
                    "Window",
                    "Actions",
                  ].map((label) => (
                    <th
                      key={label}
                      className={[
                        "px-4 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]",
                        label === "Code" ? "w-[20%]" : "",
                        label === "Type" ? "w-[10%]" : "",
                        label === "Discount" ? "w-[12%]" : "",
                        label === "Min" ? "w-[10%]" : "",
                        label === "Usage" ? "w-[10%]" : "",
                        label === "Active" ? "w-[10%] text-center" : "",
                        label === "Window" ? "w-[16%]" : "",
                        label === "Actions" ? "w-[12%] text-right" : "",
                      ].join(" ")}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedPromos.map((promo) => {
                  const isEditing = editingId === promo.id && editDraft !== null;
                  const draft = editDraft ?? emptyDraft;
                  const discountLabel =
                    promo.discountType === "PERCENTAGE"
                      ? `${promo.discountValue}%`
                      : formatCurrency(promo.discountValue);
                  const usageLabel =
                    promo.usageLimit === null ? `${promo.usageCount}` : `${promo.usageCount}/${promo.usageLimit}`;
                  const startsAtLabel = formatPromoDateTime(promo.startsAt);
                  const endsAtLabel = formatPromoDateTime(promo.endsAt);

                  return (
                    <tr key={promo.id} className="border-t border-[rgba(173,179,180,0.12)]">
                      <td className="px-4 py-4">
                        {isEditing ? (
                          <div className="grid gap-2">
                            <span className="input-shell flex">
                              <input
                                value={draft.code}
                                onChange={(event) =>
                                  setEditDraft((prev) => prev && ({ ...prev, code: event.target.value }))
                                }
                                className="w-full bg-transparent px-4 py-2 uppercase outline-none"
                              />
                            </span>
                            <span className="input-shell flex">
                              <input
                                value={draft.description}
                                onChange={(event) =>
                                  setEditDraft((prev) => prev && ({ ...prev, description: event.target.value }))
                                }
                                className="w-full bg-transparent px-4 py-2 outline-none"
                              />
                            </span>
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-semibold">{promo.code}</p>
                            <p className="mt-1 text-xs text-[var(--color-muted)]">{promo.description}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold">
                        {isEditing ? (
                          <span className="input-shell flex">
                            <select
                              value={draft.discountType}
                              onChange={(event) =>
                                setEditDraft(
                                  (prev) =>
                                    prev && ({
                                      ...prev,
                                      discountType: event.target.value as PromoDiscountType,
                                    }),
                                )
                              }
                              className="w-full bg-transparent px-4 py-2 outline-none"
                            >
                              <option value="PERCENTAGE">%</option>
                              <option value="FIXED">$</option>
                            </select>
                          </span>
                        ) : (
                          promo.discountType
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold">
                        {isEditing ? (
                          <span className="input-shell flex">
                            <input
                              value={draft.discountValue}
                              onChange={(event) =>
                                setEditDraft((prev) => prev && ({ ...prev, discountValue: event.target.value }))
                              }
                              className="w-full bg-transparent px-4 py-2 outline-none"
                            />
                          </span>
                        ) : (
                          discountLabel
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold">
                        {isEditing ? (
                          <span className="input-shell flex">
                            <input
                              value={draft.minimumSubtotal}
                              onChange={(event) =>
                                setEditDraft((prev) => prev && ({ ...prev, minimumSubtotal: event.target.value }))
                              }
                              className="w-full bg-transparent px-4 py-2 outline-none"
                            />
                          </span>
                        ) : (
                          formatCurrency(promo.minimumSubtotal)
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-[var(--color-muted)]">
                        {isEditing ? (
                          <span className="input-shell flex">
                            <input
                              value={draft.usageLimit}
                              onChange={(event) =>
                                setEditDraft((prev) => prev && ({ ...prev, usageLimit: event.target.value }))
                              }
                              className="w-full bg-transparent px-4 py-2 outline-none"
                            />
                          </span>
                        ) : (
                          usageLabel
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs font-semibold text-center">
                        {isEditing ? (
                          <div className="flex flex-col items-center gap-2">
                            <PromoActiveSwitch
                              checked={draft.active}
                              onChange={(active) =>
                                setEditDraft((prev) => prev && ({ ...prev, active }))
                              }
                              disabled={saving}
                              label={`Set ${draft.code || "promo"} active status`}
                            />
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
                              {draft.active ? "On" : "Off"}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={[
                              "inline-flex min-w-[4.75rem] items-center justify-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
                              promo.active
                                ? "bg-[rgba(35,40,41,0.08)] text-[var(--color-on-surface)]"
                                : "bg-[rgba(173,179,180,0.16)] text-[var(--color-muted)]",
                            ].join(" ")}
                          >
                            {promo.active ? "Active" : "Paused"}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs text-[var(--color-muted)]">
                        {isEditing ? (
                          <div className="grid gap-2">
                            <input
                              type="datetime-local"
                              value={draft.startsAt}
                              onChange={(event) =>
                                setEditDraft((prev) => prev && ({ ...prev, startsAt: event.target.value }))
                              }
                              className="input-shell w-full bg-transparent px-3 py-2 outline-none"
                            />
                            <input
                              type="datetime-local"
                              value={draft.endsAt}
                              onChange={(event) =>
                                setEditDraft((prev) => prev && ({ ...prev, endsAt: event.target.value }))
                              }
                              className="input-shell w-full bg-transparent px-3 py-2 outline-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                              {startsAtLabel ? `Starts ${startsAtLabel}` : "Starts immediately"}
                            </p>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-muted)]">
                              {endsAtLabel ? `Ends ${endsAtLabel}` : "No end date"}
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right text-xs font-semibold">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleUpdate}
                              disabled={saving}
                              className="text-[var(--color-primary)]"
                            >
                              Save
                            </button>
                            <button type="button" onClick={cancelEditing} className="text-[var(--color-muted)]">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditing(promo)}
                            className="text-[var(--color-primary)]"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <EmptyState
          title="No promo codes yet"
          body="Create your first promotion to start tracking redemptions at checkout."
          actionLabel="Create promo"
          actionHref="/admin/promos"
        />
      )}
    </div>
  );
}
