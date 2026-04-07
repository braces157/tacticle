import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthFormLayout } from "../components/layout/AuthFormLayout";
import { Button } from "../components/ui/Button";
import { InputField } from "../components/ui/InputField";
import { useSession } from "../context/SessionContext";

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useSession();
  const [name, setName] = useState("Gallery Visitor");
  const [email, setEmail] = useState("visitor@tactile.gallery");
  const [password, setPassword] = useState("quiet");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await register(name, email, password);
      navigate("/profile");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create your account right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormLayout
      kicker="Membership"
      title="Create an account"
      description="Create your account to save preferences, manage your profile, and track orders."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <InputField label="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <InputField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <InputField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create membership"}
        </Button>
      </form>
      {error ? <p className="mt-4 text-sm text-[var(--color-error)]">{error}</p> : null}
      <div className="mt-6 text-sm text-[var(--color-muted)]">
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </AuthFormLayout>
  );
}
