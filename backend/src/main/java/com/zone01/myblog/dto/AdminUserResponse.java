package com.zone01.myblog.dto;

import java.sql.Timestamp;

public record AdminUserResponse(
        Long id,
        String username,
        String email,
        String role,
        String status,
        String avatarUrl,
        Timestamp createdAt
) {
}