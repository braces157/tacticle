package com.tactilegallery.backend.config;

import com.tactilegallery.backend.security.WebSocketAuthHandshakeInterceptor;
import com.tactilegallery.backend.websocket.ChatWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final ChatWebSocketHandler chatWebSocketHandler;
    private final WebSocketAuthHandshakeInterceptor webSocketAuthHandshakeInterceptor;
    private final AppCorsProperties corsProperties;

    public WebSocketConfig(
        ChatWebSocketHandler chatWebSocketHandler,
        WebSocketAuthHandshakeInterceptor webSocketAuthHandshakeInterceptor,
        AppCorsProperties corsProperties
    ) {
        this.chatWebSocketHandler = chatWebSocketHandler;
        this.webSocketAuthHandshakeInterceptor = webSocketAuthHandshakeInterceptor;
        this.corsProperties = corsProperties;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(chatWebSocketHandler, "/ws/chat")
            .addInterceptors(webSocketAuthHandshakeInterceptor)
            .setAllowedOrigins(corsProperties.getAllowedOrigins().toArray(String[]::new));
    }
}
