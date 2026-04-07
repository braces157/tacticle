export type ImageAsset = {
  src: string;
  alt: string;
};

export type SpecItem = {
  label: string;
  value: string;
};

export type Category = {
  id: string;
  slug: string;
  name: string;
  kicker: string;
  headline: string;
  description: string;
  story: string;
  heroImage: ImageAsset;
};

export type ProductOptionValue = {
  id: string;
  label: string;
  priceDelta: number;
};

export type ProductOption = {
  id: string;
  group: string;
  values: ProductOptionValue[];
};

export type ProductSummary = {
  id: string;
  slug: string;
  categorySlug: string;
  name: string;
  subtitle: string;
  price: number;
  image: ImageAsset;
  tags: string[];
  material: string;
};

export type ProductDetail = ProductSummary & {
  gallery: ImageAsset[];
  description: string;
  story: string;
  specs: SpecItem[];
  highlights: string[];
  options: ProductOption[];
};

export type ProductReview = {
  id: string;
  productSlug: string;
  productName: string;
  authorName: string;
  rating: number;
  comment: string;
  status: string;
  createdAt: string;
  adminNote?: string | null;
};

export type ReviewEligibility = {
  canSubmit: boolean;
  hasPurchased: boolean;
  alreadyReviewed: boolean;
  reason: string;
};

export type ReviewSubmission = {
  rating: number;
  comment: string;
};

export type CartItem = {
  id: string;
  productSlug: string;
  productName: string;
  image: ImageAsset;
  price: number;
  quantity: number;
  selectedOptions: Record<string, string>;
};

export type CheckoutDraft = {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  paymentMethod: string;
  notes: string;
};

export type ShippingAddress = {
  line1: string;
  city: string;
  postalCode: string;
  country: string;
};

export type OrderStatus =
  | "Payment Review"
  | "Processing"
  | "Ready to Ship"
  | "Shipped"
  | "Delivered"
  | "Canceled";

export type UserProfileDraft = {
  name: string;
  email: string;
  location: string;
  phone: string;
  membership: string;
  preferences: string[];
  shippingAddress: ShippingAddress;
  billingAddress: ShippingAddress;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
};

export type AuthSession = {
  token: string;
  user: AuthUser;
};

export type UserProfile = UserProfileDraft & {
  userId: string;
};

export type OrderSummary = {
  id: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
};

export type OrderDetail = OrderSummary & {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentStatus: string;
  fulfillment: string;
  timeline: string[];
};

export type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

export type AdminInventoryItem = {
  productId: string;
  productSlug: string;
  name: string;
  subtitle: string;
  category: string;
  sku: string;
  price: number;
  stock: number;
  status: InventoryStatus;
  image: ImageAsset;
};

export type AdminDashboardMetric = {
  label: string;
  value: string;
  delta: string;
  tone: "neutral" | "positive" | "warning";
};

export type SalesPoint = {
  month: string;
  value: number;
};

export type LowStockAlert = {
  name: string;
  stock: number;
  percent: number;
  status: string;
};

export type AdminDraftProduct = {
  name: string;
  category: string;
  sku: string;
  price: string;
  stock: string;
  description: string;
  metadata: string;
  status: "Active" | "Hidden";
  images: AdminDraftProductImage[];
  options: AdminDraftProductOption[];
};

export type AdminDraftProductImage = {
  id: string;
  src: string;
  alt: string;
};

export type AdminDraftProductOptionValue = {
  id: string;
  label: string;
  priceDelta: string;
};

export type AdminDraftProductOption = {
  id: string;
  group: string;
  values: AdminDraftProductOptionValue[];
};

export type AdminOrderRecord = {
  id: string;
  userId: string | null;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  itemCount: number;
  fulfillment: string;
};

export type AdminOrderDetail = AdminOrderRecord & {
  items: CartItem[];
  shippingAddress: ShippingAddress;
  paymentStatus: string;
  timeline: string[];
  allowedNextStatuses: OrderStatus[];
};

export type AdminCustomerRecord = {
  id: string;
  accountId: string | null;
  name: string;
  email: string;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: string;
  status: "Active" | "Inactive";
};

export type AdminProductRecord = ProductDetail & {
  sku: string;
  stock: number;
  visibility: "Active" | "Hidden";
  archived: boolean;
};
