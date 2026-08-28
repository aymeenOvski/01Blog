package com.zone01.myblog.dto;

import java.time.Instant;

public record NotificationResponse(
    Long id,
    String actorUsername,
    String actorAvatarUrl,
    String type,
    String message,
    Long targetId,
    boolean isRead,
    Instant createdAt
) {}