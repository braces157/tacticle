import { Outlet } from "react-router-dom";
import { CartProvider } from "../context/CartContext";
import { ChatRealtimeProvider } from "../context/ChatRealtimeContext";
import { SessionProvider } from "../context/SessionContext";

export function App() {
  return (
    <SessionProvider>
      <ChatRealtimeProvider>
        <CartProvider>
          <Outlet />
        </CartProvider>
      </ChatRealtimeProvider>
    </SessionProvider>
  );
}
