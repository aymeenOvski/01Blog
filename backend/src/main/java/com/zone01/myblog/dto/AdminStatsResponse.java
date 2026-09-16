package com.zone01.myblog.dto;

public record AdminStatsResponse(
        long totalUsers,
        long bannedUsers,
        long totalPosts,
        long hiddenPosts,
        long pendingReports
) {
}