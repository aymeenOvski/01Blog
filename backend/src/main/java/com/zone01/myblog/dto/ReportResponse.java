package com.zone01.myblog.dto;

import com.zone01.myblog.model.enums.ReportReason;
import java.time.Instant;

public record ReportResponse(
    Long id,
    String type,
    Long targetUserId,
    Long targetPostId,
    String reporterUsername,
    String targetUsername,
    ReportReason reason,
    String description,
    String status,
    Instant createdAt
) {}