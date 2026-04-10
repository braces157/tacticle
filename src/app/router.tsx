import { lazy, Suspense } from "react";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { AdminApp } from "./AdminApp";
import { App } from "./App";
import { StorefrontApp } from "./StorefrontApp";
import { RequireAdmin, RequireAuth } from "../context/SessionContext";

const AdminCustomersPage = lazy(() => import("../pages/AdminCustomersPage").then((module) => ({ default: module.AdminCustomersPage })));
const AdminCreateProductPage = lazy(() => import("../pages/AdminCreateProductPage").then((module) => ({ default: module.AdminCreateProductPage })));
const AdminDashboardPage = lazy(() => import("../pages/AdminDashboardPage").then((module) => ({ default: module.AdminDashboardPage })));
const AdminEditProductPage = lazy(() => import("../pages/AdminEditProductPage").then((module) => ({ default: module.AdminEditProductPage })));
const AdminInventoryPage = lazy(() => import("../pages/AdminInventoryPage").then((module) => ({ default: module.AdminInventoryPage })));
const AdminOrderDetailPage = lazy(() => import("../pages/AdminOrderDetailPage").then((module) => ({ default: module.AdminOrderDetailPage })));
const AdminOrdersPage = lazy(() => import("../pages/AdminOrdersPage").then((module) => ({ default: module.AdminOrdersPage })));
const AdminPromosPage = lazy(() => import("../pages/AdminPromosPage").then((module) => ({ default: module.AdminPromosPage })));
const AdminReviewsPage = lazy(() => import("../pages/AdminReviewsPage").then((module) => ({ default: module.AdminReviewsPage })));
const BrowsePage = lazy(() => import("../pages/BrowsePage").then((module) => ({ default: module.BrowsePage })));
const CartPage = lazy(() => import("../pages/CartPage").then((module) => ({ default: module.CartPage })));
const CategoryPage = lazy(() => import("../pages/CategoryPage").then((module) => ({ default: module.CategoryPage })));
const ChangePasswordPage = lazy(() => import("../pages/ChangePasswordPage").then((module) => ({ default: module.ChangePasswordPage })));
const CheckoutPage = lazy(() => import("../pages/CheckoutPage").then((module) => ({ default: module.CheckoutPage })));
const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage").then((module) => ({ default: module.ForgotPasswordPage })));
const HomePage = lazy(() => import("../pages/HomePage").then((module) => ({ default: module.HomePage })));
const LoginPage = lazy(() => import("../pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const OrderDetailPage = lazy(() => import("../pages/OrderDetailPage").then((module) => ({ default: module.OrderDetailPage })));
const OrderHistoryPage = lazy(() => import("../pages/OrderHistoryPage").then((module) => ({ default: module.OrderHistoryPage })));
const OAuthCallbackPage = lazy(() => import("../pages/OAuthCallbackPage").then((module) => ({ default: module.OAuthCallbackPage })));
const ProductPage = lazy(() => import("../pages/ProductPage").then((module) => ({ default: module.ProductPage })));
const ProfilePage = lazy(() => import("../pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const RegisterPage = lazy(() => import("../pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const SearchPage = lazy(() => import("../pages/SearchPage").then((module) => ({ default: module.SearchPage })));

function RouteLoadingFallback() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24 text-sm text-[var(--color-muted)]">
      Loading page...
    </div>
  );
}

export const routes = createRoutesFromElements(
  <Route
    path="/"
    element={
      <Suspense fallback={<RouteLoadingFallback />}>
        <App />
      </Suspense>
    }
  >
    <Route
      element={
        <Suspense fallback={<RouteLoadingFallback />}>
          <StorefrontApp />
        </Suspense>
      }
    >
      <Route index element={<HomePage />} />
      <Route path="browse" element={<BrowsePage />} />
      <Route path="category/:slug" element={<CategoryPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="product/:slug" element={<ProductPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="auth/callback" element={<OAuthCallbackPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="forgot-password" element={<ForgotPasswordPage />} />
      <Route
        path="change-password"
        element={
          <RequireAuth>
            <ChangePasswordPage />
          </RequireAuth>
        }
      />
      <Route
        path="profile"
        element={
          <RequireAuth>
            <ProfilePage />
          </RequireAuth>
        }
      />
      <Route
        path="orders"
        element={
          <RequireAuth>
            <OrderHistoryPage />
          </RequireAuth>
        }
      />
      <Route
        path="orders/:orderId"
        element={
          <RequireAuth>
            <OrderDetailPage />
          </RequireAuth>
        }
      />
    </Route>
    <Route
      path="admin"
      element={
        <RequireAdmin>
          <Suspense fallback={<RouteLoadingFallback />}>
            <AdminApp />
          </Suspense>
        </RequireAdmin>
      }
    >
      <Route index element={<AdminDashboardPage />} />
      <Route path="orders" element={<AdminOrdersPage />} />
      <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
      <Route path="reviews" element={<AdminReviewsPage />} />
      <Route path="customers" element={<AdminCustomersPage />} />
      <Route path="inventory" element={<AdminInventoryPage />} />
      <Route path="promos" element={<AdminPromosPage />} />
      <Route path="products/new" element={<AdminCreateProductPage />} />
      <Route path="products/:slug/edit" element={<AdminEditProductPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Route>,
);

export const router = createBrowserRouter(routes);
