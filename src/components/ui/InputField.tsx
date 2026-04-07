import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  error?: string;
  hint?: string;
};

type InputProps = BaseProps &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: "input";
  };

type TextareaProps = BaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    as: "textarea";
  };

export function InputField(props: InputProps | TextareaProps) {
  const { label, error, hint } = props;

  return (
    <label className="flex flex-col gap-2">
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
        {label}
      </span>
      <span className="input-shell flex">
        {props.as === "textarea" ? (
          <textarea
            {...props}
            className="min-h-28 w-full resize-y bg-transparent px-4 py-3 outline-none"
          />
        ) : (
          <input
            {...props}
            className="w-full bg-transparent px-4 py-3 outline-none"
          />
        )}
      </span>
      {error ? (
        <span className="text-sm text-[var(--color-error)]">{error}</span>
      ) : hint ? (
        <span className="text-sm text-[var(--color-muted)]">{hint}</span>
      ) : null}
    </label>
  );
}
