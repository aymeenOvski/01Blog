package com.zone01.myblog.dto;

public record UserProfileResponse(
    String username,
    String bio,
    String avatarUrl,
    boolean isOwner,
    String email,
    String token,
    long followersCount,
    long followingCount,
    boolean isFollowing
) {
    public UserProfileResponse(String username, String bio, String avatarUrl, boolean isOwner, String email) {
        this(username, bio, avatarUrl, isOwner, email, null, 0, 0, false);
    }

    public UserProfileResponse(String username, String bio, String avatarUrl, boolean isOwner, String email, String token) {
        this(username, bio, avatarUrl, isOwner, email, token, 0, 0, false);
    }
}
