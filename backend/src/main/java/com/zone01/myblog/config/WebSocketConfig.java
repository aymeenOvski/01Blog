package com.zone01.myblog.config;

import com.zone01.myblog.security.jwt.JwtUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // The only destination clients are allowed to subscribe to in our business logic. All other subscriptions are rejected.
    private static final String NOTIFICATIONS_DESTINATION = "/user/queue/notifications";

    private final JwtUtils jwtUtils;
    private final UserDetailsService userDetailsService;

    @Value("${app.websocket.allowed-origins:http://localhost:4200}")
    private String[] allowedOrigins;

    public WebSocketConfig(JwtUtils jwtUtils, UserDetailsService userDetailsService) {
        this.jwtUtils = jwtUtils;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins(allowedOrigins);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/queue");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(16 * 1024);      // max incoming message: 16 KB
        registration.setSendBufferSizeLimit(512 * 1024);  // max outgoing buffer per session
        registration.setSendTimeLimit(20 * 1000);         // drop slow consumers after 20 s
    }

    // Intercept inbound messages to authenticate users and enforce subscription rules
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null || accessor.getCommand() == null) {
                    return message;
                }

                StompCommand command = accessor.getCommand();

                switch (command) {
                    case CONNECT, STOMP -> authenticate(accessor);

                    case SUBSCRIBE -> {
                        if (accessor.getUser() == null
                                || !NOTIFICATIONS_DESTINATION.equals(accessor.getDestination())) {
                            throw new MessageDeliveryException("Forbidden subscription");
                        }
                    }

                    case UNSUBSCRIBE, DISCONNECT -> {
                        // harmless, allow
                    }

                    // SEND, ACK, NACK, BEGIN, COMMIT, ABORT: not used by our business logic, reject !
                    default -> throw new MessageDeliveryException("Frame not allowed: " + command);
                }
                return message;
            }
        });
    }

    private void authenticate(StompHeaderAccessor accessor) {
        String authHeader = accessor.getFirstNativeHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new MessageDeliveryException("Unauthorized WebSocket connection");
        }

        String token = authHeader.substring(7);

        try {
            if (!jwtUtils.validateJwtToken(token)) {
                throw new MessageDeliveryException("Unauthorized WebSocket connection");
            }

            String username = jwtUtils.getUserNameFromJwtToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (!userDetails.isEnabled()) {
                throw new MessageDeliveryException("WebSocket connection rejected");
            }

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
            accessor.setUser(authentication);

        } catch (MessageDeliveryException e) {
            throw e;
        } catch (Exception e) {
            // e.g. UsernameNotFoundException for a deleted user: don't leak details
            throw new MessageDeliveryException("Unauthorized WebSocket connection");
        }
    }
}