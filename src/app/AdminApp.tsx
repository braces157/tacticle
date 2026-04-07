import { Outlet } from "react-router-dom";
import { AdminShell } from "../components/admin/AdminShell";

export function AdminApp() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
