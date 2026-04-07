import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { AdminApp } from "./AdminApp";
import { App } from "./App";
import { StorefrontApp } from "./StorefrontApp";
import { RequireAdmin, RequireAuth } from "../context/SessionContext";
import { AdminCustomersPage } from "../pages/AdminCustomersPage";
import { AdminCreateProductPage } from "../pages/AdminCreateProductPage";
import { AdminDashboardPage } from "../pages/AdminDashboardPage";
import { AdminEditProductPage } from "../pages/AdminEditProductPage";
import { AdminInventoryPage } from "../pages/AdminInventoryPage";
import { AdminOrderDetailPage } from "../pages/AdminOrderDetailPage";
import { AdminOrdersPage } from "../pages/AdminOrdersPage";
import { AdminReviewsPage } from "../pages/AdminReviewsPage";
import { BrowsePage } from "../pages/BrowsePage";
import { CartPage } from "../pages/CartPage";
import { CategoryPage } from "../pages/CategoryPage";
import { ChangePasswordPage } from "../pages/ChangePasswordPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { ForgotPasswordPage } from "../pages/ForgotPasswordPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { OrderDetailPage } from "../pages/OrderDetailPage";
import { OrderHistoryPage } from "../pages/OrderHistoryPage";
import { ProductPage } from "../pages/ProductPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RegisterPage } from "../pages/RegisterPage";
import { SearchPage } from "../pages/SearchPage";

export const routes = createRoutesFromElements(
  <Route path="/" element={<App />}>
    <Route element={<StorefrontApp />}>
      <Route index element={<HomePage />} />
      <Route path="browse" element={<BrowsePage />} />
      <Route path="category/:slug" element={<CategoryPage />} />
      <Route path="search" element={<SearchPage />} />
      <Route path="product/:slug" element={<ProductPage />} />
      <Route path="cart" element={<CartPage />} />
      <Route path="checkout" element={<CheckoutPage />} />
      <Route path="login" element={<LoginPage />} />
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
          <AdminApp />
        </RequireAdmin>
      }
    >
      <Route index element={<AdminDashboardPage />} />
      <Route path="orders" element={<AdminOrdersPage />} />
      <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
      <Route path="reviews" element={<AdminReviewsPage />} />
      <Route path="customers" element={<AdminCustomersPage />} />
      <Route path="inventory" element={<AdminInventoryPage />} />
      <Route path="products/new" element={<AdminCreateProductPage />} />
      <Route path="products/:slug/edit" element={<AdminEditProductPage />} />
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Route>,
);

export const router = createBrowserRouter(routes);
