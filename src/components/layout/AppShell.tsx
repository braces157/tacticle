import type { ReactNode } from "react";
import { StorefrontChatWidget } from "../chat/StorefrontChatWidget";
import { CartDrawer } from "./CartDrawer";
import { Footer } from "./Footer";
import { TopNav } from "./TopNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
      <TopNav />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <StorefrontChatWidget />
    </div>
  );
}
