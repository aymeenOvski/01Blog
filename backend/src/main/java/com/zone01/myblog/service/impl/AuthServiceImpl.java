package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.AuthResponse;
import com.zone01.myblog.dto.LoginRequest;
import com.zone01.myblog.dto.RegisterRequest;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.security.jwt.JwtUtils;
import com.zone01.myblog.security.services.UserDetailsImpl;
import com.zone01.myblog.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthServiceImpl implements AuthService {

    private static final String DEFAULT_ROLE = "ROLE_USER";

    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final UserRepository userRepository;

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           PasswordEncoder passwordEncoder,
                           JwtUtils jwtUtils,
                           UserRepository userRepository) {
        this.authenticationManager = authenticationManager;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
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

    @Override
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
