package com.zone01.myblog.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int TOO_MANY_REQUESTS = 429;

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    private record RateLimitRule(
            String name,
            int capacity,
            Duration refillPeriod) {
    }

    // =========================
    // RATE LIMIT RULES
    // =========================

    private static final RateLimitRule GLOBAL_RULE = new RateLimitRule(
            "global",
            100,
            Duration.ofMinutes(1));

    private static final RateLimitRule LOGIN_RULE = new RateLimitRule(
            "login",
            5,
            Duration.ofMinutes(1));

    private static final RateLimitRule REGISTER_RULE = new RateLimitRule(
            "register",
            3,
            Duration.ofMinutes(5));

    private static final RateLimitRule REPORT_RULE = new RateLimitRule(
            "report",
            3,
            Duration.ofMinutes(5));

    private static final RateLimitRule CREATE_POST_RULE = new RateLimitRule(
            "create-post",
            5,
            Duration.ofMinutes(1));

    private static final RateLimitRule COMMENT_RULE = new RateLimitRule(
            "comment",
            10,
            Duration.ofMinutes(1));

    private static final RateLimitRule LIKE_POST_RULE = new RateLimitRule(
            "like-post",
            5,
            Duration.ofMinutes(1));

    private static final RateLimitRule LIKE_COMMENT_RULE = new RateLimitRule(
            "like-comment",
            5,
            Duration.ofMinutes(1));

    private static final RateLimitRule FOLLOW_RULE = new RateLimitRule(
            "follow",
            5,
            Duration.ofMinutes(1));

    private static final RateLimitRule REPOST_RULE = new RateLimitRule(
            "repost",
            5,
            Duration.ofMinutes(1));

    private static final RateLimitRule COMMENT_MODIFICATION_RULE = new RateLimitRule(
            "comment-modification",
            10,
            Duration.ofMinutes(1));

    private Bucket createBucket(RateLimitRule rule) {

        Bandwidth limit = Bandwidth.builder()
                .capacity(rule.capacity())
                .refillGreedy(
                        rule.capacity(),
                        rule.refillPeriod())
                .build();

        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    private Bucket resolveBucket(
            String clientIp,
            RateLimitRule rule) {

        String key = clientIp + ":" + rule.name();

        return buckets.computeIfAbsent(
                key,
                ignored -> createBucket(rule));
    }

    private RateLimitRule getRule(HttpServletRequest request) {

        String method = request.getMethod();
        String uri = request.getRequestURI();

        // Only apply these rules to API requests.
        if (!uri.startsWith("/api/")) {
            return null;
        }

        // =========================
        // AUTH
        // =========================

        if ("POST".equals(method)
                && "/api/auth/login".equals(uri)) {
            return LOGIN_RULE;
        }

        if ("POST".equals(method)
                && "/api/auth/register".equals(uri)) {
            return REGISTER_RULE;
        }

        // =========================
        // REPORTS
        // =========================

        if ("POST".equals(method)
                && "/api/reports".equals(uri)) {
            return REPORT_RULE;
        }

        // =========================
        // POSTS
        // =========================

        // Create post
        if ("POST".equals(method)
                && "/api/posts".equals(uri)) {
            return CREATE_POST_RULE;
        }

        // Like / unlike post
        if ("POST".equals(method)
                && uri.matches("/api/posts/\\d+/like")) {
            return LIKE_POST_RULE;
        }

        // Repost
        if ("POST".equals(method)
                && uri.matches("/api/posts/\\d+/repost")) {
            return REPOST_RULE;
        }

        // =========================
        // COMMENTS
        // =========================

        // Create comment
        if ("POST".equals(method)
                && uri.matches("/api/posts/\\d+/comments")) {
            return COMMENT_RULE;
        }

        // Like / unlike comment
        if ("POST".equals(method)
                && uri.matches("/api/comments/\\d+/like")) {
            return LIKE_COMMENT_RULE;
        }

        // Edit comment
        if ("PUT".equals(method)
                && uri.matches("/api/comments/\\d+")) {
            return COMMENT_MODIFICATION_RULE;
        }

        // Delete comment
        if ("DELETE".equals(method)
                && uri.matches("/api/comments/\\d+")) {
            return COMMENT_MODIFICATION_RULE;
        }

        // =========================
        // USERS
        // =========================

        // Follow / unfollow
        if ("POST".equals(method)
                && uri.matches("/api/users/[^/]+/follow")) {
            return FOLLOW_RULE;
        }

        // =========================
        // EVERYTHING ELSE
        // =========================

        return GLOBAL_RULE;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        RateLimitRule rule = getRule(request);

        // No rate-limit rule for this request.
        if (rule == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = request.getRemoteAddr();

        Bucket bucket = resolveBucket(clientIp, rule);

        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

        if (probe.isConsumed()) {

            response.setHeader(
                    "X-RateLimit-Limit",
                    String.valueOf(rule.capacity()));

            response.setHeader(
                    "X-RateLimit-Remaining",
                    String.valueOf(probe.getRemainingTokens()));

            filterChain.doFilter(request, response);
            return;
        }

        long retryAfterSeconds = Math.max(
                1,
                (long) Math.ceil(
                        probe.getNanosToWaitForRefill()
                                / 1_000_000_000.0));

        response.setStatus(TOO_MANY_REQUESTS);
        response.setContentType("application/json");

        response.setHeader(
                "Retry-After",
                String.valueOf(retryAfterSeconds));

        response.setHeader(
                "X-RateLimit-Limit",
                String.valueOf(rule.capacity()));

        response.setHeader(
                "X-RateLimit-Remaining",
                "0");

        response.getWriter().write("""
                {
                  "status": 429,
                  "error": "Too Many Requests",
                  "message": "Rate limit exceeded. Please try again later."
                }
                """);
    }
}