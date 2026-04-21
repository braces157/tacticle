import { Outlet } from "react-router-dom";
import { CartProvider } from "../context/CartContext";
import { ChatRealtimeProvider } from "../context/ChatRealtimeContext";
import { SessionProvider } from "../context/SessionContext";
import { WishlistProvider } from "../context/WishlistContext";

export function App() {
  return (
    <SessionProvider>
      <ChatRealtimeProvider>
        <WishlistProvider>
          <CartProvider>
            <Outlet />
          </CartProvider>
        </WishlistProvider>
      </ChatRealtimeProvider>
    </SessionProvider>
  );
}
