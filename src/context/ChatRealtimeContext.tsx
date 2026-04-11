import {
  createContext,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiBaseUrl } from "../services/apiClient";
import { useSession } from "./SessionContext";
import type { ChatRealtimeEvent } from "../types/domain";

type ChatConnectionState = "disconnected" | "connecting" | "connected";

const WS_DISABLED_SESSION_KEY = "tg.chat.ws.disabled";

type ChatRealtimeContextValue = {
  connectionState: ChatConnectionState;
  sendMessage(threadId: string, body: string): boolean;
  subscribe(listener: (event: ChatRealtimeEvent) => void): () => void;
};

const ChatRealtimeContext = createContext<ChatRealtimeContextValue | null>(null);

function buildWebSocketUrl() {
  const targetUrl = new URL(apiBaseUrl, window.location.origin);
  targetUrl.protocol = targetUrl.protocol === "https:" ? "wss:" : "ws:";
  targetUrl.pathname = `${targetUrl.pathname.replace(/\/api$/, "").replace(/\/$/, "")}/ws/chat`;
  targetUrl.search = "";
  targetUrl.hash = "";
  return targetUrl.toString();
}

export function ChatRealtimeProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useSession();
  const [connectionState, setConnectionState] = useState<ChatConnectionState>("disconnected");
  const listenersRef = useRef(new Set<(event: ChatRealtimeEvent) => void>());
  const socketRef = useRef<WebSocket | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const wsDisabledRef = useRef(
    typeof window !== "undefined" && window.sessionStorage.getItem(WS_DISABLED_SESSION_KEY) === "1",
  );

  const broadcastEvent = useEffectEvent((event: ChatRealtimeEvent) => {
    listenersRef.current.forEach((listener) => listener(event));
  });

  const clearConnectTimer = useEffectEvent(() => {
    if (connectTimerRef.current !== null) {
      window.clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
  });

  const clearReconnectTimer = useEffectEvent(() => {
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  });

  const disableWebSocketForSession = useEffectEvent(() => {
    wsDisabledRef.current = true;
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(WS_DISABLED_SESSION_KEY, "1");
    }
  });

  const enableWebSocketForSession = useEffectEvent(() => {
    wsDisabledRef.current = false;
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(WS_DISABLED_SESSION_KEY);
    }
  });

  const closeSocket = useEffectEvent(() => {
    clearConnectTimer();
    clearReconnectTimer();
    const socket = socketRef.current;
    socketRef.current = null;
    if (!socket) {
      return;
    }

    if (socket.readyState === WebSocket.CONNECTING) {
      socket.onopen = () => {
        try {
          socket.close();
        } catch {
        }
      };
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      return;
    }

    if (socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  });

  const connect = useEffectEvent(() => {
    if (!shouldReconnectRef.current || socketRef.current || wsDisabledRef.current) {
      return;
    }

    clearReconnectTimer();
    setConnectionState((current) => (current === "connected" ? current : "connecting"));
    reconnectAttemptsRef.current += 1;

    const socket = new WebSocket(buildWebSocketUrl());
    socketRef.current = socket;

    socket.onopen = () => {
      hasConnectedRef.current = true;
      reconnectAttemptsRef.current = 0;
       enableWebSocketForSession();
      setConnectionState("connected");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as ChatRealtimeEvent;
        broadcastEvent(payload);
      } catch {
        broadcastEvent({
          type: "ERROR",
          payload: { message: "Received an unreadable chat event." },
        });
      }
    };

    socket.onerror = () => {
    };

    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      if (!shouldReconnectRef.current) {
        setConnectionState("disconnected");
        return;
      }

      if (!hasConnectedRef.current && reconnectAttemptsRef.current >= 2) {
        disableWebSocketForSession();
        setConnectionState("disconnected");
        return;
      }

      setConnectionState(hasConnectedRef.current ? "connecting" : "disconnected");

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        connect();
      }, hasConnectedRef.current ? 2500 : 4000);
    };
  });

  const scheduleConnect = useEffectEvent((delayMs: number) => {
    if (
      !shouldReconnectRef.current ||
      socketRef.current ||
      connectTimerRef.current !== null ||
      wsDisabledRef.current
    ) {
      return;
    }

    connectTimerRef.current = window.setTimeout(() => {
      connectTimerRef.current = null;
      connect();
    }, delayMs);
  });

  useEffect(() => {
    if (loading) {
      return;
    }

    shouldReconnectRef.current = Boolean(user);
    if (!user) {
      hasConnectedRef.current = false;
      reconnectAttemptsRef.current = 0;
      enableWebSocketForSession();
      closeSocket();
      setConnectionState("disconnected");
      return;
    }

    scheduleConnect(150);

    return () => {
      shouldReconnectRef.current = false;
      reconnectAttemptsRef.current = 0;
      closeSocket();
      setConnectionState("disconnected");
    };
  }, [closeSocket, loading, scheduleConnect, user?.id]);

  const value = useMemo<ChatRealtimeContextValue>(() => ({
    connectionState,
    sendMessage(threadId, body) {
      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return false;
      }

      socket.send(JSON.stringify({
        type: "SEND_MESSAGE",
        threadId,
        body,
      }));
      return true;
    },
    subscribe(listener) {
      listenersRef.current.add(listener);
      return () => {
        listenersRef.current.delete(listener);
      };
    },
  }), [connectionState]);

  return (
    <ChatRealtimeContext.Provider value={value}>
      {children}
    </ChatRealtimeContext.Provider>
  );
}

export function useChatRealtime() {
  const context = useContext(ChatRealtimeContext);
  if (!context) {
    throw new Error("useChatRealtime must be used within ChatRealtimeProvider");
  }
  return context;
}
