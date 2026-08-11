package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.UpdateProfileInfoRequest;
import com.zone01.myblog.dto.UpdateProfileSecurityRequest;
import com.zone01.myblog.dto.UserProfileResponse;
import com.zone01.myblog.dto.UserSecurityResponse;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String username) {
        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return new UserProfileResponse(
                user.getUsername(),
                user.getBio(),
                user.getAvatarUrl(),
                false, // Default to false for public view
                user.getEmail()
        );
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfileInfo(String currentUsername, UpdateProfileInfoRequest request) {
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.bio() != null) {
            user.setBio(request.bio());
        }
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        Users updatedUser = userRepository.save(user);

        return new UserProfileResponse(
                updatedUser.getUsername(),
                updatedUser.getBio(),
                updatedUser.getAvatarUrl(),
                true, // Set to true because the user is updating their own profile
                updatedUser.getEmail()
        );
    }

    @Override
    @Transactional
    public UserSecurityResponse updateProfileSecurity(String currentUsername, UpdateProfileSecurityRequest request) {
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid current password");
        }

        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        if (request.email() != null && !request.email().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Email is already in use");
            }
            user.setEmail(request.email());
        }

        Users savedUser = userRepository.save(user);

        return new UserSecurityResponse(
                savedUser.getEmail(),
                "Security preferences updated successfully");
    }
}
