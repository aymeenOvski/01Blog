package com.zone01.myblog.dto;

import java.time.Instant;
import com.zone01.myblog.model.Notification;

public record NotificationResponse(
        Long id,
        String actorUsername,
        String actorAvatarUrl,
        String type,
        String message,
        Long targetId,
        boolean isRead,
        Instant createdAt) {
    public static NotificationResponse fromEntity(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getActor().getUsername(),
                notification.getActor().getAvatarUrl(),
                notification.getType(),
                notification.getMessage(),
                notification.getTargetId(),
                notification.isRead(),
                notification.getCreatedAt());
    }
}