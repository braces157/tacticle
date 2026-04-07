import type { ReactNode } from "react";

type AuthFormLayoutProps = {
  kicker: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthFormLayout({
  kicker,
  title,
  description,
  children,
}: AuthFormLayoutProps) {
  return (
    <section className="page-fade mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
      <div className="poster-frame min-h-[420px] overflow-hidden rounded-2xl">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzLHT59nxB33Z9pDwHPlvCTQqCr4WixIAjgCatmbHFIxChR2fWv__bBZ3TIVzxE32yeuf90LKFNE4D30Cih2ZV4vZgEJ7kyr9wucmJ9kg8Gun4HXFER2FZj8BAkA44sc7a7oi3uRkrOHf3IKgCRB3T3u-nHyqsLVWdhUPljoHTzA_vlVseE79DK68kXBnuGsu2jwp5Rp9T762HI3o5jSwuBr_bHvPnO1TZiDgQrDkR0J8vgcpeyn-JDeDiHJ1F-x-WNF18WKkNBXo"
          alt="Editorial workspace with a minimalist keyboard and natural materials."
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-x-0 bottom-0 space-y-4 p-8 text-white">
          <p className="eyebrow text-white/80">Membership</p>
          <h2 className="max-w-md font-['Manrope'] text-3xl font-extrabold tracking-[-0.04em]">
            Quiet systems for people who notice the weight of tools.
          </h2>
        </div>
      </div>
      <div className="surface-card ambient-shadow rounded-2xl p-8 lg:p-10">
        <p className="eyebrow">{kicker}</p>
        <h1 className="mt-4 font-['Manrope'] text-4xl font-extrabold tracking-[-0.04em]">
          {title}
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-7 text-[var(--color-muted)]">
          {description}
        </p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
