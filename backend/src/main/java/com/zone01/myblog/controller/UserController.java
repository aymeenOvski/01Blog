package com.zone01.myblog.controller;

import com.zone01.myblog.dto.UpdateProfileInfoRequest;
import com.zone01.myblog.dto.UpdateProfileSecurityRequest;
import com.zone01.myblog.dto.UserProfileResponse;
import com.zone01.myblog.dto.UserSecurityResponse;
import com.zone01.myblog.service.UserService;
import jakarta.validation.Valid;

import java.security.Principal;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable String username) {
        return ResponseEntity.ok(userService.getUserProfile(username));
    }

    @PutMapping("/profile/info")
    public ResponseEntity<UserProfileResponse> updateProfileInfo(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileInfoRequest request) {

        return ResponseEntity.ok(userService.updateProfileInfo(userDetails.getUsername(), request));
    }

    @PutMapping("/profile/security")
    public ResponseEntity<UserSecurityResponse> updateProfileSecurity(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileSecurityRequest request) {

        return ResponseEntity.ok(userService.updateProfileSecurity(userDetails.getUsername(), request));
    }

    @PostMapping("/upload-avatar")
    public ResponseEntity<UserProfileResponse> uploadAvatar(@RequestParam("file") MultipartFile file, Principal principal) {
        UserProfileResponse updatedProfile = userService.updateAvatar(principal.getName(), file);
        return ResponseEntity.ok(updatedProfile);
    }
}
