package com.tactilegallery.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tactilegallery.backend.model.DomainModels;
import com.tactilegallery.backend.security.AuthenticatedUser;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@Component
public class ChatRealtimeBroker {

    private final ObjectMapper objectMapper;
    private final Map<String, SessionRegistration> sessions = new ConcurrentHashMap<>();

    public ChatRealtimeBroker(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public void register(WebSocketSession session, AuthenticatedUser user) {
        sessions.put(session.getId(), new SessionRegistration(session, user));
        send(session, new ServerEvent("CONNECTED", Map.of(
            "userId", user.userId(),
            "role", user.role()
        )));
    }

    public void unregister(WebSocketSession session) {
        if (session != null) {
            sessions.remove(session.getId());
        }
    }

    public void broadcastMessageCreated(
        DomainModels.ChatThreadSummary thread,
        DomainModels.ChatMessage message
    ) {
        ServerEvent event = new ServerEvent("CHAT_MESSAGE_CREATED", Map.of(
            "thread", thread,
            "message", message
        ));
        broadcastToThreadAudience(thread, event);
    }

    public void broadcastThreadUpdated(DomainModels.ChatThreadSummary thread) {
        broadcastToThreadAudience(thread, new ServerEvent("CHAT_THREAD_UPDATED", Map.of("thread", thread)));
    }

    public void sendError(WebSocketSession session, String errorMessage) {
        send(session, new ServerEvent("ERROR", Map.of("message", errorMessage)));
    }

    private void broadcastToThreadAudience(DomainModels.ChatThreadSummary thread, ServerEvent event) {
        sessions.values().forEach(registration -> {
            AuthenticatedUser user = registration.user();
            if (user.isAdmin() || user.userId().equals(thread.customerId())) {
                send(registration.session(), event);
            }
        });
    }

    private void send(WebSocketSession session, ServerEvent event) {
        if (session == null || !session.isOpen()) {
            if (session != null) {
                sessions.remove(session.getId());
            }
            return;
        }

        try {
            String payload = objectMapper.writeValueAsString(event);
            synchronized (session) {
                session.sendMessage(new TextMessage(payload));
            }
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Unable to serialize chat event.", exception);
        } catch (IOException exception) {
            sessions.remove(session.getId());
        }
    }

    private record SessionRegistration(WebSocketSession session, AuthenticatedUser user) {
    }

    private record ServerEvent(String type, Object payload) {
    }
}
