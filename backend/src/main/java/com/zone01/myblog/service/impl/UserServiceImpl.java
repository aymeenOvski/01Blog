package com.zone01.myblog.service.impl;

import com.zone01.myblog.dto.UpdateProfileInfoRequest;
import com.zone01.myblog.dto.UpdateProfileSecurityRequest;
import com.zone01.myblog.dto.UserProfileResponse;
import com.zone01.myblog.dto.UserSecurityResponse;
import com.zone01.myblog.exception.BlogApiException;
import com.zone01.myblog.model.Users;
import com.zone01.myblog.repository.UserRepository;
import com.zone01.myblog.security.jwt.JwtUtils;
import com.zone01.myblog.service.FileStorageService;
import com.zone01.myblog.service.UserService;

import org.apache.tika.Tika;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final FileStorageService fileStorageService;

    private final Tika tika = new Tika();
    private static final List<String> ALLOWED_AVATAR_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "image/webp"
    );

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtils jwtUtils, FileStorageService fileStorageService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtils = jwtUtils;
        this.fileStorageService = fileStorageService;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfile(String username) {
        Users user = userRepository.findByUsername(username)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        return new UserProfileResponse(
                user.getUsername(),
                user.getBio(),
                user.getAvatarUrl(),
                false, // Default to false for public view
                user.getEmail());
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfileInfo(String currentUsername, UpdateProfileInfoRequest request) {
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        boolean usernameChanged = false;

        if (request.username() != null && !request.username().isBlank()) {
            String newUsername = request.username().trim();

            if (!newUsername.equalsIgnoreCase(user.getUsername())) {
                if (userRepository.existsByUsername(newUsername)) {
                    throw BlogApiException.conflict("Username is already taken");
                }
                user.setUsername(newUsername);
                usernameChanged = true;
            }
        }

        if (request.bio() != null) {
            user.setBio(request.bio());
        }

        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        Users updatedUser = userRepository.save(user);

        String newToken = null;
        if (usernameChanged) {
            String userRole = user.getRole() != null ? user.getRole() : "ROLE_USER";
            newToken = jwtUtils.generateTokenFromUsername(updatedUser.getUsername(), userRole);
        }

        return new UserProfileResponse(
                updatedUser.getUsername(),
                updatedUser.getBio(),
                updatedUser.getAvatarUrl(),
                true,
                updatedUser.getEmail(),
                newToken);
    }

    @Override
    @Transactional
    public UserSecurityResponse updateProfileSecurity(String currentUsername, UpdateProfileSecurityRequest request) {
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        if (!passwordEncoder.matches(request.oldPassword(), user.getPasswordHash())) {
            throw BlogApiException.unauthorized("Invalid current password");
        }

        if (request.newPassword() != null && !request.newPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        }

        if (request.email() != null && !request.email().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw BlogApiException.conflict("Email is already in use");
            }
            user.setEmail(request.email());
        }

        Users savedUser = userRepository.save(user);

        return new UserSecurityResponse(
                savedUser.getUsername(),
                savedUser.getEmail(),
                "Security preferences updated successfully");
    }

    @Override
    @Transactional
    public UserProfileResponse updateAvatar(String currentUsername, MultipartFile file) {
        Users user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> BlogApiException.notFound("User not found"));

        if (file == null || file.isEmpty()) {
            throw BlogApiException.badRequest("Please select a file to upload.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            String detectedType = tika.detect(inputStream);
            if (detectedType == null || !ALLOWED_AVATAR_TYPES.contains(detectedType.toLowerCase())) {
                throw BlogApiException.badRequest("Invalid avatar format. Allowed formats: JPEG, PNG, GIF, WEBP");
            }
        } catch (IOException e) {
            throw BlogApiException.badRequest("Failed to inspect uploaded file format");
        }

        // Delete old avatar file from disk if present
        if (user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank()) {
            fileStorageService.deleteAvatar(user.getAvatarUrl());
        }

        String avatarPath = fileStorageService.storeAvatar(file);
        user.setAvatarUrl(avatarPath);
        userRepository.save(user);

        return new UserProfileResponse(user.getUsername(), user.getBio(), user.getAvatarUrl(), true, user.getEmail());
    }
}
