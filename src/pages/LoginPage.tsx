import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AuthFormLayout } from "../components/layout/AuthFormLayout";
import { Button } from "../components/ui/Button";
import { buttonClassName } from "../components/ui/Button";
import { InputField } from "../components/ui/InputField";
import { useSession } from "../context/SessionContext";
import { apiBaseUrl } from "../services/apiClient";
import { storePostAuthRedirect } from "../services/authStorage";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const oauthError = searchParams.get("oauthError") ?? "";
  const googleLoginUrl = useMemo(() => {
    if (/^https?:\/\//.test(apiBaseUrl)) {
      const targetUrl = new URL(apiBaseUrl);
      targetUrl.pathname = `${targetUrl.pathname.replace(/\/api$/, "").replace(/\/$/, "")}/oauth2/authorization/google`;
      targetUrl.search = "";
      targetUrl.hash = "";
      return targetUrl.toString();
    }

    return "/oauth2/authorization/google";
  }, []);
  const redirectPath = (location.state as { from?: string } | null)?.from ?? "/profile";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await login(email, password);
      navigate(redirectPath);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to sign in right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFormLayout
      kicker="Account"
      title="Sign in"
      description="Access profile details, order history, and the saved state of your current session."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <InputField label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <InputField label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Enter the gallery"}
        </Button>
        <a
          href={googleLoginUrl}
          className={buttonClassName("secondary")}
          onClick={() => storePostAuthRedirect(redirectPath)}
        >
          Continue with Google
        </a>
      </form>
      {error || oauthError ? (
        <p className="mt-4 text-sm text-[var(--color-error)]">{error || oauthError}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-4 text-sm text-[var(--color-muted)]">
        <Link to="/forgot-password">Forgot password</Link>
        <Link to="/register">Create an account</Link>
      </div>
    </AuthFormLayout>
  );
}
