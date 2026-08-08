package com.zone01.myblog.dto;

public record UserProfileResponse(
    String username,
    String bio,
    String avatarUrl,
    boolean isOwner
) {}
