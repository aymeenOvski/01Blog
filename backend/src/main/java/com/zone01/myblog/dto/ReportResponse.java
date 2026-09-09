package com.zone01.myblog.dto;

import java.time.Instant;

public record ReportResponse(
    Long id,
    String reporterUsername,
    String targetUsername,
    String reason,
    String status,
    Instant createdAt
) {}