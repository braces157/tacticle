import { useState } from "react";
import { AuthFormLayout } from "../components/layout/AuthFormLayout";
import { Button } from "../components/ui/Button";
import { InputField } from "../components/ui/InputField";
import { useSession } from "../context/SessionContext";

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useSession();
  const [email, setEmail] = useState("member@tactile.gallery");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (submissionError) {
      setSent(false);
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to start password recovery right now.",
      );
    }
  }

  return (
    <AuthFormLayout
      kicker="Recovery"
      title="Reset your password"
      description="Enter your email and we'll help you reset your password."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <InputField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button type="submit">Send reset instructions</Button>
      </form>
      {sent ? (
        <p className="mt-6 text-sm leading-7 text-[var(--color-muted)]">
          If an account matches {email}, reset instructions will arrive shortly.
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-[var(--color-error)]">{error}</p> : null}
    </AuthFormLayout>
  );
}
