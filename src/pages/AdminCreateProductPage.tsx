import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminProductForm } from "../components/admin/AdminProductForm";
import { ErrorState, LoadingState } from "../components/ui/AsyncState";
import {
  createAdminProduct,
  getInitialDraftProduct,
} from "../services/adminApi";
import type { AdminDraftProduct } from "../types/domain";

export function AdminCreateProductPage() {
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState<AdminDraftProduct | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getInitialDraftProduct()
      .then(setInitialValues)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return <ErrorState />;
  }

  if (!initialValues) {
    return <LoadingState label="Preparing product form…" />;
  }

  return (
    <div className="page-fade space-y-8">
      <nav className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--color-muted)]">
        <Link to="/admin/inventory">Inventory</Link>
        <span>/</span>
        <span className="text-[var(--color-primary)]">New Product</span>
      </nav>

      <header>
        <h1 className="font-['Manrope'] text-5xl font-extrabold tracking-[-0.06em]">
          Create Product
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--color-muted)]">
          Curate the next piece for the Tactile Gallery. The form writes directly
          to the admin API backed by your database.
        </p>
      </header>

      <AdminProductForm
        mode="create"
        initialValues={initialValues}
        onSubmit={async (values) => {
          const product = await createAdminProduct(values);
          navigate(`/admin/products/${product.slug}/edit`);
        }}
      />
    </div>
  );
}
