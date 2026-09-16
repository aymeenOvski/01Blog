package com.zone01.myblog.security.jwt;

import java.io.IOException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.model.Users;

public class AuthTokenFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = parseJWT(request);
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);

                // Load the application user from PostgreSQL.
                Users user = userRepository.findByUsername(username)
                        .orElseThrow(() -> new UsernameNotFoundException(
                                "User not found: " + username));

                // A banned user must not become authenticated.
                if ("BANNED".equalsIgnoreCase(user.getStatus())) {
                    response.sendError(
                            HttpServletResponse.SC_UNAUTHORIZED,
                            "Account is banned");
                    return;
                }

                // Fetch user credentials & roles from the database
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                // Build the authenticated authentication object
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                // Attach HTTP request metadata (e.g., IP address, session details)
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Register authentication in Spring's SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

        } catch (UsernameNotFoundException e) {
            logger.error("User in JWT no longer exists in database: {}", e);
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e);
        }

        filterChain.doFilter(request, response);
    }

    private String parseJWT(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }
        return null;
    }
}
