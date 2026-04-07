import { useEffect, useMemo, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../components/ui/AsyncState";
import { Button } from "../components/ui/Button";
import { InputField } from "../components/ui/InputField";
import {
  getAdminCustomerProfile,
  getAdminCustomers,
  updateAdminCustomerStatus,
  updateAdminCustomerProfile,
} from "../services/adminApi";
import type {
  AdminCustomerRecord,
  UserProfile,
  UserProfileDraft,
} from "../types/domain";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatAdminDate(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}

function toDraft(profile: UserProfile): UserProfileDraft {
  return {
    name: profile.name,
    email: profile.email,
    location: profile.location,
    phone: profile.phone,
    membership: profile.membership,
    preferences: [...profile.preferences],
    shippingAddress: { ...profile.shippingAddress },
    billingAddress: { ...profile.billingAddress },
  };
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerRecord[] | null>(null);
  const [error, setError] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<UserProfileDraft | null>(null);
  const [statusDraft, setStatusDraft] = useState<AdminCustomerRecord["status"]>("Active");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdminCustomers()
      .then((nextCustomers) => {
        setCustomers(nextCustomers);
        setSelectedCustomerId((current) => {
          if (current && nextCustomers.some((customer) => customer.id === current)) {
            return current;
          }

          return nextCustomers[0]?.id ?? null;
        });
      })
      .catch(() => setError(true));
  }, []);

  const selectedCustomer = useMemo(
    () => customers?.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );

  useEffect(() => {
    const accountId = selectedCustomer?.accountId;
    setProfile(null);
    setDraft(null);
    setStatusDraft(selectedCustomer?.status ?? "Active");
    setProfileError("");
    setFormError("");
    setSuccessMessage("");

    if (!accountId) {
      setProfileLoaded(true);
      return;
    }

    setProfileLoaded(false);
    getAdminCustomerProfile(accountId)
      .then((nextProfile) => {
        if (!nextProfile) {
          setProfileError("This customer account is no longer available.");
          return;
        }

        setProfile(nextProfile);
        setDraft(toDraft(nextProfile));
      })
      .catch(() => setProfileError("Unable to load this customer profile right now."))
      .finally(() => setProfileLoaded(true));
  }, [selectedCustomer?.accountId]);

  if (error) {
    return <ErrorState />;
  }

  if (!customers) {
    return <LoadingState label="Loading customers…" />;
  }

  const activeCount = customers.filter((customer) => customer.status === "Active").length;
  const totalSpend = customers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const inactiveCount = customers.filter((customer) => customer.status === "Inactive").length;

  function updateDraft<K extends keyof UserProfileDraft>(key: K, value: UserProfileDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateAddress(
    addressType: "shippingAddress" | "billingAddress",
    key: keyof UserProfileDraft["shippingAddress"],
    value: string,
  ) {
    setDraft((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        [addressType]: {
          ...current[addressType],
          [key]: value,
        },
      };
    });
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCustomer?.accountId || !draft) {
      return;
    }

    setFormError("");
    setSuccessMessage("");

    const cleanedPreferences = draft.preferences
      .map((preference) => preference.trim())
      .filter(Boolean);

    if (!cleanedPreferences.length) {
      setFormError("Add at least one preference before saving.");
      return;
    }

    const requiredValues = [
      draft.name,
      draft.email,
      draft.location,
      draft.membership,
      draft.shippingAddress.line1,
      draft.shippingAddress.city,
      draft.shippingAddress.postalCode,
      draft.shippingAddress.country,
      draft.billingAddress.line1,
      draft.billingAddress.city,
      draft.billingAddress.postalCode,
      draft.billingAddress.country,
    ];

    if (requiredValues.some((value) => !value.trim())) {
      setFormError("Complete all customer and address fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const nextProfile = await updateAdminCustomerProfile(selectedCustomer.accountId, {
        ...draft,
        preferences: cleanedPreferences,
      });
      await updateAdminCustomerStatus(selectedCustomer.id, statusDraft);
      setProfile(nextProfile);
      setDraft(toDraft(nextProfile));
      setSuccessMessage("Customer profile updated.");

      const refreshedCustomers = await getAdminCustomers();
      setCustomers(refreshedCustomers);
      setSelectedCustomerId((current) => {
        if (current && refreshedCustomers.some((customer) => customer.id === current)) {
          return current;
        }

        return refreshedCustomers.find((customer) => customer.accountId === selectedCustomer.accountId)?.id
          ?? refreshedCustomers[0]?.id
          ?? null;
      });
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to save this customer profile right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-fade space-y-8">
      <section className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-['Manrope'] text-4xl font-extrabold tracking-[-0.05em]">
            Customers
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Monitor customer relationships and update linked account details without
            leaving the admin workspace.
          </p>
        </div>
        <div className="rounded-[1.25rem] bg-[var(--color-surface-low)] px-5 py-4 text-sm text-[var(--color-muted)]">
          Select a customer row to open their workspace. Guest checkouts remain read-only.
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Active customers
          </p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Revenue tracked
          </p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">
            {formatCurrency(totalSpend)}
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Inactive accounts
          </p>
          <p className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">
            {inactiveCount}
          </p>
        </div>
      </section>

      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="overflow-hidden rounded-xl bg-white shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="bg-[var(--color-surface-low)]">
                  {["Customer", "Orders", "Total Spend", "Last Order", "Status"].map((label) => (
                    <th
                      key={label}
                      className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const selected = customer.id === selectedCustomerId;
                  return (
                    <tr
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={[
                        "cursor-pointer border-t border-[rgba(173,179,180,0.12)] transition",
                        selected
                          ? "bg-[var(--color-surface-low)]/45"
                          : "hover:bg-[var(--color-surface-low)]/25",
                      ].join(" ")}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold">{customer.name}</p>
                        <p className="text-xs text-[var(--color-muted)]">{customer.email}</p>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold">{customer.orderCount}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs font-semibold">
                        {formatCurrency(customer.totalSpend)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs">{formatAdminDate(customer.lastOrderAt)}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={[
                            "inline-flex rounded px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em]",
                            customer.status === "Active"
                              ? "bg-[var(--color-surface-high)] text-[var(--color-muted)]"
                              : "bg-[rgba(159,64,61,0.12)] text-[var(--color-error)]",
                          ].join(" ")}
                        >
                          {customer.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6 2xl:sticky 2xl:top-24 self-start">
          <div className="rounded-[1.5rem] bg-[var(--color-surface-low)] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Customer workspace
            </p>
            {selectedCustomer ? (
              <>
                <h2 className="mt-3 font-['Manrope'] text-3xl font-bold tracking-[-0.04em]">
                  {selectedCustomer.name}
                </h2>
                <p className="mt-2 text-sm text-[var(--color-muted)]">{selectedCustomer.email}</p>
                <div className="mt-5 grid gap-3 text-sm text-[var(--color-muted)] sm:grid-cols-2">
                  <div className="rounded-xl bg-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Orders</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--color-on-surface)]">
                      {selectedCustomer.orderCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Status</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--color-on-surface)]">
                      {selectedCustomer.status}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em]">Tracked Spend</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--color-on-surface)]">
                      {formatCurrency(selectedCustomer.totalSpend)}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Select a customer to inspect or edit their linked account.
              </p>
            )}
          </div>

          {!selectedCustomer ? (
            <EmptyState
              title="No customer selected"
              body="Choose a customer from the table to review their account details."
            />
          ) : !selectedCustomer.accountId ? (
            <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Guest checkout
              </p>
              <h3 className="mt-3 font-['Manrope'] text-2xl font-bold tracking-[-0.04em]">
                No linked account to edit
              </h3>
              <p className="mt-3 text-sm leading-7 text-[var(--color-muted)]">
                This customer record came from order snapshots only. Create or link an
                account first if you want editable profile data here.
              </p>
            </div>
          ) : !profileLoaded ? (
            <LoadingState label="Loading customer profile…" />
          ) : profileError ? (
            <ErrorState title="Profile unavailable" body={profileError} />
          ) : !draft || !profile ? (
            <ErrorState title="Profile unavailable" body="We couldn't open an editable profile for this customer." />
          ) : (
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Account details
                    </p>
                    <h3 className="mt-3 font-['Manrope'] text-2xl font-bold tracking-[-0.04em]">
                      Edit linked profile
                    </h3>
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save customer"}
                  </Button>
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <InputField
                    label="Name"
                    value={draft.name}
                    onChange={(event) => updateDraft("name", event.target.value)}
                  />
                  <InputField
                    label="Email"
                    type="email"
                    value={draft.email}
                    onChange={(event) => updateDraft("email", event.target.value)}
                  />
                  <InputField
                    label="Location"
                    value={draft.location}
                    onChange={(event) => updateDraft("location", event.target.value)}
                  />
                  <InputField
                    label="Phone"
                    value={draft.phone}
                    onChange={(event) => updateDraft("phone", event.target.value)}
                  />
                  <InputField
                    label="Membership"
                    value={draft.membership}
                    onChange={(event) => updateDraft("membership", event.target.value)}
                  />
                  <label className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                      Account status
                    </span>
                    <span className="input-shell flex">
                      <select
                        value={statusDraft}
                        onChange={(event) =>
                          setStatusDraft(event.target.value as AdminCustomerRecord["status"])
                        }
                        className="w-full bg-transparent px-4 py-3 outline-none"
                        aria-label="Account status"
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </span>
                  </label>
                  <InputField
                    as="textarea"
                    label="Preferences"
                    value={draft.preferences.join(", ")}
                    onChange={(event) =>
                      updateDraft(
                        "preferences",
                        event.target.value.split(",").map((entry) => entry.trim()).filter(Boolean),
                      )
                    }
                    hint="Separate preferences with commas."
                  />
                </div>
              </div>

              <div className="grid gap-6">
                <div className="rounded-[1.5rem] bg-[var(--color-surface-low)] p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Shipping
                  </p>
                  <div className="mt-5 space-y-5">
                    <InputField
                      label="Address"
                      value={draft.shippingAddress.line1}
                      onChange={(event) => updateAddress("shippingAddress", "line1", event.target.value)}
                    />
                    <div className="grid gap-5 md:grid-cols-2">
                      <InputField
                        label="City"
                        value={draft.shippingAddress.city}
                        onChange={(event) => updateAddress("shippingAddress", "city", event.target.value)}
                      />
                      <InputField
                        label="Postal code"
                        value={draft.shippingAddress.postalCode}
                        onChange={(event) => updateAddress("shippingAddress", "postalCode", event.target.value)}
                      />
                    </div>
                    <InputField
                      label="Country"
                      value={draft.shippingAddress.country}
                      onChange={(event) => updateAddress("shippingAddress", "country", event.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-white p-6 shadow-[0_20px_50px_rgba(45,52,53,0.04)]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Billing
                  </p>
                  <div className="mt-5 space-y-5">
                    <InputField
                      label="Address"
                      value={draft.billingAddress.line1}
                      onChange={(event) => updateAddress("billingAddress", "line1", event.target.value)}
                    />
                    <div className="grid gap-5 md:grid-cols-2">
                      <InputField
                        label="City"
                        value={draft.billingAddress.city}
                        onChange={(event) => updateAddress("billingAddress", "city", event.target.value)}
                      />
                      <InputField
                        label="Postal code"
                        value={draft.billingAddress.postalCode}
                        onChange={(event) => updateAddress("billingAddress", "postalCode", event.target.value)}
                      />
                    </div>
                    <InputField
                      label="Country"
                      value={draft.billingAddress.country}
                      onChange={(event) => updateAddress("billingAddress", "country", event.target.value)}
                    />
                  </div>
                </div>
              </div>

              {formError ? <p className="text-sm text-[var(--color-error)]">{formError}</p> : null}
              {successMessage ? <p className="text-sm text-[var(--color-muted)]">{successMessage}</p> : null}
            </form>
          )}
        </aside>
      </section>
    </div>
  );
}
