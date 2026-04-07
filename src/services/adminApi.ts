import type {
  AdminCustomerRecord,
  AdminDashboardMetric,
  AdminDraftProduct,
  AdminInventoryItem,
  AdminOrderDetail,
  AdminOrderRecord,
  AdminProductRecord,
  OrderStatus,
  ProductReview,
  SalesPoint,
  ShippingAddress,
  UserProfile,
  UserProfileDraft,
} from "../types/domain";
import { apiRequest } from "./apiClient";

const orderStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  "Payment Review": ["Processing", "Canceled"],
  Processing: ["Ready to Ship", "Shipped", "Canceled"],
  "Ready to Ship": ["Shipped", "Canceled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Canceled: [],
};

function normalizeAdminOrderDetail(order: AdminOrderDetail | null) {
  if (!order) {
    return null;
  }

  const allowedNextStatuses = Array.isArray(order.allowedNextStatuses)
    ? order.allowedNextStatuses
    : (orderStatusTransitions[order.status] ?? []);

  return {
    ...order,
    allowedNextStatuses,
    items: order.items ?? [],
    timeline: order.timeline ?? [],
  };
}

export async function getAdminMetrics() {
  return (await apiRequest<AdminDashboardMetric[]>("/admin/dashboard/metrics")) ?? [];
}

export async function getAdminSalesSeries() {
  return (await apiRequest<SalesPoint[]>("/admin/dashboard/sales")) ?? [];
}

export async function getLowStockAlerts() {
  return (await apiRequest<Array<{ name: string; stock: number; percent: number; status: string }>>(
    "/admin/dashboard/low-stock",
  )) ?? [];
}

export async function getAdminInventoryItems(filters?: {
  query?: string;
  category?: string;
  stockStatus?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.query) params.set("query", filters.query);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.stockStatus) params.set("stockStatus", filters.stockStatus);

  const query = params.toString();
  return (
    (await apiRequest<AdminInventoryItem[]>(`/admin/inventory${query ? `?${query}` : ""}`)) ?? []
  );
}

export async function getAdminProductRecord(slug: string) {
  return (
    (await apiRequest<AdminProductRecord>(
      `/admin/products/${encodeURIComponent(slug)}`,
      undefined,
      { allow404: true },
    )) ?? null
  );
}

export async function getInitialDraftProduct() {
  return (await apiRequest<AdminDraftProduct>("/admin/products/draft")) as AdminDraftProduct;
}

export async function getDraftProductFromExisting(slug: string) {
  return (
    (await apiRequest<AdminDraftProduct>(
      `/admin/products/${encodeURIComponent(slug)}/draft`,
      undefined,
      { allow404: true },
    )) ?? null
  );
}

export async function createAdminProduct(draft: AdminDraftProduct) {
  return (await apiRequest<AdminProductRecord>("/admin/products", {
    method: "POST",
    body: JSON.stringify(draft),
  })) as AdminProductRecord;
}

export async function updateAdminProduct(slug: string, draft: AdminDraftProduct) {
  return (
    (await apiRequest<AdminProductRecord>(
      `/admin/products/${encodeURIComponent(slug)}`,
      {
        method: "PUT",
        body: JSON.stringify(draft),
      },
      { allow404: true },
    )) ?? null
  );
}

export async function uploadAdminProductImage(file: File) {
  const body = new FormData();
  body.append("file", file);

  const response = await apiRequest<{ url: string; filename: string }>("/admin/uploads/images", {
    method: "POST",
    body,
  });

  return response as { url: string; filename: string };
}

export async function archiveAdminProduct(slug: string) {
  await apiRequest(`/admin/products/${encodeURIComponent(slug)}`, {
    method: "DELETE",
  });
}

export async function getAdminProductReviews(slug: string, status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return (
    (await apiRequest<ProductReview[]>(
      `/admin/products/${encodeURIComponent(slug)}/reviews${query}`,
    )) ?? []
  );
}

export async function getAdminReviews(status?: string) {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return (await apiRequest<ProductReview[]>(`/admin/reviews${query}`)) ?? [];
}

export async function approveAdminProductReview(reviewId: string, note?: string) {
  return (await apiRequest<ProductReview>(`/admin/reviews/${encodeURIComponent(reviewId)}/approve`, {
    method: "POST",
    body: JSON.stringify({ note: note ?? "" }),
  })) as ProductReview;
}

export async function rejectAdminProductReview(reviewId: string, note?: string) {
  return (await apiRequest<ProductReview>(`/admin/reviews/${encodeURIComponent(reviewId)}/reject`, {
    method: "POST",
    body: JSON.stringify({ note: note ?? "" }),
  })) as ProductReview;
}

export async function getAdminHeroImage() {
  const response = await apiRequest<{ src: string }>("/admin/hero-image");
  return response?.src ?? "";
}

export async function getAdminOrders() {
  return (await apiRequest<AdminOrderRecord[]>("/admin/orders")) ?? [];
}

export async function getAdminOrderDetail(orderId: string) {
  return normalizeAdminOrderDetail(
    (await apiRequest<AdminOrderDetail>(
      `/admin/orders/${encodeURIComponent(orderId)}`,
      undefined,
      { allow404: true },
    )) ?? null,
  );
}

export async function updateAdminOrderStatus(orderId: string, status: OrderStatus) {
  try {
    return normalizeAdminOrderDetail(
      (await apiRequest<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })) as AdminOrderDetail,
    ) as AdminOrderDetail;
  } catch (error) {
    if (error instanceof Error && error.message === "Request failed with status 404.") {
      throw new Error(
        "Order status updates are not available on the backend currently running. Restart the Spring backend so it picks up the new admin status endpoint.",
      );
    }
    throw error;
  }
}

export async function getAdminCustomers() {
  return (await apiRequest<AdminCustomerRecord[]>("/admin/customers")) ?? [];
}

export async function updateAdminCustomerStatus(
  customerId: string,
  status: AdminCustomerRecord["status"],
) {
  return (await apiRequest<AdminCustomerRecord>(`/admin/customers/${encodeURIComponent(customerId)}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  })) as AdminCustomerRecord;
}

export async function getAdminCustomerProfile(userId: string) {
  return (
    (await apiRequest<UserProfile>(
      `/users/${encodeURIComponent(userId)}/profile`,
      undefined,
      { allow404: true },
    )) ?? null
  );
}

export async function updateAdminCustomerProfile(userId: string, draft: UserProfileDraft) {
  return (await apiRequest<UserProfile>(`/users/${encodeURIComponent(userId)}/profile`, {
    method: "PUT",
    body: JSON.stringify(draft satisfies UserProfileDraft),
  })) as UserProfile;
}

export function describeShippingAddress(address: ShippingAddress) {
  return [address.line1, address.city, address.postalCode, address.country]
    .filter(Boolean)
    .join(", ");
}
