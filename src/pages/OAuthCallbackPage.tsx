import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import { consumePostAuthRedirect } from "../services/authStorage";

export function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { completeOAuthLogin } = useSession();
  const [error, setError] = useState("");

  useEffect(() => {
    completeOAuthLogin()
      .then(() => {
        navigate(consumePostAuthRedirect("/profile"), { replace: true });
      })
      .catch((submissionError) => {
        setError(
          submissionError instanceof Error
            ? submissionError.message
            : "Unable to complete Google sign-in.",
        );
      });
  }, [completeOAuthLogin, navigate]);

  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <div className="surface-card ambient-shadow rounded-2xl p-8">
        <p className="eyebrow">Account</p>
        <h1 className="mt-4 font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
          Completing Google sign-in
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-muted)]">
          {error || "Finalizing your session and loading your account."}
        </p>
      </div>
    </section>
  );
}
