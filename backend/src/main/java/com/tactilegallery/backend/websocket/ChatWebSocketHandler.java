package com.tactilegallery.backend.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactilegallery.backend.security.AuthenticatedUser;
import com.tactilegallery.backend.security.WebSocketAuthHandshakeInterceptor;
import com.tactilegallery.backend.service.ChatRealtimeBroker;
import com.tactilegallery.backend.service.ChatService;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper;
    private final ChatService chatService;
    private final ChatRealtimeBroker chatRealtimeBroker;

    public ChatWebSocketHandler(
        ObjectMapper objectMapper,
        ChatService chatService,
        ChatRealtimeBroker chatRealtimeBroker
    ) {
        this.objectMapper = objectMapper;
        this.chatService = chatService;
        this.chatRealtimeBroker = chatRealtimeBroker;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        AuthenticatedUser user = authenticatedUser(session);
        if (user == null) {
            closeSilently(session, CloseStatus.NOT_ACCEPTABLE.withReason("Authentication required."));
            return;
        }

        chatRealtimeBroker.register(session, user);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        AuthenticatedUser user = authenticatedUser(session);
        if (user == null) {
            chatRealtimeBroker.sendError(session, "Authentication required.");
            closeSilently(session, CloseStatus.NOT_ACCEPTABLE.withReason("Authentication required."));
            return;
        }

        try {
            ClientMessage payload = objectMapper.readValue(message.getPayload(), ClientMessage.class);
            if (!"SEND_MESSAGE".equals(payload.type())) {
                chatRealtimeBroker.sendError(session, "Unsupported chat event.");
                return;
            }

            Long threadId;
            try {
                threadId = Long.valueOf(payload.threadId());
            } catch (NumberFormatException exception) {
                chatRealtimeBroker.sendError(session, "Invalid chat thread id.");
                return;
            }

            chatService.sendMessageFromSocket(user, threadId, payload.body());
        } catch (Exception exception) {
            chatRealtimeBroker.sendError(
                session,
                exception.getMessage() == null || exception.getMessage().isBlank()
                    ? "Unable to process chat message."
                    : exception.getMessage()
            );
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        chatRealtimeBroker.unregister(session);
        closeSilently(session, CloseStatus.SERVER_ERROR);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        chatRealtimeBroker.unregister(session);
    }

    private AuthenticatedUser authenticatedUser(WebSocketSession session) {
        Object attribute = session.getAttributes().get(WebSocketAuthHandshakeInterceptor.AUTH_USER_ATTRIBUTE);
        return attribute instanceof AuthenticatedUser user ? user : null;
    }

    private void closeSilently(WebSocketSession session, CloseStatus status) {
        try {
            if (session.isOpen()) {
                session.close(status);
            }
        } catch (Exception ignored) {
        }
    }

    private record ClientMessage(String type, String threadId, String body) {
    }
}
