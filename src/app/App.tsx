import { Outlet } from "react-router-dom";
import { CartProvider } from "../context/CartContext";
import { SessionProvider } from "../context/SessionContext";

export function App() {
  return (
    <SessionProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </SessionProvider>
  );
}
