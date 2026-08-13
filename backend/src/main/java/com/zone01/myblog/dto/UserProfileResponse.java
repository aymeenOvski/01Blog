package com.zone01.myblog.dto;

public record UserProfileResponse(
    String username,
    String bio,
    String avatarUrl,
    boolean isOwner,
    String email,
    String token
) {
    public UserProfileResponse(String username, String bio, String avatarUrl, boolean isOwner, String email) {
        this(username, bio, avatarUrl, isOwner, email, null);
    }
}
