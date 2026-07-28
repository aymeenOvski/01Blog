package com.zone01.myblog.service;

import com.zone01.myblog.dto.AuthResponse;
import com.zone01.myblog.dto.LoginRequest;
import com.zone01.myblog.dto.RegisterRequest;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.security.jwt.JwtUtils;
import com.zone01.myblog.security.services.UserDetailsImpl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final String DEFAULT_ROLE = "ROLE_USER";

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UserRepository userRepository;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username is already taken");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
        }

        Users user = new Users(
                request.username(),
                request.email(),
                passwordEncoder.encode(request.password()),
                DEFAULT_ROLE,
                request.bio(),
                request.avatarUrl()
        );

        Users savedUser = userRepository.save(user);
        UserDetailsImpl userPrincipal = UserDetailsImpl.build(savedUser);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
            userPrincipal,
            null,
            userPrincipal.getAuthorities()
        );

        String token = jwtUtils.generateJwtToken(authentication);
        String role = userPrincipal.getRole();

        return new AuthResponse(token, authentication.getName(), role);
    }

    public AuthResponse login(LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );

            String token = jwtUtils.generateJwtToken(authentication);
            String role = ((UserDetailsImpl) authentication.getPrincipal()).getRole();

            return new AuthResponse(token, authentication.getName(), role);
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
    }
}