type SectionHeadingProps = {
  kicker: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  kicker,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
      <p className="eyebrow mb-4">{kicker}</p>
      <h2 className="font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em] text-[var(--color-on-surface)] md:text-5xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-xl text-base leading-7 text-[var(--color-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
