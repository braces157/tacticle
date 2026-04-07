import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary";
  children: ReactNode;
};

export function buttonClassName(variant: ButtonProps["variant"] = "primary") {
  const classes = ["button-base"];
  if (variant === "primary") classes.push("button-primary");
  if (variant === "secondary") classes.push("button-secondary");
  if (variant === "tertiary") classes.push("button-tertiary");
  return classes.join(" ");
}

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[buttonClassName(variant), className].filter(Boolean).join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
