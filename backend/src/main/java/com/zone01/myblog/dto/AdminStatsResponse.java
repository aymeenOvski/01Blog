package com.zone01.myblog.dto;

public record AdminStatsResponse(
    long totalUsers,
    long totalPosts,
    long pendingReports
) {}