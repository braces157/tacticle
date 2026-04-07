import type {
  AuthSession,
  AuthUser,
  CartItem,
  CheckoutDraft,
  OrderDetail,
  OrderSummary,
  UserProfileDraft,
  UserProfile,
  ProductReview,
  ReviewEligibility,
  ReviewSubmission,
} from "../types/domain";
import type {
  AuthService,
  CartService,
  CatalogService,
  CheckoutService,
  ProfileService,
  SearchService,
} from "./interfaces";
import { apiRequest } from "./apiClient";
import {
  clearStoredSession,
  getStoredSessionUser,
  writeStoredSession,
} from "./authStorage";

const cartKey = "tactile.cart";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined" || typeof window.localStorage?.getItem !== "function") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined" || typeof window.localStorage?.setItem !== "function") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeStored(key: string) {
  if (typeof window === "undefined" || typeof window.localStorage?.removeItem !== "function") {
    return;
  }

  window.localStorage.removeItem(key);
}

export const catalogService: CatalogService = {
  async listCategories() {
    return (await apiRequest("/categories")) ?? [];
  },
  async getCategory(slug) {
    return (await apiRequest(`/categories/${slug}`, undefined, { allow404: true })) ?? null;
  },
  async listFeaturedProducts() {
    return (await apiRequest("/products/featured")) ?? [];
  },
  async listProductsByCategory(slug) {
    return (await apiRequest(`/products?category=${encodeURIComponent(slug)}`)) ?? [];
  },
  async getProduct(slug) {
    return (await apiRequest(`/products/${slug}`, undefined, { allow404: true })) ?? null;
  },
  async listRelatedProducts(slug) {
    return (await apiRequest(`/products/${slug}/related`)) ?? [];
  },
  async listProductReviews(slug) {
    return (await apiRequest<ProductReview[]>(`/products/${slug}/reviews`)) ?? [];
  },
  async getReviewEligibility(slug) {
    return (await apiRequest<ReviewEligibility>(`/products/${slug}/review-eligibility`)) as ReviewEligibility;
  },
  async submitProductReview(slug, review) {
    return (await apiRequest<ProductReview>(`/products/${slug}/reviews`, {
      method: "POST",
      body: JSON.stringify(review satisfies ReviewSubmission),
    })) as ProductReview;
  },
};

export const searchService: SearchService = {
  async searchProducts(query) {
    return (
      (await apiRequest(`/search/products?q=${encodeURIComponent(query)}`)) ?? []
    );
  },
};

export const cartService: CartService = {
  loadCart() {
    return readJson<CartItem[]>(cartKey, []);
  },
  saveCart(items) {
    writeJson(cartKey, items);
  },
  clearCart() {
    removeStored(cartKey);
  },
};

export const authService: AuthService = {
  async getCurrentUser() {
    const currentUser = getStoredSessionUser();
    if (!currentUser) {
      return null;
    }

    const remoteUser = await apiRequest<AuthUser>(
      "/auth/me",
      undefined,
      { allow404: true },
    );

    if (!remoteUser) {
      clearStoredSession();
      return null;
    }

    const currentSession = readJson<AuthSession | null>("tactile.session", null);
    if (currentSession?.token) {
      writeStoredSession({ token: currentSession.token, user: remoteUser });
    }
    return remoteUser;
  },
  async login(email, password) {
    const session = await apiRequest<AuthSession>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    writeStoredSession(session as AuthSession);
    return (session as AuthSession).user;
  },
  async register(name, email, password) {
    const session = await apiRequest<AuthSession>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    writeStoredSession(session as AuthSession);
    return (session as AuthSession).user;
  },
  async logout() {
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } finally {
      clearStoredSession();
    }
  },
  async requestPasswordReset(email) {
    await apiRequest("/auth/password-reset", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  async changePassword(password) {
    const currentUser = getStoredSessionUser();
    if (!currentUser) {
      throw new Error("You need to be signed in to change your password.");
    }

    await apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },
};

export const checkoutService: CheckoutService = {
  async submitOrder(draft: CheckoutDraft, items: CartItem[]) {
    const currentUser = getStoredSessionUser();
    if (!currentUser) {
      throw new Error("Please sign in before placing an order.");
    }

    return (await apiRequest<OrderDetail>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({
        draft,
        items,
      }),
    })) as OrderDetail;
  },
};

export const profileService: ProfileService = {
  async getProfile(userId) {
    return (
      (await apiRequest<UserProfile>(
        `/users/${encodeURIComponent(userId)}/profile`,
        undefined,
        { allow404: true },
      )) ?? null
    );
  },
  async updateProfile(userId, draft) {
    return (await apiRequest<UserProfile>(`/users/${encodeURIComponent(userId)}/profile`, {
      method: "PUT",
      body: JSON.stringify(draft satisfies UserProfileDraft),
    })) as UserProfile;
  },
  async getOrders(userId) {
    return (
      (await apiRequest<OrderSummary[]>(`/users/${encodeURIComponent(userId)}/orders`)) ?? []
    );
  },
  async getOrderDetail(userId, orderId) {
    return (
      (await apiRequest<OrderDetail>(
        `/users/${encodeURIComponent(userId)}/orders/${encodeURIComponent(orderId)}`,
        undefined,
        { allow404: true },
      )) ?? null
    );
  },
};
