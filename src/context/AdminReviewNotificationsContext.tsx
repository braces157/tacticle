import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAdminReviews } from "../services/adminApi";
import type { ProductReview } from "../types/domain";

type AdminReviewNotificationsContextValue = {
  pendingReviews: ProductReview[];
  pendingCount: number;
  loading: boolean;
  refreshPendingReviews(): Promise<void>;
};

const AdminReviewNotificationsContext = createContext<AdminReviewNotificationsContextValue | null>(null);

export function AdminReviewNotificationsProvider({ children }: { children: ReactNode }) {
  const [pendingReviews, setPendingReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  async function refreshPendingReviews() {
    const reviews = await getAdminReviews("Pending");
    setPendingReviews(reviews);
    setLoading(false);
  }

  useEffect(() => {
    refreshPendingReviews().catch(() => {
      setPendingReviews([]);
      setLoading(false);
    });
  }, []);

  return (
    <AdminReviewNotificationsContext.Provider
      value={{
        pendingReviews,
        pendingCount: pendingReviews.length,
        loading,
        refreshPendingReviews,
      }}
    >
      {children}
    </AdminReviewNotificationsContext.Provider>
  );
}

export function useAdminReviewNotifications() {
  const context = useContext(AdminReviewNotificationsContext);
  if (!context) {
    throw new Error("useAdminReviewNotifications must be used within AdminReviewNotificationsProvider");
  }
  return context;
}
