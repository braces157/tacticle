import type {
  AuthUser,
  CartItem,
  CheckoutDraft,
  PromoQuote,
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
import { readJson, removeStored, writeJson } from "./browserStorage";

const cartKey = "tactile.cart";

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
    const remoteUser = await apiRequest<AuthUser>(
      "/auth/me",
      undefined,
      { allow401: true, allow404: true },
    );

    if (!remoteUser) {
      clearStoredSession();
      return null;
    }

    writeStoredSession(remoteUser);
    return remoteUser;
  },
  async login(email, password) {
    const user = await apiRequest<AuthUser>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    writeStoredSession(user as AuthUser);
    return user as AuthUser;
  },
  async register(name, email, password) {
    const user = await apiRequest<AuthUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });

    writeStoredSession(user as AuthUser);
    return user as AuthUser;
  },
  async completeOAuthLogin() {
    const user = await apiRequest<AuthUser>("/auth/me", undefined, { allow401: true });
    if (!user) {
      throw new Error("Unable to complete Google sign-in.");
    }

    writeStoredSession(user);
    return user;
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
  async changePassword(currentPassword, password) {
    await apiRequest("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, password }),
    });
  },
};

export const checkoutService: CheckoutService = {
  async submitOrder(draft: CheckoutDraft, items: CartItem[], promoCode?: string | null) {
    const currentUser = getStoredSessionUser();
    if (!currentUser) {
      throw new Error("Please sign in before placing an order.");
    }

    return (await apiRequest<OrderDetail>("/orders/checkout", {
      method: "POST",
      body: JSON.stringify({
        draft,
        items,
        promoCode,
      }),
    })) as OrderDetail;
  },
  async quotePromo(items: CartItem[], promoCode: string) {
    return (await apiRequest<PromoQuote>("/orders/promo/quote", {
      method: "POST",
      body: JSON.stringify({
        items,
        promoCode,
      }),
    })) as PromoQuote;
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
