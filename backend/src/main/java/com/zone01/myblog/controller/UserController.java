package com.zone01.myblog.controller;

import com.zone01.myblog.dto.UpdateProfileInfoRequest;
import com.zone01.myblog.dto.UpdateProfileSecurityRequest;
import com.zone01.myblog.dto.UserProfileResponse;
import com.zone01.myblog.dto.UserSecurityResponse;
import com.zone01.myblog.dto.UserSummaryResponse;
import com.zone01.myblog.service.FollowService;
import com.zone01.myblog.service.UserService;
import jakarta.validation.Valid;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final FollowService followService;

    public UserController(UserService userService, FollowService followService) {
        this.userService = userService;
        this.followService = followService;
    }

    @GetMapping("/{username}")
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @PathVariable String username,
            @AuthenticationPrincipal UserDetails userDetails) {
        String currentUsername = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(userService.getUserProfile(username, currentUsername));
    }

    @GetMapping("/suggested")
    public ResponseEntity<List<UserSummaryResponse>> getSuggestedUsers(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(followService.getSuggestedUsers(userDetails.getUsername()));
    }

    @PostMapping("/{username}/follow")
    public ResponseEntity<Boolean> toggleFollow(
            @PathVariable String username,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(followService.toggleFollow(username, userDetails.getUsername()));
    }

    @GetMapping("/{username}/following")
    public ResponseEntity<List<UserSummaryResponse>> getFollowing(@PathVariable String username) {
        return ResponseEntity.ok(followService.getFollowing(username));
    }

    @GetMapping("/{username}/followers")
    public ResponseEntity<List<UserSummaryResponse>> getFollowers(@PathVariable String username) {
        return ResponseEntity.ok(followService.getFollowers(username));
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
