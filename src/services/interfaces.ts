import type {
  AuthUser,
  CartItem,
  Category,
  CheckoutDraft,
  OrderDetail,
  OrderSummary,
  ProductDetail,
  ProductReview,
  ProductSummary,
  ReviewEligibility,
  ReviewSubmission,
  UserProfileDraft,
  UserProfile,
} from "../types/domain";

export interface CatalogService {
  listCategories(): Promise<Category[]>;
  getCategory(slug: string): Promise<Category | null>;
  listFeaturedProducts(): Promise<ProductSummary[]>;
  listProductsByCategory(slug: string): Promise<ProductSummary[]>;
  getProduct(slug: string): Promise<ProductDetail | null>;
  listRelatedProducts(slug: string): Promise<ProductSummary[]>;
  listProductReviews(slug: string): Promise<ProductReview[]>;
  getReviewEligibility(slug: string): Promise<ReviewEligibility>;
  submitProductReview(slug: string, review: ReviewSubmission): Promise<ProductReview>;
}

export interface SearchService {
  searchProducts(query: string): Promise<ProductSummary[]>;
}

export interface CartService {
  loadCart(): CartItem[];
  saveCart(items: CartItem[]): void;
  clearCart(): void;
}

export interface CheckoutService {
  submitOrder(draft: CheckoutDraft, items: CartItem[]): Promise<OrderDetail>;
}

export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  login(email: string, password: string): Promise<AuthUser>;
  register(name: string, email: string, password: string): Promise<AuthUser>;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  changePassword(password: string): Promise<void>;
}

export interface ProfileService {
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, draft: UserProfileDraft): Promise<UserProfile>;
  getOrders(userId: string): Promise<OrderSummary[]>;
  getOrderDetail(userId: string, orderId: string): Promise<OrderDetail | null>;
}
