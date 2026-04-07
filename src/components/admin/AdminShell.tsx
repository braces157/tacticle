import type { ReactNode } from "react";
import { AdminReviewNotificationsProvider } from "../../context/AdminReviewNotificationsContext";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <AdminReviewNotificationsProvider>
      <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-on-surface)]">
        <div className="flex min-h-screen">
          <AdminSidebar />
          <div className="min-w-0 flex-1">
            <AdminTopBar />
            <main className="mx-auto w-full max-w-[1680px] px-8 py-8 xl:px-10 2xl:px-12">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminReviewNotificationsProvider>
  );
}
