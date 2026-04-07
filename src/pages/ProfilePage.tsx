import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorState, LoadingState } from "../components/ui/AsyncState";
import { InputField } from "../components/ui/InputField";
import { SectionHeading } from "../components/ui/SectionHeading";
import { useSession } from "../context/SessionContext";
import { profileService } from "../services/storefrontApi";
import type { UserProfile, UserProfileDraft } from "../types/domain";

function toDraft(profile: UserProfile): UserProfileDraft {
  return {
    name: profile.name,
    email: profile.email,
    location: profile.location,
    phone: profile.phone,
    membership: profile.membership,
    preferences: profile.preferences,
    shippingAddress: { ...profile.shippingAddress },
    billingAddress: { ...profile.billingAddress },
  };
}

export function ProfilePage() {
  const { user, syncUser } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draft, setDraft] = useState<UserProfileDraft | null>(null);
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!user) {
      return;
    }

    setError(false);
    setLoaded(false);

    profileService
      .getProfile(user.id)
      .then((nextProfile) => {
        setProfile(nextProfile);
        setDraft(nextProfile ? toDraft(nextProfile) : null);
      })
      .catch(() => setError(true))
      .finally(() => setLoaded(true));
  }, [user]);

  if (error) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><ErrorState /></div>;
  }

  if (!loaded && !profile) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><LoadingState label="Loading your profile…" /></div>;
  }

  if (!profile || !draft || !user) {
    return <div className="mx-auto max-w-7xl px-6 py-20"><ErrorState title="Profile unavailable" body="We couldn't load an account profile for this session." /></div>;
  }

  function updateDraft<K extends keyof UserProfileDraft>(key: K, value: UserProfileDraft[K]) {
    setDraft((current) => current ? { ...current, [key]: value } : current);
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
    if (!draft || !user) {
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
      setFormError("Complete all account and address fields before saving.");
      return;
    }

    setSaving(true);
    try {
      const nextProfile = await profileService.updateProfile(user.id, {
        ...draft,
        preferences: cleanedPreferences,
      });
      setProfile(nextProfile);
      setDraft(toDraft(nextProfile));
      setEditing(false);
      setSuccessMessage("Profile changes saved.");
      syncUser({
        id: user.id,
        role: user.role,
        name: nextProfile.name,
        email: nextProfile.email,
      });
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to save your profile right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!profile) {
      return;
    }

    setDraft(toDraft(profile));
    setEditing(false);
    setFormError("");
    setSuccessMessage("");
  }

  return (
    <section className="page-fade mx-auto max-w-7xl px-6 py-16">
      <SectionHeading
        kicker="Profile"
        title={profile.name}
        description="Edit account details, delivery addresses, and personal preferences from the same customer workspace."
      />
      <div className="mt-12 grid gap-8 lg:grid-cols-[0.34fr_0.66fr]">
        <aside className="surface-mat rounded-[1.75rem] p-8">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-on-surface)] text-3xl font-['Manrope'] font-extrabold text-white">
            {profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
          </div>
          <h2 className="mt-6 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
            {profile.name}
          </h2>
          <p className="mt-2 text-sm text-[var(--color-muted)]">{profile.email}</p>
          <div className="mt-6 rounded-[1.25rem] bg-white px-5 py-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Membership
            </p>
            <p className="mt-2 text-lg">{profile.membership}</p>
          </div>
          <div className="mt-6">
            <p className="eyebrow">Preferences</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {profile.preferences.map((preference) => (
                <span
                  key={preference}
                  className="rounded-full bg-white px-4 py-2 text-sm text-[var(--color-muted)]"
                >
                  {preference}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-8 grid gap-3">
            <Link to="/orders">
              <Button className="w-full">View orders</Button>
            </Link>
            <Link to="/change-password">
              <Button variant="secondary" className="w-full">
                Change password
              </Button>
            </Link>
          </div>
        </aside>

        <form className="space-y-6" onSubmit={handleSave}>
          <div className="surface-card rounded-[1.75rem] p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Account settings</p>
                <h2 className="mt-3 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
                  Personal details
                </h2>
              </div>
              {editing ? (
                <div className="flex gap-3">
                  <Button type="button" variant="tertiary" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving…" : "Save profile"}
                  </Button>
                </div>
              ) : (
                <Button type="button" onClick={() => setEditing(true)}>
                  Edit profile
                </Button>
              )}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InputField
                label="Name"
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                readOnly={!editing}
              />
              <InputField
                label="Email"
                type="email"
                value={draft.email}
                onChange={(event) => updateDraft("email", event.target.value)}
                readOnly={!editing}
              />
              <InputField
                label="Location"
                value={draft.location}
                onChange={(event) => updateDraft("location", event.target.value)}
                readOnly={!editing}
              />
              <InputField
                label="Phone"
                value={draft.phone}
                onChange={(event) => updateDraft("phone", event.target.value)}
                readOnly={!editing}
              />
              <InputField
                label="Membership"
                value={draft.membership}
                onChange={(event) => updateDraft("membership", event.target.value)}
                readOnly={!editing}
              />
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
                readOnly={!editing}
                hint="Separate preferences with commas."
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="surface-mat rounded-[1.75rem] p-8">
              <p className="eyebrow">Shipping</p>
              <h2 className="mt-3 font-['Manrope'] text-2xl font-extrabold tracking-[-0.04em]">
                Primary delivery address
              </h2>
              <div className="mt-6 space-y-5">
                <InputField
                  label="Address"
                  value={draft.shippingAddress.line1}
                  onChange={(event) => updateAddress("shippingAddress", "line1", event.target.value)}
                  readOnly={!editing}
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    label="City"
                    value={draft.shippingAddress.city}
                    onChange={(event) => updateAddress("shippingAddress", "city", event.target.value)}
                    readOnly={!editing}
                  />
                  <InputField
                    label="Postal code"
                    value={draft.shippingAddress.postalCode}
                    onChange={(event) => updateAddress("shippingAddress", "postalCode", event.target.value)}
                    readOnly={!editing}
                  />
                </div>
                <InputField
                  label="Country"
                  value={draft.shippingAddress.country}
                  onChange={(event) => updateAddress("shippingAddress", "country", event.target.value)}
                  readOnly={!editing}
                />
              </div>
            </div>

            <div className="surface-card rounded-[1.75rem] p-8">
              <p className="eyebrow">Billing</p>
              <h2 className="mt-3 font-['Manrope'] text-2xl font-extrabold tracking-[-0.04em]">
                Billing address
              </h2>
              <div className="mt-6 space-y-5">
                <InputField
                  label="Address"
                  value={draft.billingAddress.line1}
                  onChange={(event) => updateAddress("billingAddress", "line1", event.target.value)}
                  readOnly={!editing}
                />
                <div className="grid gap-5 md:grid-cols-2">
                  <InputField
                    label="City"
                    value={draft.billingAddress.city}
                    onChange={(event) => updateAddress("billingAddress", "city", event.target.value)}
                    readOnly={!editing}
                  />
                  <InputField
                    label="Postal code"
                    value={draft.billingAddress.postalCode}
                    onChange={(event) => updateAddress("billingAddress", "postalCode", event.target.value)}
                    readOnly={!editing}
                  />
                </div>
                <InputField
                  label="Country"
                  value={draft.billingAddress.country}
                  onChange={(event) => updateAddress("billingAddress", "country", event.target.value)}
                  readOnly={!editing}
                />
              </div>
            </div>
          </div>

          {formError ? <p className="text-sm text-[var(--color-error)]">{formError}</p> : null}
          {successMessage ? <p className="text-sm text-[var(--color-muted)]">{successMessage}</p> : null}
        </form>
      </div>
    </section>
  );
}
