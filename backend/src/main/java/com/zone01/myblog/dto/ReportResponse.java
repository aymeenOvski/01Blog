package com.zone01.myblog.dto;

import java.time.Instant;

public record ReportResponse(
    Long id,
    String type,
    Long targetUserId,
    Long targetPostId,
    String reporterUsername,
    String targetUsername,
    String reason,
    String status,
    Instant createdAt
) {}