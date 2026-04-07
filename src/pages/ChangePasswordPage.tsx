import { useState } from "react";
import { AuthFormLayout } from "../components/layout/AuthFormLayout";
import { Button } from "../components/ui/Button";
import { InputField } from "../components/ui/InputField";
import { useSession } from "../context/SessionContext";

export function ChangePasswordPage() {
  const { changePassword } = useSession();
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await changePassword(password);
      setSaved(true);
      setPassword("");
    } catch (submissionError) {
      setSaved(false);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to change the password right now.",
      );
    }
  }

  return (
    <AuthFormLayout
      kicker="Security"
      title="Change password"
      description="A quiet, minimal account surface that can later be bound to Spring Security without restructuring the page."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <InputField label="New password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button type="submit">Save password</Button>
      </form>
      {saved ? (
        <p className="mt-6 text-sm text-[var(--color-muted)]">Password updated successfully.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-[var(--color-error)]">{error}</p> : null}
    </AuthFormLayout>
  );
}
