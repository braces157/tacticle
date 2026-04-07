import { Outlet } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";

export function StorefrontApp() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
